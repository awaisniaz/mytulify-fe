import { ImageResponse } from "next/og";
import { TOTAL_TOOLS, TOTAL_CATEGORIES } from "@/lib/catalog";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";

export const alt = `${site.name} — ${messaging.ogToolsLabel}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #831843 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85, marginBottom: 16 }}>{site.name}</div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          {messaging.taglineWithTier}
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.9, marginTop: 24, maxWidth: 800 }}>
          {TOTAL_CATEGORIES} categories · PDF, image, text, SEO, developer and more
        </div>
      </div>
    ),
    { ...size },
  );
}
