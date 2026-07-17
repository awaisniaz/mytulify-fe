"use client";

import * as React from "react";
import { Button, Select, Input, Textarea } from "@/components/ui/primitives";
import { CopyButton, Field, Notice, FileDrop } from "@/components/tools/shared";
import { AiUsageBanner, notifyUsageUpdated } from "@/components/billing/AiUsageBanner";
import { proHeaders } from "@/lib/billing/client";
import { Icon } from "@/components/ui/Icon";
import { cn, readAsDataURL } from "@/lib/utils";
import { AI_TOOLS, type AiField, type AiInput } from "@/lib/ai/tools";
import { fetchPageHtml } from "@/components/tools/fetch-from-url";

/** Read an image file and downscale it to keep the request payload reasonable. */
async function fileToScaledDataUrl(file: File, maxDim = 1600): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (value) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-border bg-surface-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded handwriting" className="max-h-72 w-full object-contain" />
        </div>
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          Remove image
        </button>
      </div>
    );
  }
  return (
    <FileDrop
      accept="image/*"
      onFiles={async (files) => {
        if (files[0]) onChange(await fileToScaledDataUrl(files[0]));
      }}
      label="Drop an image here or click to upload"
    />
  );
}

/* ------------------------------- field render ------------------------------ */
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: AiField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "image") return null; // handled by <ImageField> upstream
  if (field.type === "select") {
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }
  if (field.type === "text") {
    return (
      <Input
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <Textarea
      value={value}
      placeholder={field.placeholder}
      rows={field.rows ?? 8}
      onChange={(e) => onChange(e.target.value)}
      className={cn(!field.mono && "font-sans")}
    />
  );
}

/* -------------------------------- skeleton --------------------------------- */
function ResultSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {[92, 78, 85, 60, 88, 45].map((w, i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded bg-surface-2"
          style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

/* --------------------------------- main ------------------------------------ */
export function AiTool({ slug }: { slug: string }) {
  const tool = AI_TOOLS[slug];

  const initial = React.useMemo(() => {
    const o: AiInput = {};
    tool?.fields.forEach((f) => {
      o[f.name] = f.type === "select" ? f.default ?? f.options[0]?.value ?? "" : "";
    });
    return o;
  }, [tool]);

  const [values, setValues] = React.useState<AiInput>(initial);
  const [output, setOutput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  if (!tool) return <Notice tone="error">Unknown AI tool.</Notice>;

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  async function run() {
    setError("");
    setOutput("");
    setLoading(true);
    try {
      let payload: AiInput = { ...values };
      if (slug === "ai-seo-page-audit") {
        const pageUrl = payload.pageUrl?.trim() ?? "";
        const html = payload.html?.trim() ?? "";
        if (pageUrl && !html) {
          const page = await fetchPageHtml(pageUrl);
          payload = { ...payload, html: page.html.slice(0, 120_000), pageUrl: page.finalUrl };
        } else if (!pageUrl && !html) {
          setError("Enter a page URL or paste HTML.");
          setLoading(false);
          return;
        }
      }
      const res = await fetch(`/api/ai/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proHeaders() },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        text?: string;
        error?: string;
        code?: string;
        upgradeUrl?: string;
      };
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setOutput(data.text ?? "");
        notifyUsageUpdated();
      }
    } catch (e) {
      setError((e as Error).message || "Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading) run();
    }
  };

  return (
    <div className="space-y-5" onKeyDown={onKeyDown}>
      <AiUsageBanner />

      <div className="grid gap-4">
        {tool.fields.map((f) => (
          <Field key={f.name} label={f.label}>
            {f.type === "image" ? (
              <ImageField value={values[f.name] ?? ""} onChange={(v) => set(f.name, v)} />
            ) : (
              <FieldInput field={f} value={values[f.name] ?? ""} onChange={(v) => set(f.name, v)} />
            )}
          </Field>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={loading}>
          {loading ? (
            <>
              <Icon name="Loader2" className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Icon name="Sparkles" className="h-4 w-4" /> {tool.cta}
            </>
          )}
        </Button>
        <span className="text-xs text-muted">
          or press <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">⌘/Ctrl</kbd> +{" "}
          <kbd className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">Enter</kbd>
        </span>
      </div>

      {error && (
        <Notice tone="error">
          {error}
          {error.includes("Upgrade") && (
            <>
              {" "}
              <a href="/pricing" className="font-semibold underline">
                View Pro plans →
              </a>
            </>
          )}
        </Notice>
      )}

      {(loading || output) && (
        <Field label={tool.outputLabel}>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            {loading ? (
              <ResultSkeleton />
            ) : (
              <pre
                className={cn(
                  "max-h-[32rem] overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed",
                  tool.mono && "font-mono",
                )}
              >
                {output}
              </pre>
            )}
          </div>
          {!loading && output && (
            <div className="mt-2">
              <CopyButton value={output} />
            </div>
          )}
        </Field>
      )}

      <p className="flex items-start gap-2 text-xs text-muted">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Runs on Mytulify&apos;s servers via Groq (free tier + Pro limits). Don&apos;t paste secrets or
          sensitive data. Output may contain mistakes — always review before using.
        </span>
      </p>
    </div>
  );
}
