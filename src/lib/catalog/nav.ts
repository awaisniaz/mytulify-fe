import type { Category } from "./types";
import navData from "./nav-categories.json";

export type NavCategory = Pick<Category, "slug" | "name" | "icon" | "gradient"> & {
  toolCount: number;
};

/** Lightweight nav data — no tool lists (keeps client bundle small). */
export const NAV_CATEGORIES = navData as NavCategory[];
