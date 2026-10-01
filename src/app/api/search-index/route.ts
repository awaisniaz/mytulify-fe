import { NextResponse } from "next/server";
import { ALL_TOOLS, getCategory } from "@/lib/catalog";
import { getContent, localizeCategory, localizeTool } from "@/i18n/content";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";

export const revalidate = 86400;

/** Search data is fetched when the dialog opens so it is not inlined into every page. */
export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") ?? DEFAULT_LOCALE;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const content = await getContent(locale);

  const tools = ALL_TOOLS.map((tool) => {
    const label = localizeTool(content, tool);
    const cat = tool.category ? getCategory(tool.category) : undefined;
    const catLabel = cat
      ? localizeCategory(content, cat.slug, {
          name: cat.name,
          description: cat.description,
          tagline: cat.tagline,
        })
      : { name: tool.category ?? "" };
    return {
      name: label.name,
      slug: tool.slug,
      description: label.description,
      category: tool.category,
      categoryName: catLabel.name,
      searchVolume: tool.searchVolume,
      clientSide: tool.clientSide,
    };
  });

  return NextResponse.json(tools, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
