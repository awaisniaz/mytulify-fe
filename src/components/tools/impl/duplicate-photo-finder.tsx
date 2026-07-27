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
type KeepStrategy = "newest" | "oldest" | "shortest-path" | "longest-path" | "alphabetical";

type PhotoInfo = {
  id: string;
  path: string;
  name: string;
  size: number;
  modified: number;
  width: number;
  height: number;
  thumbUrl: string;
  pHash: bigint;
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

function sortGroup(g: PhotoInfo[], strategy: KeepStrategy) {
  const sorted = [...g];
  switch (strategy) {
    case "oldest":
      return sorted.sort((a, b) => a.modified - b.modified || a.path.localeCompare(b.path));
    case "shortest-path":
      return sorted.sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));
    case "longest-path":
      return sorted.sort((a, b) => b.path.length - a.path.length || a.path.localeCompare(b.path));
    case "alphabetical":
      return sorted.sort((a, b) => a.path.localeCompare(b.path));
    default:
      return sorted.sort((a, b) => b.modified - a.modified || a.path.localeCompare(b.path));
  }
}

function keepLabel(strategy: KeepStrategy) {
  switch (strategy) {
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

function clusterPhotos(items: PhotoInfo[], mode: CompareMode, threshold: number) {
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
      const match =
        mode === "exact"
          ? items[i].exactHash === items[j].exactHash
          : hamming(items[i].pHash, items[j].pHash) <= threshold;
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
  const [sensitivity, setSensitivity] = React.useState("5");
  const [keepStrategy, setKeepStrategy] = React.useState<KeepStrategy>("newest");
  const [workers, setWorkers] = React.useState("3");
  const [exportFmt, setExportFmt] = React.useState<"txt" | "json">("txt");
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
          const pHash = perceptualHash(bitmap);
          bitmap.close();
          const hash = await exactHash(file, () => cancelRef.current);
          done += 1;
          setProgress((p) => (p ? { ...p, done, current: path } : p));
          return {
            id: `${path}-${file.size}-${file.lastModified}`,
            path,
            name: file.name,
            size: file.size,
            modified: file.lastModified,
            width,
            height,
            thumbUrl,
            pHash,
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
    setCollapsed(new Set());
  };

  const threshold = Math.min(20, Math.max(0, Number(sensitivity) || 5));

  const { groups, deleteList, wasted, uniqueCount } = React.useMemo(() => {
    const raw = clusterPhotos(photos, compareMode, threshold);
    const groups = raw
      .map((g) => sortGroup(g, keepStrategy))
      .sort(
        (a, b) =>
          b.slice(1).reduce((s, f) => s + f.size, 0) - a.slice(1).reduce((s, f) => s + f.size, 0),
      );
    const deleteList = groups.flatMap((g) => g.slice(1));
    const wasted = deleteList.reduce((s, f) => s + f.size, 0);
    return { groups, deleteList, wasted, uniqueCount: photos.length - deleteList.length };
  }, [photos, compareMode, threshold, keepStrategy]);

  const exportPayload = React.useMemo(() => {
    if (!deleteList.length) return "";
    if (exportFmt === "json") {
      return JSON.stringify(
        deleteList.map((f) => ({
          path: f.path,
          size: f.size,
          modified: f.modified,
          dimensions: `${f.width}×${f.height}`,
        })),
        null,
        2,
      );
    }
    return deleteList.map((f) => f.path).join("\n");
  }, [deleteList, exportFmt]);

  const keepTag = keepLabel(keepStrategy);

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
            <option value="similar">Similar photos (perceptual hash)</option>
            <option value="exact">Exact duplicates (byte hash)</option>
          </Select>
        </Field>
        {compareMode === "similar" && (
          <Field label={`Similarity threshold (0–20) — ${threshold}`}>
            <Input
              type="range"
              min={0}
              max={20}
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              Lower = stricter (near-identical). Higher = catches resized or re-saved copies.
            </p>
          </Field>
        )}
        <Field label="Photo to keep in each group">
          <Select value={keepStrategy} onChange={(e) => setKeepStrategy(e.target.value as KeepStrategy)}>
            <option value="newest">Newest modified</option>
            <option value="oldest">Oldest modified</option>
            <option value="shortest-path">Shortest path</option>
            <option value="longest-path">Longest path</option>
            <option value="alphabetical">First alphabetically</option>
          </Select>
        </Field>
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
          <Stat label="Unique photos" value={uniqueCount} />
          <Stat label="Duplicate groups" value={groups.length} />
          <Stat label="Space to reclaim" value={fmtBytes(wasted)} />
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
              <option value="json">JSON (metadata)</option>
            </Select>
          </Field>
          <CopyButton value={exportPayload} label="Copy list" />
          <DownloadButton
            value={exportPayload}
            filename={`duplicate-photos-to-delete.${exportFmt}`}
            mime={exportFmt === "json" ? "application/json" : "text/plain"}
          />
        </div>
      )}

      {groups.map((g, i) => {
        const groupWaste = g.slice(1).reduce((s, f) => s + f.size, 0);
        const isCollapsed = collapsed.has(i);
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
                {g.length} {compareMode === "exact" ? "identical" : "similar"} photos · waste{" "}
                {fmtBytes(groupWaste)}
              </p>
              <Icon
                name="ChevronDown"
                className={cn("h-4 w-4 shrink-0 text-muted transition-transform", !isCollapsed && "rotate-180")}
              />
            </button>
            {!isCollapsed && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.map((f, j) => (
                  <div
                    key={f.id}
                    className="overflow-hidden rounded-lg border border-border bg-surface-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.thumbUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
                    <div className="space-y-1 p-2.5">
                      <p className="truncate font-mono text-xs">{f.path}</p>
                      <p className="text-xs text-muted">
                        {fmtBytes(f.size)} · {f.width}×{f.height} · {fmtDate(f.modified)}
                      </p>
                      {j === 0 ? (
                        <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                          {keepTag}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">
                          Safe to delete
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
          Photos are analyzed locally with perceptual hashing (aHash) and optional MD5 byte matching.
          Nothing is uploaded.           Pair with our{" "}
          <Link href="/developer-tools/duplicate-file-finder" className="text-brand hover:underline">
            Duplicate File Finder
          </Link>{" "}
          for non-image duplicates, or read the{" "}
          <Link href="/blog/find-duplicate-photos-without-uploading" className="text-brand hover:underline">
            duplicate photo cleanup guide
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
