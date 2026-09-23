"use client";

import type { DocBrandState } from "./DocBrandControls";
import { cn } from "@/lib/utils";

export type BrandedDocSection = { heading?: string; body: string };

export type BrandedDocPreviewProps = {
  docType?: string;
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
  sections: BrandedDocSection[];
  signatures?: string[];
  footerLeft?: string;
  brand: DocBrandState;
  className?: string;
  /** When set, used as scroll target after template select. */
  anchorId?: string;
  /** Caption above the page frame. Pass empty string to hide. */
  caption?: string;
};

/**
 * On-screen preview that mirrors exportBrandedPdf layout
 * (side accent, top bar, badge, meta, sections, signatures, watermark, footer).
 */
export function BrandedDocPreview({
  docType = "DOCUMENT",
  title,
  subtitle,
  meta,
  sections,
  signatures,
  footerLeft = "Mytulify · Designed document",
  brand,
  className,
  anchorId,
  caption = "Live PDF preview — same layout as download",
}: BrandedDocPreviewProps) {
  const primary = brand.primaryColor || "#0f766e";
  const accent = brand.accentColor || "#d97706";
  const brandDark = shade(primary, 0.55);

  return (
    <div
      id={anchorId}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-zinc-200/60 p-3 dark:bg-zinc-900/50 sm:p-4",
        className,
      )}
    >
      {caption ? (
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted">
          {caption}
        </p>
      ) : null}

      <div
        className="relative mx-auto w-full max-w-[520px] overflow-hidden bg-white text-[#171b24] shadow-lg"
        style={{
          aspectRatio: "210 / 297",
          minHeight: 420,
        }}
      >
        {/* Page frame */}
        <div className="absolute inset-y-0 left-0 w-[5px]" style={{ background: primary }} />
        <div className="absolute inset-x-0 top-0 h-2.5" style={{ background: primary }} />
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: accent, opacity: 0.85 }} />

        {/* Watermark */}
        {brand.watermarkEnabled && (brand.watermarkText.trim() || brand.watermarkImageDataUrl) && (
          <div
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden"
            aria-hidden
          >
            {brand.watermarkImageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.watermarkImageDataUrl}
                alt=""
                className="max-h-[42%] max-w-[55%] rotate-[28deg] object-contain"
                style={{ opacity: brand.watermarkOpacity }}
              />
            ) : null}
            {brand.watermarkText.trim() ? (
              <span
                className="absolute select-none text-3xl font-bold uppercase tracking-widest text-slate-400 sm:text-4xl"
                style={{
                  opacity: brand.watermarkImageDataUrl
                    ? Math.min(brand.watermarkOpacity + 0.04, 0.4)
                    : brand.watermarkOpacity,
                  transform: "rotate(-34deg)",
                }}
              >
                {brand.watermarkText.trim().slice(0, 40)}
              </span>
            ) : null}
          </div>
        )}

        <div className="relative z-[2] flex h-full flex-col px-5 pb-8 pt-5 sm:px-7 sm:pt-6">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {docType}
          </p>
          <h3
            className="mt-1.5 text-base font-bold leading-snug sm:text-lg"
            style={{ color: brandDark }}
          >
            {title || "Untitled document"}
          </h3>
          {subtitle ? (
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{subtitle}</p>
          ) : null}

          {meta && meta.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-2">
              {meta.map((m) => (
                <div key={`${m.label}-${m.value}`} className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{m.label}</p>
                  <p className="truncate text-[10px] font-semibold text-slate-700">{m.value || "—"}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {sections.map((sec, i) => (
              <section key={i}>
                {sec.heading ? (
                  <h4
                    className="mb-1 text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: brandDark }}
                  >
                    {sec.heading}
                  </h4>
                ) : null}
                <p className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-700 sm:text-[11px]">
                  {sec.body || "—"}
                </p>
                {i < sections.length - 1 ? (
                  <div className="mt-2 h-px w-full bg-slate-200" />
                ) : null}
              </section>
            ))}

            {signatures && signatures.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {signatures.map((sig) => (
                  <div key={sig} className="pt-2">
                    <div className="mb-1.5 h-8 border-b border-slate-400" />
                    <p className="text-[9px] font-semibold text-slate-500">{sig}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-200 pt-2 text-[8px] text-slate-400">
            <span className="truncate">{footerLeft}</span>
            <span className="shrink-0">Page 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function shade(hex: string, factor: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const r = Math.round(parseInt(raw.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(raw.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(raw.slice(4, 6), 16) * factor);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
