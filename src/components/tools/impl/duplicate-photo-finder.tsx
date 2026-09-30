"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input, Select } from "@/components/ui/primitives";
import {
  CopyButton,
  DownloadButton,
  Field,
  Notice,
  Stat,
  FileDrop,
} from "@/components/tools/shared";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type CompareMode = "similar" | "exact";
type HashMethod = "dhash" | "ahash" | "both";
type KeepStrategy = "highest-res" | "largest" | "smallest" | "newest" | "oldest" | "shortest-path" | "longest-path" | "alphabetical";
type GroupSort = "waste" | "count" | "similarity";

type PhotoInfo = {
  id: string;
  path: string;
  name: string;
  folder: string;
  size: number;
  modified: number;
  width: number;
  height: number;
  thumbUrl: string;
  aHash: bigint;
  dHash: bigint;
  exactHash: string;
};

type ScanProgress = {
  total: number;
  done: number;
  current: string;
};

const HASH_SIZE = 8;
const HASH_CHUNK = 256 * 1024;

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const fmtDate = (ms: number) => new Date(ms).toLocaleString();

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,.heic,.heif";

function hamming(a: bigint, b: bigint) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    n += Number(x & 1n);
    x >>= 1n;
  }
  return n;
}

function folderOf(path: string) {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

function pixels(p: PhotoInfo) {
  return p.width * p.height;
}

function sortGroup(g: PhotoInfo[], strategy: KeepStrategy, pinned: Set<string>) {
  const rank = (a: PhotoInfo, b: PhotoInfo) => {
    const pin = Number(pinned.has(b.id)) - Number(pinned.has(a.id));
    if (pin) return pin;
    switch (strategy) {
      case "largest":
        return b.size - a.size || b.modified - a.modified;
      case "smallest":
        return a.size - b.size || b.modified - a.modified;
      case "highest-res":
        return pixels(b) - pixels(a) || b.size - a.size;
      case "oldest":
        return a.modified - b.modified || a.path.localeCompare(b.path);
      case "shortest-path":
        return a.path.length - b.path.length || a.path.localeCompare(b.path);
      case "longest-path":
        return b.path.length - a.path.length || a.path.localeCompare(b.path);
      case "alphabetical":
        return a.path.localeCompare(b.path);
      default:
        return b.modified - a.modified || a.path.localeCompare(b.path);
    }
  };
  return [...g].sort(rank);
}

function keepLabel(strategy: KeepStrategy, pinned: boolean) {
  if (pinned) return "Keep (you pinned this)";
  switch (strategy) {
    case "largest":
      return "Keep (largest file)";
    case "smallest":
      return "Keep (smallest file)";
    case "highest-res":
      return "Keep (highest resolution)";
    case "oldest":
      return "Keep (oldest)";
    case "shortest-path":
      return "Keep (shortest path)";
    case "longest-path":
      return "Keep (longest path)";
    case "alphabetical":
      return "Keep (A→Z)";
    default:
      return "Keep (newest)";
  }
}

function similarityPercent(distance: number) {
  return Math.max(0, Math.round((1 - distance / 64) * 100));
}

async function fileToBitmap(file: File): Promise<{ bitmap: ImageBitmap; width: number; height: number }> {
  if (/\.heic$|\.heif$/i.test(file.name) || /heic|heif/i.test(file.type)) {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.88 });
    const blob = Array.isArray(out) ? out[0] : out;
    const bitmap = await createImageBitmap(blob);
    return { bitmap, width: bitmap.width, height: bitmap.height };
  }
  const bitmap = await createImageBitmap(file);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

function differenceHash(bitmap: ImageBitmap): bigint {
  const width = HASH_SIZE + 1;
  const height = HASH_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const gray = (x: number, y: number) => {
    const o = (y * width + x) * 4;
    return data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114;
  };
  let hash = 0n;
  let bit = 63;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      if (gray(x, y) > gray(x + 1, y)) hash |= 1n << BigInt(bit);
      bit -= 1;
    }
  }
  return hash;
}

function perceptualHash(bitmap: ImageBitmap): bigint {
  const canvas = document.createElement("canvas");
  canvas.width = HASH_SIZE;
  canvas.height = HASH_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, HASH_SIZE, HASH_SIZE);
  const { data } = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);
  const gray = new Array(HASH_SIZE * HASH_SIZE);
  let sum = 0;
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    const g = data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114;
    gray[i] = g;
    sum += g;
  }
  const avg = sum / gray.length;
  let hash = 0n;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] >= avg) hash |= 1n << BigInt(gray.length - 1 - i);
  }
  return hash;
}

async function exactHash(file: File, cancelled: () => boolean) {
  const { createMD5 } = await import("hash-wasm");
  const hasher = await createMD5();
  for (let offset = 0; offset < file.size; offset += HASH_CHUNK) {
    if (cancelled()) throw new DOMException("Scan cancelled", "AbortError");
    const chunk = file.slice(offset, Math.min(offset + HASH_CHUNK, file.size));
    hasher.update(new Uint8Array(await chunk.arrayBuffer()));
  }
  return hasher.digest("hex");
}

function visualDistance(a: PhotoInfo, b: PhotoInfo, method: HashMethod) {
  const da = hamming(a.aHash, b.aHash);
  const dd = hamming(a.dHash, b.dHash);
  if (method === "ahash") return da;
  if (method === "dhash") return dd;
  return Math.max(da, dd);
}

function clusterPhotos(
  items: PhotoInfo[],
  mode: CompareMode,
  method: HashMethod,
  threshold: number,
  sameFolder: boolean,
) {
  const n = items.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const unite = (a: number, b: number) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[b] = a;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (sameFolder && items[i].folder !== items[j].folder) continue;
      const match =
        mode === "exact"
          ? items[i].exactHash === items[j].exactHash
          : visualDistance(items[i], items[j], method) <= threshold;
      if (match) unite(i, j);
    }
  }

  const buckets = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const arr = buckets.get(root) ?? [];
    arr.push(i);
    buckets.set(root, arr);
  }
  return [...buckets.values()]
    .filter((idxs) => idxs.length > 1)
    .map((idxs) => idxs.map((i) => items[i]));
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
  cancelled: () => boolean,
) {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        if (cancelled()) throw new DOMException("Scan cancelled", "AbortError");
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

function isImageFile(f: File) {
  if (f.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name);
}

export function DuplicatePhotoFinder() {
  const [photos, setPhotos] = React.useState<PhotoInfo[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<ScanProgress | null>(null);
  const [compareMode, setCompareMode] = React.useState<CompareMode>("similar");
  const [hashMethod, setHashMethod] = React.useState<HashMethod>("dhash");
  const [sensitivity, setSensitivity] = React.useState("5");
  const [keepStrategy, setKeepStrategy] = React.useState<KeepStrategy>("highest-res");
  const [sameFolder, setSameFolder] = React.useState(false);
  const [minKb, setMinKb] = React.useState("0");
  const [groupSort, setGroupSort] = React.useState<GroupSort>("waste");
  const [query, setQuery] = React.useState("");
  const [pinned, setPinned] = React.useState<Set<string>>(new Set());
  const [workers, setWorkers] = React.useState("3");
  const [exportFmt, setExportFmt] = React.useState<"txt" | "json" | "csv">("txt");
  const [collapsed, setCollapsed] = React.useState<Set<number>>(new Set());
  const cancelRef = React.useRef(false);
  const folderRef = React.useRef<HTMLInputElement>(null);
  const urlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    return () => {
      for (const u of urlsRef.current) URL.revokeObjectURL(u);
    };
  }, []);

  const trackUrl = (url: string) => {
    urlsRef.current.push(url);
    return url;
  };

  const scanFiles = async (incoming: File[]) => {
    const files = incoming.filter(isImageFile);
    if (!files.length) return;

    cancelRef.current = false;
    setBusy(true);
    setProgress({ total: files.length, done: 0, current: "" });

    const concurrency = Math.min(6, Math.max(1, Number(workers) || 3));
    let done = 0;

    try {
      const scanned = await mapPool(
        files,
        concurrency,
        async (file) => {
          const path = file.webkitRelativePath || file.name;
          setProgress((p) => (p ? { ...p, current: path } : p));
          const thumbUrl = trackUrl(URL.createObjectURL(file));
          const { bitmap, width, height } = await fileToBitmap(file);
          const aHash = perceptualHash(bitmap);
          const dHash = differenceHash(bitmap);
          bitmap.close();
          const hash = await exactHash(file, () => cancelRef.current);
          done += 1;
          setProgress((p) => (p ? { ...p, done, current: path } : p));
          return {
            id: `${path}-${file.size}-${file.lastModified}`,
            path,
            name: file.name,
            folder: folderOf(path),
            size: file.size,
            modified: file.lastModified,
            width,
            height,
            thumbUrl,
            aHash,
            dHash,
            exactHash: hash,
          } satisfies PhotoInfo;
        },
        () => cancelRef.current,
      );

      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...scanned.filter((p) => !seen.has(p.id))];
      });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) console.error(err);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const clearAll = () => {
    for (const u of urlsRef.current) URL.revokeObjectURL(u);
    urlsRef.current = [];
    setPhotos([]);
    setPinned(new Set());
    setCollapsed(new Set());
    setQuery("");
  };

  const threshold = Math.min(20, Math.max(0, Number(sensitivity) || 5));
  const minBytes = Math.max(0, Number(minKb) || 0) * 1024;

  const { groups, deleteList, wasted, uniqueCount, skippedSmall } = React.useMemo(() => {
    const pool = photos.filter((p) => p.size >= minBytes);
    const raw = clusterPhotos(pool, compareMode, hashMethod, threshold, sameFolder);
    const q = query.trim().toLowerCase();
    const groups = raw
      .map((g) => sortGroup(g, keepStrategy, pinned))
      .filter((g) => !q || g.some((f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (groupSort === "count") return b.length - a.length;
        if (groupSort === "similarity") {
          const sim = (g: PhotoInfo[]) =>
            compareMode === "exact"
              ? 100
              : Math.min(...g.slice(1).map((f) => similarityPercent(visualDistance(g[0], f, hashMethod))));
          return sim(b) - sim(a);
        }
        return b.slice(1).reduce((s, f) => s + f.size, 0) - a.slice(1).reduce((s, f) => s + f.size, 0);
      });
    const deleteList = groups.flatMap((g) => g.slice(1));
    const wasted = deleteList.reduce((s, f) => s + f.size, 0);
    return {
      groups,
      deleteList,
      wasted,
      uniqueCount: pool.length - deleteList.length,
      skippedSmall: photos.length - pool.length,
    };
  }, [photos, compareMode, hashMethod, threshold, keepStrategy, sameFolder, minBytes, groupSort, query, pinned]);

  const exportPayload = React.useMemo(() => {
    if (!deleteList.length) return "";
    if (exportFmt === "json") {
      return JSON.stringify(
        deleteList.map((f) => ({
          path: f.path,
          size: f.size,
          modified: new Date(f.modified).toISOString(),
          dimensions: `${f.width}×${f.height}`,
          megapixels: Number((pixels(f) / 1_000_000).toFixed(2)),
        })),
        null,
        2,
      );
    }
    if (exportFmt === "csv") {
      const lines = ["path,bytes,width,height,modified"];
      for (const f of deleteList) {
        lines.push(`"${f.path.replace(/"/g, '""')}",${f.size},${f.width},${f.height},${new Date(f.modified).toISOString()}`);
      }
      return lines.join("\n");
    }
    return deleteList.map((f) => f.path).join("\n");
  }, [deleteList, exportFmt]);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <FileDrop
          multiple
          accept={IMAGE_ACCEPT}
          onFiles={scanFiles}
          label="Drop photos to scan (JPG, PNG, WebP, HEIC — never uploaded)"
        />
        <div
          onClick={() => folderRef.current?.click()}
          className="glass flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/80 p-10 text-center transition-all duration-300 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
            <Icon name="Archive" className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium">Select a photo folder to scan</p>
          <p className="text-xs text-muted">Ideal for camera rolls &amp; Downloads folders</p>
          <input
            ref={folderRef}
            type="file"
            multiple
            accept={IMAGE_ACCEPT}
            className="hidden"
            {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
            onChange={(e) => {
              if (e.target.files) void scanFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Detection mode">
          <Select value={compareMode} onChange={(e) => setCompareMode(e.target.value as CompareMode)}>
            <option value="similar">Similar photos (visual hash)</option>
            <option value="exact">Exact duplicates (MD5 byte hash)</option>
          </Select>
        </Field>
        {compareMode === "similar" && (
          <>
            <Field label="Visual hash">
              <Select value={hashMethod} onChange={(e) => setHashMethod(e.target.value as HashMethod)}>
                <option value="dhash">Difference hash — crops, brightness, WhatsApp saves</option>
                <option value="ahash">Average hash — resized copies</option>
                <option value="both">Both must agree — fewer false matches</option>
              </Select>
            </Field>
            <Field label={`Similarity threshold (0–20) — ${threshold}`}>
              <Input
                type="range"
                min={0}
                max={20}
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">
                0–3 near copies. 5 balanced. 8–12 resized or recompressed. Higher also groups burst frames.
              </p>
            </Field>
          </>
        )}
        <Field label="Photo to keep in each group">
          <Select value={keepStrategy} onChange={(e) => setKeepStrategy(e.target.value as KeepStrategy)}>
            <option value="highest-res">Highest resolution</option>
            <option value="largest">Largest file</option>
            <option value="newest">Newest modified</option>
            <option value="oldest">Oldest modified</option>
            <option value="smallest">Smallest file</option>
            <option value="shortest-path">Shortest path</option>
            <option value="longest-path">Longest path</option>
            <option value="alphabetical">First alphabetically</option>
          </Select>
        </Field>
        <Field label="Ignore files smaller than (KB)">
          <Input type="number" min={0} value={minKb} onChange={(e) => setMinKb(e.target.value)} />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={sameFolder} onChange={(e) => setSameFolder(e.target.checked)} />
          Only match photos in the same folder
        </label>
        <Field label="Parallel workers">
          <Select value={workers} onChange={(e) => setWorkers(e.target.value)}>
            {[1, 2, 3, 4, 6].map((n) => (
              <option key={n} value={String(n)}>
                {n} worker{n === 1 ? "" : "s"}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {busy && progress && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>
              Analyzing {progress.done}/{progress.total} photos…
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={() => { cancelRef.current = true; }}>
              Cancel
            </Button>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand transition-all duration-200"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          {progress.current && <p className="truncate font-mono text-xs text-muted">{progress.current}</p>}
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Photos scanned" value={photos.length} />
          <Stat label="Unique in view" value={uniqueCount} />
          <Stat label="Duplicate groups" value={groups.length} />
          <Stat label="Space to reclaim" value={fmtBytes(wasted)} />
        </div>
      )}

      {skippedSmall > 0 && (
        <Notice tone="info">{skippedSmall} photo{skippedSmall === 1 ? "" : "s"} under {minKb || 0} KB are ignored.</Notice>
      )}

      {photos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Filter groups by filename">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="vacation, IMG_, screenshot…" />
          </Field>
          <Field label="Sort groups">
            <Select value={groupSort} onChange={(e) => setGroupSort(e.target.value as GroupSort)}>
              <option value="waste">Most space first</option>
              <option value="count">Largest groups first</option>
              <option value="similarity">Closest matches first</option>
            </Select>
          </Field>
        </div>
      )}

      {photos.length > 0 && groups.length === 0 && !busy && (
        <Notice tone="success">No duplicate or similar photos found in this batch.</Notice>
      )}

      {deleteList.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
          <Field label="Export delete list" className="min-w-[10rem] flex-1">
            <Select value={exportFmt} onChange={(e) => setExportFmt(e.target.value as typeof exportFmt)}>
              <option value="txt">Plain text (paths)</option>
              <option value="csv">CSV (size and dimensions)</option>
              <option value="json">JSON (metadata)</option>
            </Select>
          </Field>
          <CopyButton value={exportPayload} label="Copy list" />
          <DownloadButton
            value={exportPayload}
            filename={`duplicate-photos-to-delete.${exportFmt}`}
            mime={exportFmt === "json" ? "application/json" : exportFmt === "csv" ? "text/csv" : "text/plain"}
          />
        </div>
      )}

      {groups.length > 1 && (
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setCollapsed(new Set())}>Expand all</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCollapsed(new Set(groups.map((_, i) => i)))}>Collapse all</Button>
        </div>
      )}

      {groups.map((g, i) => {
        const groupWaste = g.slice(1).reduce((s, f) => s + f.size, 0);
        const isCollapsed = collapsed.has(i);
        const closest =
          compareMode === "exact"
            ? 100
            : Math.min(...g.slice(1).map((f) => similarityPercent(visualDistance(g[0], f, hashMethod))));
        return (
          <div key={`${g[0].id}-${i}`} className="space-y-3 rounded-xl border border-border p-3">
            <button
              type="button"
              onClick={() =>
                setCollapsed((s) => {
                  const next = new Set(s);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <p className="text-xs font-medium text-muted">
                {g.length} {compareMode === "exact" ? "identical" : "similar"} photos
                {compareMode === "similar" ? ` · ${closest}% match` : ""} · waste {fmtBytes(groupWaste)}
              </p>
              <Icon
                name="ChevronDown"
                className={cn("h-4 w-4 shrink-0 text-muted transition-transform", !isCollapsed && "rotate-180")}
              />
            </button>
            {!isCollapsed && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.map((f, j) => {
                  const match =
                    j === 0 || compareMode === "exact"
                      ? null
                      : similarityPercent(visualDistance(g[0], f, hashMethod));
                  return (
                  <div
                    key={f.id}
                    className="overflow-hidden rounded-lg border border-border bg-surface-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumbUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
                    <div className="space-y-1 p-2.5">
                      <p className="truncate font-mono text-xs">{f.path}</p>
                      <p className="text-xs text-muted">
                        {fmtBytes(f.size)} · {f.width}×{f.height} · {(pixels(f) / 1_000_000).toFixed(1)} MP · {fmtDate(f.modified)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {j === 0 ? (
                          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                            {keepLabel(keepStrategy, pinned.has(f.id))}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">
                            Safe to delete{match != null ? ` · ${match}% similar` : ""}
                          </span>
                        )}
                        <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => togglePin(f.id)}>
                          {pinned.has(f.id) ? "Unpin" : "Pin as keep"}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {photos.length > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          Clear all results
        </Button>
      )}

      <p className={cn("flex items-start gap-2 text-xs text-muted")}>
        <Icon name="Lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Photos stay on this device. Similar mode uses difference hash, average hash, or both, plus an MD5 check for exact copies.
          Pin a photo to force-keep it. Pair with the{" "}
          <Link href="/developer-tools/duplicate-file-finder" className="text-brand hover:underline">
            Duplicate File Finder
          </Link>{" "}
          for other file types, or read{" "}
          <Link href="/blog/duplicate-photo-finder-online-free-storage" className="text-brand hover:underline">
            how to free storage from similar photos
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
