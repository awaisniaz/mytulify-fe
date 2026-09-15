export type AtsSeverity = "critical" | "warning" | "info" | "pass";

export type AtsCategory =
  | "parse"
  | "format"
  | "structure"
  | "content"
  | "keywords"
  | "contact";

export interface AtsIssue {
  id: string;
  severity: AtsSeverity;
  category: AtsCategory;
  title: string;
  detail: string;
  howToFix: string;
  example?: string;
}

export type KeywordImportance = "required" | "preferred" | "other";

export interface KeywordHit {
  term: string;
  inResume: boolean;
  count: number;
  importance: KeywordImportance;
}

export interface AtsSection {
  id: string;
  label: string;
  found: boolean;
}

export interface LayoutSignals {
  pages: number;
  imageCount: number;
  uniqueFonts: number;
  hasMultiColumn: boolean;
  tableCount: number;
  likelyScanned: boolean;
  headerFooterContact: boolean;
  textItemCount: number;
}

export interface ParsedResume {
  text: string;
  source: "pdf" | "docx" | "txt" | "paste";
  fileName: string;
  fileSize: number;
  wordCount: number;
  charCount: number;
  pages: number;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  url: string | null;
  sections: AtsSection[];
  layout: LayoutSignals;
}

export interface CategoryScores {
  parse: number;
  format: number;
  structure: number;
  content: number;
  keywords: number | null;
}

export interface AtsReport {
  overallScore: number;
  verdict: string;
  categoryScores: CategoryScores;
  issues: AtsIssue[];
  keywords: {
    matchRate: number | null;
    matched: KeywordHit[];
    missing: KeywordHit[];
  };
  parsed: ParsedResume;
  strengths: string[];
}

export interface AiAtsReview {
  contentScore?: number;
  summary?: string;
  issues?: Array<{
    severity?: string;
    category?: string;
    title?: string;
    detail?: string;
    howToFix?: string;
    example?: string;
  }>;
  strengths?: string[];
  keywordSuggestions?: string[];
  bulletRewrites?: Array<{ original?: string; improved?: string }>;
}
