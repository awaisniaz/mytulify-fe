import type { Category } from "./types";
import { CATEGORIES } from "./index";
import navData from "./nav-categories.json";

export type NavCategory = Pick<Category, "slug" | "name" | "icon" | "gradient"> & {
  toolCount: number;
};

type NavSeed = {
  slug: string;
  name: string;
  icon: string;
  gradient: string;
  toolCount?: number;
};

/**
 * Nav rows keep presentation from JSON, but toolCount is always live from the catalog
 * so header counts never drift when tools are added.
 */
export const NAV_CATEGORIES: NavCategory[] = (navData as NavSeed[]).map((row) => {
  const cat = CATEGORIES.find((c) => c.slug === row.slug);
  return {
    slug: row.slug,
    name: cat?.name ?? row.name,
    icon: row.icon,
    gradient: row.gradient,
    toolCount: cat?.tools.length ?? row.toolCount ?? 0,
  };
});
