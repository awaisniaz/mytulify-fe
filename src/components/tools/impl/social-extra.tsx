"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/primitives";
import { Field, Notice, Output } from "@/components/tools/shared";

function extractTagsFromHtml(html: string): string[] {
  const tags: string[] = [];
  const kw = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  if (kw?.[1]) tags.push(...kw[1].split(",").map((t) => t.trim()).filter(Boolean));
  const yt = html.match(/"keywords"\s*:\s*\[([^\]]+)\]/);
  if (yt?.[1]) {
    const found = [...yt[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    tags.push(...found);
  }
  const canonical = html.match(/"shortDescription"\s*:\s*"([^"]+)"/);
  if (canonical?.[1] && tags.length === 0) tags.push(canonical[1]);
  return [...new Set(tags)];
}

export function YouTubeTagExtractor() {
  const [input, setInput] = React.useState("");
  const tags = React.useMemo(() => extractTagsFromHtml(input), [input]);

  return (
    <div className="space-y-4">
      <Field label="YouTube URL or page source" hint="Paste a video URL, or open View Source on a YouTube page and paste the HTML.">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder="https://www.youtube.com/watch?v=… or paste page HTML" />
      </Field>
      {input && (
        tags.length > 0 ? (
          <Output value={tags.join("\n")} rows={Math.min(12, tags.length + 1)} filename="youtube-tags.txt" mono={false} />
        ) : (
          <Notice tone="info">
            No tags found. YouTube often hides tags — try copying the full page source (Ctrl+U) from the video page.
          </Notice>
        )
      )}
    </div>
  );
}
