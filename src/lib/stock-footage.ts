/** Free stock video / B-roll search helpers (no API keys — deep-link search pages). */

export type StockSource = {
  id: string;
  name: string;
  note: string;
  license: string;
  searchUrl: (query: string) => string;
};

export const FREE_STOCK_SOURCES: StockSource[] = [
  {
    id: "pexels",
    name: "Pexels",
    note: "Large free video library, easy downloads",
    license: "Free to use (Pexels License)",
    searchUrl: (q) => `https://www.pexels.com/search/videos/${encodeURIComponent(q)}/`,
  },
  {
    id: "pixabay",
    name: "Pixabay",
    note: "Free videos & music beds",
    license: "Pixabay Content License",
    searchUrl: (q) => `https://pixabay.com/videos/search/${encodeURIComponent(q)}/`,
  },
  {
    id: "coverr",
    name: "Coverr",
    note: "Cinematic stock clips",
    license: "Free for commercial use",
    searchUrl: (q) => `https://coverr.co/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "mixkit",
    name: "Mixkit",
    note: "Free videos + music (Envato)",
    license: "Mixkit License",
    searchUrl: (q) => `https://mixkit.co/free-stock-video/${encodeURIComponent(q.trim().replace(/\s+/g, "-"))}/`,
  },
  {
    id: "videvo",
    name: "Videvo",
    note: "Free tier + attribution options",
    license: "Check clip license",
    searchUrl: (q) => `https://www.videvo.net/search/${encodeURIComponent(q)}/free-stock-footage/`,
  },
  {
    id: "mazwai",
    name: "Mazwai",
    note: "Curated free cinematic clips",
    license: "Free with attribution",
    searchUrl: (q) => `https://mazwai.com/#/search/${encodeURIComponent(q)}`,
  },
  {
    id: "lifeofvids",
    name: "Life of Vids",
    note: "Short free clips & loops",
    license: "Free for personal/commercial",
    searchUrl: () => `https://www.lifeofvids.com/`,
  },
  {
    id: "splitshire",
    name: "SplitShire",
    note: "Free stock video packs",
    license: "CC0-style free use",
    searchUrl: (q) => `https://www.splitshire.com/?s=${encodeURIComponent(q)}`,
  },
  {
    id: "vecteezy",
    name: "Vecteezy (free)",
    note: "Filter to free stock video",
    license: "Free with attribution (check)",
    searchUrl: (q) => `https://www.vecteezy.com/free-videos/${encodeURIComponent(q.replace(/\s+/g, "-"))}`,
  },
  {
    id: "videezy",
    name: "Videezy",
    note: "Free + premium stock video",
    license: "Free tier with attribution",
    searchUrl: (q) => `https://www.videezy.com/free-video/${encodeURIComponent(q.replace(/\s+/g, "-"))}`,
  },
];

export function stockLinksForKeywords(keywords: string[]): { source: StockSource; url: string; query: string }[] {
  const query = (keywords.filter(Boolean)[0] || keywords.join(" ") || "b-roll").trim();
  return FREE_STOCK_SOURCES.map((source) => ({
    source,
    query,
    url: source.searchUrl(query),
  }));
}
