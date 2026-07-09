"use client";

import * as React from "react";
import { Input, Select, Textarea } from "@/components/ui/primitives";
import { FileDrop } from "@/components/tools/shared";
import type { FormBranding } from "@/lib/forms/schema";
import { readAsDataURL } from "@/lib/utils";

type Props = {
  branding: FormBranding | undefined;
  onChange: (branding: FormBranding) => void;
  compact?: boolean;
};

function Section({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="rounded-lg border border-border/80 bg-surface-2/40">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">
        {title}
      </summary>
      <div className="space-y-2 border-t border-border/60 px-3 py-3">{children}</div>
    </details>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

export function BrandingPanel({ branding, onChange, compact }: Props) {
  const b = branding ?? {};
  const patch = (p: Partial<FormBranding>) => onChange({ ...b, ...p });

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div>
        <p className="text-sm font-bold">Branding & design</p>
        {!compact && (
          <p className="mt-0.5 text-xs text-muted">
            Logo position, colors, fonts, and layout — live preview on the right.
          </p>
        )}
      </div>

      <Section title="Company & contact" defaultOpen>
        <Input
          placeholder="Organization / company name"
          value={b.organization ?? ""}
          onChange={(e) => patch({ organization: e.target.value })}
        />
        <Input
          placeholder="Tagline (optional)"
          value={b.tagline ?? ""}
          onChange={(e) => patch({ tagline: e.target.value })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Website" value={b.website ?? ""} onChange={(e) => patch({ website: e.target.value })} />
          <Input
            placeholder="Email"
            type="email"
            value={b.email ?? ""}
            onChange={(e) => patch({ email: e.target.value })}
          />
          <Input placeholder="Phone" value={b.phone ?? ""} onChange={(e) => patch({ phone: e.target.value })} />
        </div>
        <Textarea
          rows={2}
          placeholder="Address (optional)"
          value={b.address ?? ""}
          onChange={(e) => patch({ address: e.target.value })}
        />
        <Input
          placeholder="Custom footer text (optional)"
          value={b.footerText ?? ""}
          onChange={(e) => patch({ footerText: e.target.value })}
        />
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={b.showFooterBrand !== false}
            onChange={(e) => patch({ showFooterBrand: e.target.checked })}
          />
          Show Mytulify footer credit when footer text is empty
        </label>
      </Section>

      <Section title="Layout & position" defaultOpen={!compact}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Row label="Header style">
            <Select
              value={b.headerStyle ?? "bar"}
              onChange={(e) => patch({ headerStyle: e.target.value as FormBranding["headerStyle"] })}
            >
              <option value="bar">Colored bar</option>
              <option value="minimal">Minimal line</option>
              <option value="bordered">Bordered box</option>
              <option value="split">Split (logo band + title band)</option>
            </Select>
          </Row>
          <Row label="Logo position">
            <Select
              value={b.logoPosition ?? "left"}
              onChange={(e) => patch({ logoPosition: e.target.value as FormBranding["logoPosition"] })}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center (beside text)</option>
              <option value="top">Top (above text)</option>
            </Select>
          </Row>
          <Row label="Header text align">
            <Select
              value={b.headerAlign ?? "left"}
              onChange={(e) => patch({ headerAlign: e.target.value as FormBranding["headerAlign"] })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </Row>
          <Row label="Form title align">
            <Select
              value={b.titleAlign ?? "left"}
              onChange={(e) => patch({ titleAlign: e.target.value as FormBranding["titleAlign"] })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </Row>
          <Row label="Footer align">
            <Select
              value={b.footerAlign ?? "left"}
              onChange={(e) => patch({ footerAlign: e.target.value as FormBranding["footerAlign"] })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </Row>
          <Row label="Fields layout">
            <Select
              value={b.fieldsLayout ?? "single"}
              onChange={(e) => patch({ fieldsLayout: e.target.value as FormBranding["fieldsLayout"] })}
            >
              <option value="single">Single column</option>
              <option value="two-column">Two columns</option>
            </Select>
          </Row>
          <Row label="Contact info shows in">
            <Select
              value={b.contactPlacement ?? "header"}
              onChange={(e) => patch({ contactPlacement: e.target.value as FormBranding["contactPlacement"] })}
            >
              <option value="header">Header</option>
              <option value="below-title">Below title</option>
              <option value="footer">Footer</option>
            </Select>
          </Row>
          <Row label="Address shows in">
            <Select
              value={b.addressPlacement ?? "below-title"}
              onChange={(e) => patch({ addressPlacement: e.target.value as FormBranding["addressPlacement"] })}
            >
              <option value="header">Header</option>
              <option value="below-title">Below title</option>
              <option value="footer">Footer</option>
              <option value="hidden">Hidden</option>
            </Select>
          </Row>
          <Row label="Page margins">
            <Select
              value={b.pagePadding ?? "normal"}
              onChange={(e) => patch({ pagePadding: e.target.value as FormBranding["pagePadding"] })}
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
            </Select>
          </Row>
        </div>
        <Row label={`Logo height (${b.logoHeight ?? 64}px)`}>
          <input
            type="range"
            min={32}
            max={120}
            step={4}
            value={b.logoHeight ?? 64}
            onChange={(e) => patch({ logoHeight: Number(e.target.value) })}
            className="w-full accent-brand"
          />
        </Row>
      </Section>

      <Section title="Colors & typography" defaultOpen={!compact}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Row label="Font">
            <Select
              value={b.fontFamily ?? "serif"}
              onChange={(e) => patch({ fontFamily: e.target.value as FormBranding["fontFamily"] })}
            >
              <option value="serif">Serif (formal)</option>
              <option value="sans">Sans (clean)</option>
              <option value="modern">Modern</option>
            </Select>
          </Row>
          <Row label="Title size">
            <Select
              value={b.titleSize ?? "lg"}
              onChange={(e) => patch({ titleSize: e.target.value as FormBranding["titleSize"] })}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </Select>
          </Row>
          <Row label="Field style">
            <Select
              value={b.fieldStyle ?? "boxed"}
              onChange={(e) => patch({ fieldStyle: e.target.value as FormBranding["fieldStyle"] })}
            >
              <option value="boxed">Boxed inputs</option>
              <option value="underline">Underline</option>
              <option value="minimal">Minimal</option>
            </Select>
          </Row>
          <Row label="Form border">
            <Select
              value={b.borderStyle ?? "solid"}
              onChange={(e) => patch({ borderStyle: e.target.value as FormBranding["borderStyle"] })}
            >
              <option value="solid">Solid shadow</option>
              <option value="rounded">Rounded card</option>
              <option value="none">No border</option>
            </Select>
          </Row>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {(
            [
              ["Primary", "primaryColor", "#ea580c"],
              ["Secondary", "secondaryColor", "#1e293b"],
              ["Background", "backgroundColor", "#ffffff"],
              ["Text", "bodyTextColor", "#111827"],
            ] as const
          ).map(([label, key, fallback]) => (
            <label key={key} className="flex items-center gap-2 text-xs text-muted">
              {label}
              <input
                type="color"
                value={(b[key] as string | undefined) ?? fallback}
                onChange={(e) => patch({ [key]: e.target.value })}
                className="h-9 w-14 cursor-pointer rounded border border-border"
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Logo" defaultOpen>
        {b.logoDataUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.logoDataUrl}
              alt="Logo"
              style={{ height: b.logoHeight ?? 64 }}
              className="max-w-[200px] object-contain"
            />
            <button
              type="button"
              className="text-xs text-muted underline"
              onClick={() => patch({ logoDataUrl: undefined })}
            >
              Remove logo
            </button>
          </div>
        ) : (
          <FileDrop
            accept="image/*"
            label="Upload logo (PNG, JPG, SVG)"
            onFiles={async (files) => {
              if (files[0]) patch({ logoDataUrl: await readAsDataURL(files[0]) });
            }}
          />
        )}
      </Section>
    </div>
  );
}
