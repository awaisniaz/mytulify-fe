import { TOOL_GUIDES } from "./tool-guides.generated";

export type ToolGuideRef = { slug: string; title: string };

export function toolGuide(category: string | undefined, slug: string | undefined): ToolGuideRef | undefined {
  if (!category || !slug) return undefined;
  return TOOL_GUIDES[`${category}/${slug}`];
}
