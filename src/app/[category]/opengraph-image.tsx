import { ImageResponse } from "next/og";
import { getCategory } from "@/lib/catalog";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";

export const alt = `${site.name} category`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  const name = c?.name ?? "Tools";
  const count = c?.tools.length ?? 0;
  const tagline = c?.tagline ?? c?.description ?? "";

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
        <div style={{ display: "flex", fontSize: 24, opacity: 0.85, marginBottom: 12 }}>{site.name}</div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          {name}
        </div>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.9, marginTop: 20, maxWidth: 800 }}>{tagline}</div>
        <div style={{ display: "flex", fontSize: 22, opacity: 0.75, marginTop: 28 }}>{messaging.ogCategoryTools(count)}</div>
      </div>
    ),
    { ...size },
  );
}
