"use client";

import * as React from "react";
import { Input, Select } from "@/components/ui/primitives";
import { Field, FileDrop } from "@/components/tools/shared";
import type { PdfThemeOptions, PdfWatermarkOptions } from "@/lib/pdf-theme";
import { clampOpacity } from "@/lib/pdf-theme";
import { readAsDataURL } from "@/lib/utils";

export type DocBrandState = {
  primaryColor: string;
  accentColor: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkImageDataUrl?: string;
  watermarkOpacity: number;
};

export const DEFAULT_DOC_BRAND: DocBrandState = {
  primaryColor: "#0f766e",
  accentColor: "#d97706",
  watermarkEnabled: false,
  watermarkText: "DRAFT",
  watermarkOpacity: 0.16,
};

export function toPdfTheme(b: DocBrandState): PdfThemeOptions {
  return {
    primary: b.primaryColor,
    accent: b.accentColor,
  };
}

export function toPdfWatermark(b: DocBrandState): PdfWatermarkOptions | undefined {
  if (!b.watermarkEnabled) return undefined;
  if (!b.watermarkText.trim() && !b.watermarkImageDataUrl) return undefined;
  return {
    text: b.watermarkText.trim() || undefined,
    imageDataUrl: b.watermarkImageDataUrl,
    opacity: clampOpacity(b.watermarkOpacity),
  };
}

type Props = {
  value: DocBrandState;
  onChange: (next: DocBrandState) => void;
  /** Compact single-column for tight tool UIs */
  compact?: boolean;
};

export function DocBrandControls({ value, onChange, compact }: Props) {
  const patch = (p: Partial<DocBrandState>) => onChange({ ...value, ...p });

  return (
    <div className={compact ? "space-y-3" : "space-y-4 rounded-xl border border-border bg-surface p-4"}>
      {!compact && (
        <div>
          <p className="text-sm font-bold">Branding & watermark</p>
          <p className="mt-0.5 text-xs text-muted">
            Customize PDF colors and add a text or image watermark on every page.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Brand color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.primaryColor}
              onChange={(e) => patch({ primaryColor: e.target.value })}
              className="h-11 w-14 cursor-pointer rounded-lg border border-border"
            />
            <Input
              value={value.primaryColor}
              onChange={(e) => patch({ primaryColor: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
        </Field>
        <Field label="Accent stripe">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value.accentColor}
              onChange={(e) => patch({ accentColor: e.target.value })}
              className="h-11 w-14 cursor-pointer rounded-lg border border-border"
            />
            <Input
              value={value.accentColor}
              onChange={(e) => patch({ accentColor: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Watermark">
          <Select
            value={value.watermarkEnabled ? "yes" : "no"}
            onChange={(e) => patch({ watermarkEnabled: e.target.value === "yes" })}
          >
            <option value="no">No watermark</option>
            <option value="yes">Add watermark</option>
          </Select>
        </Field>
        <Field label={`Opacity (${Math.round(value.watermarkOpacity * 100)}%)`}>
          <input
            type="range"
            min={5}
            max={45}
            step={1}
            disabled={!value.watermarkEnabled}
            value={Math.round(value.watermarkOpacity * 100)}
            onChange={(e) => patch({ watermarkOpacity: Number(e.target.value) / 100 })}
            className="mt-3 w-full accent-brand disabled:opacity-40"
          />
        </Field>
      </div>

      <Field label="Watermark text" hint="Diagonal across each page (optional if you upload an image)">
        <Input
          value={value.watermarkText}
          onChange={(e) => patch({ watermarkText: e.target.value })}
          disabled={!value.watermarkEnabled}
          placeholder="DRAFT · CONFIDENTIAL · COMPANY NAME"
        />
      </Field>

      <Field label="Watermark image" hint="PNG/JPG with transparency works best">
        {value.watermarkImageDataUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.watermarkImageDataUrl}
              alt="Watermark"
              className="h-14 max-w-[160px] object-contain opacity-60"
            />
            <button
              type="button"
              className="text-xs text-muted underline disabled:opacity-40"
              disabled={!value.watermarkEnabled}
              onClick={() => patch({ watermarkImageDataUrl: undefined })}
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className={!value.watermarkEnabled ? "pointer-events-none opacity-40" : undefined}>
            <FileDrop
              accept="image/png,image/jpeg,image/jpg,image/webp"
              label="Upload watermark image"
              onFiles={async (files) => {
                if (!files[0] || !value.watermarkEnabled) return;
                patch({ watermarkImageDataUrl: await readAsDataURL(files[0]) });
              }}
            />
          </div>
        )}
      </Field>
    </div>
  );
}
