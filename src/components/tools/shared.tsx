"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { cn, copyText, download as triggerDownload, readAsDataURL } from "@/lib/utils";

/* -------------------------------- CopyButton ------------------------------- */
export function CopyButton({
  value,
  className,
  size = "sm",
  label = "Copy",
}: {
  value: string;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      className={className}
      disabled={!value}
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }
      }}
    >
      <Icon name={copied ? "Check" : "Copy"} className="h-4 w-4" />
      {copied ? "Copied!" : label}
    </Button>
  );
}

/* ------------------------------ DownloadButton ----------------------------- */
export function DownloadButton({
  value,
  filename,
  mime,
  className,
}: {
  value: string;
  filename: string;
  mime?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={className}
      disabled={!value}
      onClick={() => triggerDownload(value, filename, mime)}
    >
      <Icon name="Download" className="h-4 w-4" /> Download
    </Button>
  );
}

/* --------------------------------- Output ---------------------------------- */
export function Output({
  value,
  filename,
  mime,
  rows = 8,
  mono = true,
  empty = "Output will appear here…",
}: {
  value: string;
  filename?: string;
  mime?: string;
  rows?: number;
  mono?: boolean;
  empty?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          readOnly
          value={value}
          rows={rows}
          placeholder={empty}
          className={cn(
            "w-full rounded-xl border border-border bg-surface-2 p-3.5 text-sm",
            "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-y",
            mono && "font-mono leading-relaxed",
          )}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={value} />
        {filename && <DownloadButton value={value} filename={filename} mime={mime} />}
      </div>
    </div>
  );
}

/* ---------------------------------- Field ---------------------------------- */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-sm font-medium">{label}</p>}
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/* ---------------------------------- Stat ----------------------------------- */
export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="glass interactive-card rounded-2xl p-4 text-center">
      <div className="text-2xl font-bold gradient-text">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

/* --------------------------------- FileDrop -------------------------------- */
export function FileDrop({
  accept,
  multiple,
  onFiles,
  label = "Drop files here or click to browse",
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "glass flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300",
        drag
          ? "scale-[1.02] border-brand bg-brand/10 shadow-xl shadow-brand/20"
          : "border-border/80 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10",
      )}
    >
      <span className={cn(
        "grid h-12 w-12 place-items-center rounded-xl transition-all duration-300",
        drag ? "scale-110 bg-brand text-brand-fg" : "bg-brand/10 text-brand",
      )}>
        <Icon name="Upload" className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium">{label}</p>
      {accept && <p className="text-xs text-muted">{accept.replaceAll(",", " · ")}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ------------------------------ ImageDrop helper --------------------------- */
export function useImageUpload() {
  const [src, setSrc] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const onFiles = React.useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setName(f.name);
    setSrc(await readAsDataURL(f));
  }, []);
  return { src, name, setSrc, onFiles };
}

/* --------------------------------- Notice ---------------------------------- */
export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "success";
}) {
  const tones = {
    info: "bg-brand/10 text-brand",
    error: "bg-rose-500/10 text-rose-500",
    success: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <div className={cn("glass flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>
  );
}
