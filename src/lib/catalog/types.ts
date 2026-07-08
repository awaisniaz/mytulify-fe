export type Level = "high" | "medium" | "low";
export type Complexity = "easy" | "medium" | "hard";

export interface Tool {
  name: string;
  slug: string;
  description: string;
  searchVolume: Level;
  competition: Level;
  complexity: Complexity;
  /** Whether the tool runs fully in the browser. */
  clientSide: boolean;
  /** Category slug — injected by the loader, not stored in the JSON. */
  category?: string;
}

export interface CategoryData {
  name: string;
  slug: string;
  description: string;
  tools: Tool[];
}

export interface CategoryMeta {
  /** lucide-react icon name */
  icon: string;
  /** tailwind gradient used for accents (from -> to) */
  gradient: string;
  /** short marketing tagline */
  tagline: string;
}

export interface Category extends CategoryData {
  icon: string;
  gradient: string;
  tagline: string;
}
