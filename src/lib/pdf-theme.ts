import { rgb, type RGB } from "pdf-lib";

export type PdfWatermarkOptions = {
  text?: string;
  /** PNG or JPEG data URL */
  imageDataUrl?: string;
  /** 0.05 – 0.45, default 0.16 */
  opacity?: number;
};

export type PdfThemeOptions = {
  /** Hex e.g. #0f766e */
  primary?: string;
  /** Hex accent stripe e.g. #d97706 */
  accent?: string;
  organization?: string;
};

export function hexToRgb(hex?: string, fallback: RGB = rgb(0.06, 0.46, 0.43)): RGB {
  if (!hex) return fallback;
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const n = parseInt(m[1]!, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export function normalizeWatermark(
  wm?: string | PdfWatermarkOptions | null,
): PdfWatermarkOptions | undefined {
  if (!wm) return undefined;
  if (typeof wm === "string") {
    const text = wm.trim();
    return text ? { text, opacity: 0.16 } : undefined;
  }
  const text = wm.text?.trim();
  const imageDataUrl = wm.imageDataUrl?.trim();
  if (!text && !imageDataUrl) return undefined;
  const opacity = Math.min(0.45, Math.max(0.05, wm.opacity ?? 0.16));
  return { text: text || undefined, imageDataUrl: imageDataUrl || undefined, opacity };
}

export function clampOpacity(n?: number, fallback = 0.16) {
  if (n == null || Number.isNaN(n)) return fallback;
  return Math.min(0.45, Math.max(0.05, n));
}
