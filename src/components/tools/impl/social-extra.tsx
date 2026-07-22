"use client";

import * as React from "react";
import { Textarea, Input } from "@/components/ui/primitives";
import { Field, Notice, Output, Stat, CopyButton } from "@/components/tools/shared";
import { ytVideoId } from "@/lib/social-tools";

function extractTagsFromHtml(html: string): string[] {
  const tags: string[] = [];
  const kw = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  if (kw?.[1]) tags.push(...kw[1].split(",").map((t) => t.trim()).filter(Boolean));
  const yt = html.match(/"keywords"\s*:\s*\[([^\]]+)\]/);
  if (yt?.[1]) {
    const found = [...yt[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    tags.push(...found);
  }
  const yt2 = html.match(/"tags"\s*:\s*\[([^\]]+)\]/);
  if (yt2?.[1]) {
    tags.push(...[...yt2[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  }
  const canonical = html.match(/"shortDescription"\s*:\s*"([^"]+)"/);
  if (canonical?.[1] && tags.length === 0) tags.push(canonical[1]);
  return [...new Set(tags)];
}

export function YouTubeTagExtractor() {
  const [input, setInput] = React.useState("");
  const [batch, setBatch] = React.useState("");
  const [format, setFormat] = React.useState<"lines" | "comma" | "hashtags">("lines");
  const tags = React.useMemo(() => extractTagsFromHtml(input), [input]);
  const id = ytVideoId(input);

  const formatted = format === "comma"
    ? tags.join(", ")
    : format === "hashtags"
      ? tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ")
      : tags.join("\n");

  return (
    <div className="space-y-4">
      <Field label="YouTube URL or page source" hint="Paste a video URL with page HTML, or open View Source (Ctrl+U) on YouTube and paste">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder="https://www.youtube.com/watch?v=… or paste page HTML" />
      </Field>
      {id && !input.includes("<") && (
        <Notice tone="info">Video ID detected: {id} — for hidden tags, paste the full page source from the video page.</Notice>
      )}
      {input && (
        tags.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Tags found" value={tags.length} />
              <Stat label="Total chars" value={tags.join(", ").length} />
              <Stat label="Avg length" value={tags.length ? Math.round(tags.join("").length / tags.length) : 0} />
            </div>
            <Field label="Export format">
              <select className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                <option value="lines">One per line</option>
                <option value="comma">Comma separated</option>
                <option value="hashtags">As hashtags</option>
              </select>
            </Field>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">{t}</span>
              ))}
            </div>
            <Output value={formatted} rows={Math.min(14, tags.length + 2)} filename="youtube-tags.txt" mono={false} />
          </>
        ) : (
          <Notice tone="info">No tags found. YouTube often hides tags in the UI — copy the full page source (Ctrl+U) from the video page and paste here.</Notice>
        )
      )}
      <Field label="Batch extract (paste multiple page sources, separated by ---)" hint="Extract tags from several videos at once">
        <Textarea value={batch} onChange={(e) => setBatch(e.target.value)} rows={4} className="font-sans" placeholder="--- paste source 1 ---&#10;--- paste source 2 ---" />
      </Field>
      {batch.includes("---") && (
        <div className="space-y-2">
          {batch.split(/---+/).filter((s) => s.trim()).map((chunk, i) => {
            const t = extractTagsFromHtml(chunk);
            return t.length ? (
              <div key={i} className="rounded-xl border border-border p-3 text-sm">
                <p className="mb-1 font-medium">Video block {i + 1} · {t.length} tags</p>
                <CopyButton value={t.join(", ")} label="Copy" />
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
