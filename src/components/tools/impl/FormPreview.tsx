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
  const label = (
    <label className="block text-sm font-semibold" style={{ color: "inherit" }}>
      {field.label}
      {field.required && <span className="text-red-600"> *</span>}
    </label>
  );

  const inputCls = cn(
    "mt-1 w-full bg-white px-3 py-2 text-sm outline-none",
    fieldStyle === "boxed" && "rounded-md border border-gray-300",
    fieldStyle === "underline" && "border-0 border-b-2 border-gray-300 rounded-none px-0",
    fieldStyle === "minimal" && "border border-dashed border-gray-300 rounded-md bg-gray-50/50",
  );

  if (field.type === "textarea") {
    return (
      <div>
        {label}
        {editable ? (
          <textarea
            className={cn(inputCls, "min-h-[80px] resize-y text-gray-900")}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            dir={dir}
          />
        ) : (
          <div className={cn(inputCls, "min-h-[80px] whitespace-pre-wrap text-gray-900")}>{value || " "}</div>
        )}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        {editable ? (
          <input type="checkbox" checked={value === "yes"} onChange={(e) => onChange?.(e.target.checked ? "yes" : "")} />
        ) : (
          <span className="inline-block h-4 w-4 border border-gray-400">{value === "yes" ? "✓" : ""}</span>
        )}
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </label>
    );
  }

  if (field.type === "radio" && field.options?.length) {
    return (
      <div>
        {label}
        <div className="mt-2 space-y-1">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              {editable ? (
                <input type="radio" name={field.id} checked={value === opt} onChange={() => onChange?.(opt)} />
              ) : (
                <span className="inline-block h-3.5 w-3.5 rounded-full border border-gray-400">{value === opt ? "●" : ""}</span>
              )}
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <div>
        {label}
        {editable ? (
          <select className={cn(inputCls, "text-gray-900")} value={value} onChange={(e) => onChange?.(e.target.value)} dir={dir}>
            <option value="">— Select —</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <div className={cn(inputCls, "text-gray-900")}>{value || "—"}</div>
        )}
      </div>
    );
  }

  if (field.type === "signature") {
    return (
      <div>
        {label}
        {editable ? (
          <SignaturePad value={value || undefined} onChange={(v) => onChange?.(v)} />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Signature" className="mt-1 max-h-24 rounded border border-gray-300 bg-white" />
        ) : (
          <div className={cn(inputCls, "h-24")} style={{ borderColor: primary }} />
        )}
      </div>
    );
  }

  const inputType =
    field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text";

  return (
    <div>
      {label}
      {editable ? (
        <input
          type={inputType}
          className={cn(inputCls, "text-gray-900")}
          value={value}
          placeholder={field.placeholder ?? (field.type === "cnic" ? "XXXXX-XXXXXXX-X" : undefined)}
          onChange={(e) => onChange?.(e.target.value)}
          dir={dir}
        />
      ) : (
        <div className={cn(inputCls, "text-gray-900")}>{value || " "}</div>
      )}
    </div>
  );
}

function ContactLine({ parts, className }: { parts: string[]; className?: string }) {
  if (!parts.length) return null;
  return <p className={cn("text-xs opacity-90", className)}>{parts.join(" · ")}</p>;
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
  const logoH = branding.logoHeight ?? 64;

  const logo = branding.logoDataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={branding.logoDataUrl}
      alt=""
      style={{ height: logoH, maxWidth: logoH * 2.5 }}
      className={cn(
        "object-contain",
        branding.headerStyle === "bar" && "rounded bg-white/95 p-1",
      )}
    />
  ) : null;

  const textBlock = (
    <div className={cn("min-w-0 flex-1", alignClass(align))}>
      {branding.organization && (
        <p className={cn("font-bold", branding.headerStyle === "bar" ? "text-xl" : "text-lg")}>{branding.organization}</p>
      )}
      {branding.tagline && (
        <p className={cn("mt-0.5 text-sm", branding.headerStyle === "bar" ? "opacity-90" : "text-gray-600")}>
          {branding.tagline}
        </p>
      )}
      {showContact && branding.contactPlacement === "header" && (
        <ContactLine parts={contactParts} className={branding.headerStyle === "bar" ? "mt-1 opacity-85" : "mt-1 text-gray-500"} />
      )}
      {showAddress && branding.addressPlacement === "header" && branding.address && (
        <p className="mt-1 whitespace-pre-line text-xs opacity-85">{branding.address}</p>
      )}
    </div>
  );

  const rowClass = cn(
    "flex flex-wrap gap-4",
    flexAlign(align),
    logoPos === "top" && "flex-col",
    logoPos === "center" && "items-center",
    logoPos === "left" && "items-center",
    logoPos === "right" && "flex-row-reverse items-center",
  );

  if (branding.headerStyle === "split") {
    return (
      <>
        <div className="px-10 py-4" style={{ backgroundColor: secondary, paddingLeft: paddingX, paddingRight: paddingX }}>
          <div className={cn(rowClass, "text-white")}>{logo}{textBlock}</div>
        </div>
        <div className="h-1.5" style={{ backgroundColor: primary }} />
      </>
    );
  }

  if (branding.headerStyle === "bordered") {
    return (
      <div className="mx-10 mt-6 rounded-lg border-2 p-5" style={{ borderColor: primary, marginLeft: paddingX, marginRight: paddingX }}>
        <div className={rowClass}>
          {logo}
          <div className={cn("min-w-0 flex-1", alignClass(align))} style={{ color: secondary }}>
            {branding.organization && <p className="text-lg font-bold" style={{ color: primary }}>{branding.organization}</p>}
            {branding.tagline && <p className="text-sm text-gray-600">{branding.tagline}</p>}
            {showContact && branding.contactPlacement === "header" && (
              <ContactLine parts={contactParts} className="mt-1 text-gray-500" />
            )}
            {showAddress && branding.addressPlacement === "header" && branding.address && (
              <p className="mt-1 whitespace-pre-line text-xs text-gray-500">{branding.address}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (branding.headerStyle === "bar") {
    return (
      <div className="py-6 text-white" style={{ backgroundColor: primary, paddingLeft: paddingX, paddingRight: paddingX }}>
        <div className={rowClass}>
          {logo}
          {textBlock}
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className="border-b py-6" style={{ borderColor: primary, paddingLeft: paddingX, paddingRight: paddingX }}>
      <div className={rowClass}>
        {logo}
        <div className={cn("min-w-0 flex-1", alignClass(align))}>
          {branding.organization && (
            <p className="text-lg font-bold" style={{ color: primary }}>
              {branding.organization}
            </p>
          )}
          {branding.tagline && <p className="text-sm text-gray-600">{branding.tagline}</p>}
          {showContact && branding.contactPlacement === "header" && (
            <ContactLine parts={contactParts} className="mt-1 text-gray-500" />
          )}
          {showAddress && branding.addressPlacement === "header" && branding.address && (
            <p className="mt-1 whitespace-pre-line text-xs text-gray-500">{branding.address}</p>
          )}
        </div>
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
    className?: string;
  }
>(function FormPreview({ schema, values = {}, onChange, editable = false, className }, ref) {
  const dir = ["ur", "ar", "fa", "ps", "sd"].includes(schema.language) ? "rtl" : "ltr";
  const b = resolvedBranding(schema.branding);
  const padding = PAGE_PADDING_PX[b.pagePadding];
  const contactParts = [b.phone, b.email, b.website].filter(Boolean) as string[];
  const fontStack =
    dir === "rtl"
      ? "var(--font-urdu), 'Noto Nastaliq Urdu', serif"
      : FONT_FAMILIES[b.fontFamily];

  const outerCls = cn(
    "mx-auto w-full max-w-[794px] shadow-sm",
    b.borderStyle === "rounded" && "rounded-xl overflow-hidden border border-gray-200",
    b.borderStyle === "solid" && "shadow-md",
    b.borderStyle === "none" && "shadow-none",
    className,
  );

  return (
    <div
      ref={ref}
      dir={dir}
      className={outerCls}
      style={{ backgroundColor: b.backgroundColor, color: b.bodyTextColor, fontFamily: fontStack }}
    >
      <FormHeader
        branding={b}
        primary={b.primaryColor}
        secondary={b.secondaryColor}
        contactParts={contactParts}
        showContact={!!contactParts.length}
        showAddress={!!b.address}
        paddingX={padding.x}
      />

      <div style={{ padding: `${padding.y}px ${padding.x}px` }}>
        {b.addressPlacement === "below-title" && b.address && (
          <p className={cn("mb-4 whitespace-pre-line text-xs text-gray-500", alignClass(b.titleAlign))}>{b.address}</p>
        )}

        <h1
          className={cn("border-b-2 pb-2 font-bold", alignClass(b.titleAlign))}
          style={{
            borderColor: b.primaryColor,
            color: b.secondaryColor,
            fontSize: TITLE_SIZES[b.titleSize],
          }}
        >
          {schema.title}
        </h1>
        {schema.description && (
          <p className={cn("mt-2 text-sm text-gray-600", alignClass(b.titleAlign))}>{schema.description}</p>
        )}

        {b.contactPlacement === "below-title" && contactParts.length > 0 && (
          <ContactLine parts={contactParts} className={cn("mt-3 text-gray-500", alignClass(b.titleAlign))} />
        )}

        <div
          className={cn("mt-8 gap-5", b.fieldsLayout === "two-column" ? "grid grid-cols-2" : "space-y-5")}
          style={
            b.fieldsLayout === "two-column"
              ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }
              : { display: "flex", flexDirection: "column", gap: "1.25rem" }
          }
        >
          {schema.fields.map((field) => (
            <FieldPreview
              key={field.id}
              field={field}
              value={values[field.id] ?? ""}
              onChange={onChange ? (v) => onChange(field.id, v) : undefined}
              editable={editable}
              dir={dir}
              fieldStyle={b.fieldStyle}
              primary={b.primaryColor}
            />
          ))}
        </div>

        <div className={cn("mt-10 border-t border-gray-200 pt-4 text-xs text-gray-500", alignClass(b.footerAlign))}>
          {b.contactPlacement === "footer" && contactParts.length > 0 && (
            <ContactLine parts={contactParts} className="mb-2 text-gray-500" />
          )}
          {b.addressPlacement === "footer" && b.address && (
            <p className="mb-2 whitespace-pre-line">{b.address}</p>
          )}
          {b.footerText ? (
            <p>{b.footerText}</p>
          ) : b.showFooterBrand !== false ? (
            <p>Generated with Mytulify Form Builder</p>
          ) : null}
        </div>
      </div>
    </div>
  );
});
