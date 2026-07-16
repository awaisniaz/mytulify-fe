"use client";

import * as React from "react";
import type { FormField, FormSchema, FormValues } from "@/lib/forms/schema";
import {
  FONT_FAMILIES,
  PAGE_PADDING_PX,
  TITLE_SIZES,
  alignClass,
  flexAlign,
  resolvedBranding,
  type ResolvedBranding,
} from "@/lib/forms/branding";
import { SignaturePad } from "./SignaturePad";
import { cn } from "@/lib/utils";

function isWideField(field: FormField) {
  return field.type === "textarea" || field.type === "signature" || field.type === "radio";
}

function FieldLabel({
  field,
  primary,
}: {
  field: FormField;
  primary: string;
}) {
  return (
    <label
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ color: primary }}
    >
      {field.label}
      {field.required ? <span style={{ color: "#b91c1c" }}> *</span> : null}
    </label>
  );
}

function ValueLine({
  value,
  placeholder,
  fieldStyle,
  minH = 36,
  multiline = false,
  dir,
}: {
  value: string;
  placeholder?: string;
  fieldStyle: "boxed" | "underline" | "minimal";
  minH?: number;
  multiline?: boolean;
  dir: "ltr" | "rtl";
}) {
  const show = value?.trim() ? value : "";
  const empty = !show;

  if (fieldStyle === "underline") {
    return (
      <div
        dir={dir}
        className={cn("w-full text-[15px] leading-snug", multiline && "whitespace-pre-wrap")}
        style={{
          minHeight: minH,
          borderBottom: "1.5px solid #94a3b8",
          paddingBottom: 6,
          paddingTop: 4,
          color: empty ? "#94a3b8" : "#0f172a",
        }}
      >
        {show || (placeholder ? ` ${placeholder}` : "\u00a0")}
      </div>
    );
  }

  if (fieldStyle === "minimal") {
    return (
      <div
        dir={dir}
        className={cn("w-full text-[15px]", multiline && "whitespace-pre-wrap")}
        style={{
          minHeight: minH,
          background: "#f8fafc",
          borderLeft: "3px solid #cbd5e1",
          padding: "8px 12px",
          color: empty ? "#94a3b8" : "#0f172a",
        }}
      >
        {show || "\u00a0"}
      </div>
    );
  }

  // boxed — document table cell, not browser input
  return (
    <div
      dir={dir}
      className={cn("w-full text-[15px]", multiline && "whitespace-pre-wrap")}
      style={{
        minHeight: minH,
        border: "1px solid #cbd5e1",
        background: "#fff",
        padding: "9px 12px",
        color: empty ? "#94a3b8" : "#0f172a",
        borderRadius: 2,
      }}
    >
      {show || "\u00a0"}
    </div>
  );
}

function FieldPreview({
  field,
  value,
  onChange,
  editable,
  dir,
  fieldStyle,
  primary,
}: {
  field: FormField;
  value: string;
  onChange?: (v: string) => void;
  editable: boolean;
  dir: "ltr" | "rtl";
  fieldStyle: "boxed" | "underline" | "minimal";
  primary: string;
}) {
  const inputBase: React.CSSProperties = {
    width: "100%",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    marginTop: 0,
  };

  const boxedStyle: React.CSSProperties = {
    ...inputBase,
    border: "1px solid #cbd5e1",
    borderRadius: 2,
    padding: "9px 12px",
  };
  const underlineStyle: React.CSSProperties = {
    ...inputBase,
    border: "none",
    borderBottom: "1.5px solid #94a3b8",
    borderRadius: 0,
    padding: "6px 0",
  };
  const minimalStyle: React.CSSProperties = {
    ...inputBase,
    border: "none",
    borderLeft: "3px solid #cbd5e1",
    background: "#f8fafc",
    padding: "8px 12px",
  };
  const editStyle =
    fieldStyle === "underline" ? underlineStyle : fieldStyle === "minimal" ? minimalStyle : boxedStyle;

  if (field.type === "checkbox") {
    const checked = value === "yes";
    return (
      <label className="flex items-start gap-3 text-[14px]" style={{ color: "#0f172a", paddingTop: 4 }}>
        {editable ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked ? "yes" : "")}
            className="mt-0.5 h-4 w-4"
          />
        ) : (
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              border: `1.5px solid ${primary}`,
              borderRadius: 2,
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 700,
              color: primary,
              marginTop: 1,
            }}
          >
            {checked ? "✓" : ""}
          </span>
        )}
        <span>
          <span className="font-semibold">{field.label}</span>
          {field.required ? <span style={{ color: "#b91c1c" }}> *</span> : null}
        </span>
      </label>
    );
  }

  if (field.type === "radio" && field.options?.length) {
    return (
      <div>
        <FieldLabel field={field} primary={primary} />
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
          {field.options.map((opt) => {
            const on = value === opt;
            return (
              <label key={opt} className="flex items-center gap-2 text-[14px]" style={{ color: "#0f172a" }}>
                {editable ? (
                  <input type="radio" name={field.id} checked={on} onChange={() => onChange?.(opt)} />
                ) : (
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1.5px solid ${primary}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {on ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: primary,
                        }}
                      />
                    ) : null}
                  </span>
                )}
                {opt}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "signature") {
    return (
      <div>
        <FieldLabel field={field} primary={primary} />
        {editable ? (
          <SignaturePad value={value || undefined} onChange={(v) => onChange?.(v)} />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Signature"
            style={{
              marginTop: 4,
              maxHeight: 88,
              borderBottom: "1.5px solid #94a3b8",
              paddingBottom: 4,
              background: "#fff",
            }}
          />
        ) : (
          <div
            style={{
              marginTop: 4,
              height: 72,
              borderBottom: `1.5px solid ${primary}`,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                bottom: 6,
                left: 0,
                fontSize: 11,
                color: "#94a3b8",
                letterSpacing: "0.04em",
              }}
            >
              Signature
            </span>
          </div>
        )}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <FieldLabel field={field} primary={primary} />
        {editable ? (
          <textarea
            style={{ ...editStyle, minHeight: 88, resize: "vertical" }}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            dir={dir}
          />
        ) : (
          <ValueLine
            value={value}
            placeholder={field.placeholder}
            fieldStyle={fieldStyle}
            minH={88}
            multiline
            dir={dir}
          />
        )}
      </div>
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <div>
        <FieldLabel field={field} primary={primary} />
        {editable ? (
          <select style={editStyle} value={value} onChange={(e) => onChange?.(e.target.value)} dir={dir}>
            <option value="">— Select —</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <ValueLine value={value} fieldStyle={fieldStyle} dir={dir} />
        )}
      </div>
    );
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text";

  return (
    <div>
      <FieldLabel field={field} primary={primary} />
      {editable ? (
        <input
          type={inputType}
          style={editStyle}
          value={value}
          placeholder={field.placeholder ?? (field.type === "cnic" ? "XXXXX-XXXXXXX-X" : undefined)}
          onChange={(e) => onChange?.(e.target.value)}
          dir={dir}
        />
      ) : (
        <ValueLine
          value={value}
          placeholder={field.placeholder}
          fieldStyle={fieldStyle}
          dir={dir}
        />
      )}
    </div>
  );
}

function ContactLine({ parts, className, style }: { parts: string[]; className?: string; style?: React.CSSProperties }) {
  if (!parts.length) return null;
  return (
    <p className={cn("text-[11px] leading-relaxed", className)} style={style}>
      {parts.join("  ·  ")}
    </p>
  );
}

function FormHeader({
  branding,
  primary,
  secondary,
  contactParts,
  showContact,
  showAddress,
  paddingX,
}: {
  branding: ResolvedBranding;
  primary: string;
  secondary: string;
  contactParts: string[];
  showContact: boolean;
  showAddress: boolean;
  paddingX: number;
}) {
  const logoPos = branding.logoPosition;
  const align = branding.headerAlign;
  const logoH = Math.min(branding.logoHeight ?? 48, 56);

  const logo = branding.logoDataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={branding.logoDataUrl}
      alt=""
      style={{ height: logoH, maxWidth: logoH * 2.8, objectFit: "contain" }}
    />
  ) : null;

  const hasOrg = Boolean(branding.organization?.trim());
  const hasTag = Boolean(branding.tagline?.trim());

  const textBlock = (
    <div className={cn("min-w-0 flex-1", alignClass(align))}>
      {hasOrg && (
        <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          {branding.organization}
        </p>
      )}
      {hasTag && (
        <p style={{ marginTop: 3, fontSize: 12, opacity: 0.9, fontWeight: 500 }}>{branding.tagline}</p>
      )}
      {showContact && branding.contactPlacement === "header" && (
        <ContactLine parts={contactParts} style={{ marginTop: 8, opacity: 0.88 }} />
      )}
      {showAddress && branding.addressPlacement === "header" && branding.address && (
        <p style={{ marginTop: 4, fontSize: 11, opacity: 0.85, whiteSpace: "pre-line" }}>{branding.address}</p>
      )}
    </div>
  );

  const rowClass = cn(
    "flex gap-4",
    flexAlign(align),
    logoPos === "top" && "flex-col",
    logoPos === "center" && "items-center",
    (logoPos === "left" || logoPos === "right") && "items-center",
    logoPos === "right" && "flex-row-reverse",
  );

  // No org/logo — slim accent bar only (avoids empty peach band)
  if (!hasOrg && !logo && !hasTag) {
    return (
      <div style={{ height: 6, background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
    );
  }

  if (branding.headerStyle === "split") {
    return (
      <>
        <div style={{ backgroundColor: secondary, padding: `18px ${paddingX}px`, color: "#fff" }}>
          <div className={rowClass}>{logo}{textBlock}</div>
        </div>
        <div style={{ height: 4, backgroundColor: primary }} />
      </>
    );
  }

  if (branding.headerStyle === "bordered") {
    return (
      <div style={{ padding: `${paddingX * 0.35}px ${paddingX}px 0` }}>
        <div
          style={{
            border: `2px solid ${primary}`,
            padding: "16px 18px",
            borderRadius: 4,
          }}
        >
          <div className={rowClass}>
            {logo}
            <div className={cn("min-w-0 flex-1", alignClass(align))} style={{ color: secondary }}>
              {hasOrg && (
                <p style={{ fontSize: 18, fontWeight: 700, color: primary }}>{branding.organization}</p>
              )}
              {hasTag && <p style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>{branding.tagline}</p>}
              {showContact && branding.contactPlacement === "header" && (
                <ContactLine parts={contactParts} style={{ marginTop: 6, color: "#64748b" }} />
              )}
              {showAddress && branding.addressPlacement === "header" && branding.address && (
                <p style={{ marginTop: 4, fontSize: 11, color: "#64748b", whiteSpace: "pre-line" }}>
                  {branding.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (branding.headerStyle === "minimal") {
    return (
      <div
        style={{
          borderBottom: `3px solid ${primary}`,
          padding: `20px ${paddingX}px 14px`,
        }}
      >
        <div className={rowClass}>
          {logo}
          <div className={cn("min-w-0 flex-1", alignClass(align))}>
            {hasOrg && (
              <p style={{ fontSize: 18, fontWeight: 700, color: primary }}>{branding.organization}</p>
            )}
            {hasTag && <p style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>{branding.tagline}</p>}
            {showContact && branding.contactPlacement === "header" && (
              <ContactLine parts={contactParts} style={{ marginTop: 6, color: "#64748b" }} />
            )}
            {showAddress && branding.addressPlacement === "header" && branding.address && (
              <p style={{ marginTop: 4, fontSize: 11, color: "#64748b", whiteSpace: "pre-line" }}>
                {branding.address}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // bar (default) — strong document letterhead
  return (
    <div style={{ backgroundColor: primary, color: "#fff", padding: `22px ${paddingX}px` }}>
      <div className={rowClass}>
        {logo ? (
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 4,
              padding: 6,
              display: "flex",
              alignItems: "center",
            }}
          >
            {logo}
          </div>
        ) : null}
        {textBlock}
      </div>
    </div>
  );
}

export const FormPreview = React.forwardRef<
  HTMLDivElement,
  {
    schema: FormSchema;
    values?: FormValues;
    onChange?: (id: string, value: string) => void;
    editable?: boolean;
    /** Force print/document look (for PDF capture). Defaults to !editable. */
    printMode?: boolean;
    className?: string;
  }
>(function FormPreview(
  { schema, values = {}, onChange, editable = false, printMode, className },
  ref,
) {
  const dir = ["ur", "ar", "fa", "ps", "sd"].includes(schema.language) ? "rtl" : "ltr";
  const b = resolvedBranding(schema.branding);
  const padding = PAGE_PADDING_PX[b.pagePadding];
  const contactParts = [b.phone, b.email, b.website].filter(Boolean) as string[];
  const fontStack =
    dir === "rtl"
      ? "var(--font-urdu), 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif"
      : FONT_FAMILIES[b.fontFamily];

  // PDF / blank download always uses document rendering (never live <input> chrome)
  const usePrint = printMode ?? !editable;
  const fieldInteractive = editable && !usePrint;

  const layout = b.fieldsLayout;
  const shortFields = schema.fields.filter((f) => !isWideField(f));
  const useTwoCol = layout === "two-column" || (layout === "single" && shortFields.length >= 3 && usePrint);

  return (
    <div
      ref={ref}
      dir={dir}
      className={cn("mx-auto w-full max-w-[794px]", className)}
      style={{
        backgroundColor: b.backgroundColor,
        color: b.bodyTextColor,
        fontFamily: fontStack,
        border: b.borderStyle === "none" ? "none" : "1px solid #e2e8f0",
        borderRadius: b.borderStyle === "rounded" ? 8 : 0,
        overflow: "hidden",
        boxShadow: usePrint ? "none" : "0 1px 3px rgba(15,23,42,0.06)",
        position: "relative",
      }}
    >
      {/* Designer accent rail — matches branded PDF system */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: `linear-gradient(180deg, ${b.primaryColor}, ${b.secondaryColor})`,
        }}
      />
      <div
        aria-hidden
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${b.primaryColor} 70%, #d97706)`,
        }}
      />

      <FormHeader
        branding={b}
        primary={b.primaryColor}
        secondary={b.secondaryColor}
        contactParts={contactParts}
        showContact={!!contactParts.length}
        showAddress={!!b.address}
        paddingX={padding.x}
      />

      <div style={{ padding: `${padding.y}px ${padding.x}px ${Math.max(padding.y - 8, 28)}px`, paddingLeft: padding.x + 4 }}>
        {/* Meta strip: address + date feel — only if address is meant below title */}
        {(b.addressPlacement === "below-title" && b.address) || b.contactPlacement === "below-title" ? (
          <div
            className={cn("mb-5 flex flex-wrap items-start justify-between gap-3", alignClass(b.titleAlign))}
            style={{
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: 10,
            }}
          >
            {b.addressPlacement === "below-title" && b.address ? (
              <p style={{ fontSize: 12, color: "#64748b", whiteSpace: "pre-line", margin: 0 }}>
                {b.address}
              </p>
            ) : (
              <span />
            )}
            {b.contactPlacement === "below-title" && contactParts.length > 0 ? (
              <ContactLine parts={contactParts} style={{ color: "#64748b" }} />
            ) : null}
          </div>
        ) : null}

        <div className={alignClass(b.titleAlign)}>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: b.primaryColor,
            }}
          >
            Form template
          </p>
          <h1
            style={{
              margin: "6px 0 0",
              fontWeight: 700,
              fontSize: TITLE_SIZES[b.titleSize],
              color: b.secondaryColor,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {schema.title}
          </h1>
          <div
            style={{
              marginTop: 10,
              width: b.titleAlign === "center" ? 72 : 56,
              height: 3,
              background: b.primaryColor,
              marginLeft: b.titleAlign === "right" ? "auto" : b.titleAlign === "center" ? "auto" : 0,
              marginRight: b.titleAlign === "center" ? "auto" : 0,
            }}
          />
          {schema.description ? (
            <p style={{ marginTop: 12, fontSize: 13.5, color: "#64748b", lineHeight: 1.5, maxWidth: 520 }}>
              {schema.description}
            </p>
          ) : null}
        </div>

        <div
          style={
            useTwoCol
              ? {
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  columnGap: 28,
                  rowGap: 22,
                  marginTop: 28,
                }
              : {
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                  marginTop: 28,
                }
          }
        >
          {schema.fields.map((field) => (
            <div
              key={field.id}
              style={
                useTwoCol && isWideField(field)
                  ? { gridColumn: "1 / -1" }
                  : undefined
              }
            >
              <FieldPreview
                field={field}
                value={values[field.id] ?? ""}
                onChange={onChange ? (v) => onChange(field.id, v) : undefined}
                editable={fieldInteractive}
                dir={dir}
                fieldStyle={b.fieldStyle}
                primary={b.primaryColor}
              />
            </div>
          ))}
        </div>

        <div
          className={alignClass(b.footerAlign)}
          style={{
            marginTop: 36,
            paddingTop: 14,
            borderTop: "1px solid #e2e8f0",
            fontSize: 11,
            color: "#94a3b8",
          }}
        >
          {b.contactPlacement === "footer" && contactParts.length > 0 && (
            <ContactLine parts={contactParts} style={{ marginBottom: 6, color: "#64748b" }} />
          )}
          {b.addressPlacement === "footer" && b.address && (
            <p style={{ marginBottom: 6, whiteSpace: "pre-line", color: "#64748b" }}>{b.address}</p>
          )}
          {b.footerText ? (
            <p style={{ margin: 0 }}>{b.footerText}</p>
          ) : b.showFooterBrand !== false ? (
            <p style={{ margin: 0 }}>Generated with Mytulify · Form Builder</p>
          ) : null}
        </div>
      </div>
    </div>
  );
});
