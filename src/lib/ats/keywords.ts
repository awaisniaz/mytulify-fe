import type { KeywordHit, KeywordImportance } from "./types";

const STOP = new Set(
  `a an the and or of to in for with on at by from as is are was were be been being this that these those we you they our your their will can able using use used including include includes such than then also into over about after before between through during without within per via etc other more most some any all each both few own same so too very just just only not no nor but if because while when where who which what how new well work working team role job position candidate applicant company business opportunity looking seeking required requirement requirements qualification qualifications experience year years plus must should preferred preference ability skill skills knowledge strong excellent proven track record please submit apply application hiring manager recruiter department location remote hybrid onsite full-time part-time contract type status equal opportunity employer disability veteran`.split(
    /\s+/,
  ),
);

const SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript"],
  typescript: ["ts"],
  "node.js": ["nodejs", "node"],
  react: ["reactjs", "react.js"],
  "next.js": ["nextjs", "next"],
  "ci/cd": ["cicd", "continuous integration", "continuous delivery"],
  aws: ["amazon web services"],
  gcp: ["google cloud", "google cloud platform"],
  azure: ["microsoft azure"],
  kubernetes: ["k8s"],
  postgresql: ["postgres"],
  "rest api": ["restful", "rest apis"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  "user experience": ["ux"],
  "user interface": ["ui"],
  "search engine optimization": ["seo"],
  "customer relationship management": ["crm"],
  "key performance indicators": ["kpis", "kpi"],
  "project management": ["pmp"],
  "cross-functional": ["cross functional", "crossfunctional"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9+#./&\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .map((t) => t.replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/g, ""))
    .filter((t) => t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

function countPhrase(haystack: string, phrase: string): number {
  const h = ` ${normalize(haystack)} `;
  const p = ` ${normalize(phrase)} `;
  if (p.trim().length < 2) return 0;
  let n = 0;
  let i = 0;
  while (i >= 0) {
    const found = h.indexOf(p, i);
    if (found < 0) break;
    n++;
    i = found + p.length - 1;
  }
  // synonyms
  const syns = SYNONYMS[normalize(phrase)] ?? [];
  for (const syn of syns) {
    const s = ` ${normalize(syn)} `;
    let j = 0;
    while (j >= 0) {
      const found = h.indexOf(s, j);
      if (found < 0) break;
      n++;
      j = found + s.length - 1;
    }
  }
  return n;
}

function ngrams(words: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    out.push(words.slice(i, i + n).join(" "));
  }
  return out;
}

function importanceFor(term: string, jd: string): KeywordImportance {
  const lower = jd.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx < 0) return "other";
  const window = lower.slice(Math.max(0, idx - 280), idx + term.length + 80);
  if (/\b(required|must have|must-have|minimum|qualifications?:|requirements?:)\b/.test(window)) {
    return "required";
  }
  if (/\b(preferred|nice to have|plus|bonus|desired)\b/.test(window)) return "preferred";
  return "other";
}

/** Pull job-ad keywords an ATS would score — skills, tools, and repeated phrases. */
export function extractJobKeywords(jobDescription: string, limit = 36): string[] {
  const jd = jobDescription.trim();
  if (!jd) return [];
  const words = tokens(jd);
  const freq = new Map<string, number>();
  const bump = (term: string, w = 1) => {
    const t = normalize(term);
    if (!t || STOP.has(t) || t.length < 2) return;
    freq.set(t, (freq.get(t) ?? 0) + w);
  };

  for (const w of words) bump(w, 1);
  for (const g of ngrams(words, 2)) bump(g, 2);
  for (const g of ngrams(words, 3)) bump(g, 3);

  for (const m of jd.matchAll(/\b[A-Z]{2,6}\b/g)) bump(m[0], 3);
  for (const m of jd.matchAll(/\b[\w.+#]+(?:\.js|\.net)\b/gi)) bump(m[0], 4);
  for (const m of jd.matchAll(/\b(?:CI\/CD|C\+\+|C#|F#|\.NET|Node\.js|Next\.js|Vue\.js|React\.js)\b/gi)) {
    bump(m[0], 5);
  }

  const ranked = [...freq.entries()]
    .filter(([term, n]) => {
      const parts = term.split(" ");
      if (parts.length === 1 && term.length < 3 && n < 3) return false;
      if (parts.length === 1 && n < 2 && term.length < 5 && !/[.#+/]/.test(term) && term !== term.toUpperCase()) {
        // keep distinctive single tokens that look like tools
        return /[0-9]/.test(term) || term.length >= 5;
      }
      return n >= 2 || parts.length >= 2 || /[.#+/]/.test(term) || term.length >= 6;
    })
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);

  const picked: string[] = [];
  const seen = new Set<string>();
  for (const [term] of ranked) {
    if (picked.length >= limit) break;
    // drop a unigram if a longer phrase already contains it as a weaker duplicate
    const covered = picked.some((p) => p !== term && (p.includes(term) || term.includes(p) && p.split(" ").length >= term.split(" ").length));
    if (covered && term.split(" ").length === 1) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    picked.push(term);
  }
  return picked;
}

export function matchKeywords(resumeText: string, jobDescription: string): {
  matchRate: number | null;
  matched: KeywordHit[];
  missing: KeywordHit[];
} {
  const terms = extractJobKeywords(jobDescription);
  if (!terms.length) {
    return { matchRate: null, matched: [], missing: [] };
  }
  const hits: KeywordHit[] = terms.map((term) => {
    const count = countPhrase(resumeText, term);
    return {
      term,
      inResume: count > 0,
      count,
      importance: importanceFor(term, jobDescription),
    };
  });
  const required = hits.filter((h) => h.importance === "required");
  const pool = required.length >= 4 ? required : hits;
  const matchedCount = pool.filter((h) => h.inResume).length;
  const matchRate = pool.length ? Math.round((matchedCount / pool.length) * 100) : null;
  return {
    matchRate,
    matched: hits.filter((h) => h.inResume),
    missing: hits.filter((h) => !h.inResume),
  };
}
