import type { FormBranding } from "./schema";

export const DEFAULT_BRANDING: FormBranding = {
  primaryColor: "#ea580c",
  secondaryColor: "#1e293b",
  backgroundColor: "#ffffff",
  bodyTextColor: "#111827",
  showFooterBrand: true,
  headerStyle: "bar",
  logoPosition: "left",
  headerAlign: "left",
  titleAlign: "left",
  footerAlign: "left",
  contactPlacement: "header",
  addressPlacement: "below-title",
  logoHeight: 64,
  pagePadding: "normal",
  fieldsLayout: "single",
  fontFamily: "serif",
  titleSize: "lg",
  fieldStyle: "boxed",
  borderStyle: "solid",
};

export const FONT_FAMILIES: Record<NonNullable<FormBranding["fontFamily"]>, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  modern: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export const PAGE_PADDING_PX: Record<NonNullable<FormBranding["pagePadding"]>, { x: number; y: number }> = {
  compact: { x: 24, y: 28 },
  normal: { x: 40, y: 40 },
  wide: { x: 56, y: 48 },
};

export const TITLE_SIZES: Record<NonNullable<FormBranding["titleSize"]>, string> = {
  sm: "1.25rem",
  md: "1.5rem",
  lg: "1.875rem",
};

export function mergeBranding(existing?: FormBranding, patch?: FormBranding): FormBranding {
  return { ...DEFAULT_BRANDING, ...existing, ...patch };
}

export type ResolvedBranding = Required<
  Pick<
    FormBranding,
    | "primaryColor"
    | "secondaryColor"
    | "backgroundColor"
    | "bodyTextColor"
    | "headerStyle"
    | "logoPosition"
    | "headerAlign"
    | "titleAlign"
    | "footerAlign"
    | "contactPlacement"
    | "addressPlacement"
    | "logoHeight"
    | "pagePadding"
    | "fieldsLayout"
    | "fontFamily"
    | "titleSize"
    | "fieldStyle"
    | "borderStyle"
    | "showFooterBrand"
  >
> &
  FormBranding;

export function resolvedBranding(b?: FormBranding): ResolvedBranding {
  return mergeBranding(b) as ResolvedBranding;
}

export function alignClass(align: "left" | "center" | "right"): string {
  if (align === "center") return "text-center items-center justify-center";
  if (align === "right") return "text-right items-end justify-end";
  return "text-left items-start justify-start";
}

export function flexAlign(align: "left" | "center" | "right"): string {
  if (align === "center") return "justify-center";
  if (align === "right") return "justify-end";
  return "justify-start";
}
