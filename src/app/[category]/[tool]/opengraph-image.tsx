import { ImageResponse } from "next/og";
import { getCategory, getTool } from "@/lib/catalog";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";

export const alt = `${site.name} tool`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ category: string; tool: string }>;
}) {
  const { category, tool } = await params;
  const t = getTool(category, tool);
  const c = getCategory(category);
  const name = t?.name ?? "Online Tool";
  const desc = t?.description ?? "";
  const categoryName = c?.name ?? "Tools";
  const shortDesc = desc.length > 120 ? `${desc.slice(0, 120)}…` : desc;

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
        <div style={{ display: "flex", fontSize: 22, opacity: 0.85, marginBottom: 12 }}>
          {site.name} · {categoryName}
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
          {name}
        </div>
        <div style={{ display: "flex", fontSize: 24, opacity: 0.9, marginTop: 20, maxWidth: 900, lineHeight: 1.4 }}>
          {shortDesc}
        </div>
        <div style={{ display: "flex", fontSize: 20, opacity: 0.75, marginTop: 28 }}>
          {t?.clientSide ? messaging.ogToolBadgeClient : messaging.ogToolBadgeAi}
        </div>
      </div>
    ),
    { ...size },
  );
}
