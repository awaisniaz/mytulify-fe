import type { AiAtsReview, AtsCategory, AtsIssue, AtsReport, AtsSeverity } from "./types";

const SEVERITIES: AtsSeverity[] = ["critical", "warning", "info", "pass"];
const CATEGORIES: AtsCategory[] = ["parse", "format", "structure", "content", "keywords", "contact"];

export function parseAiAtsReview(raw: string): AiAtsReview | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as AiAtsReview;
  } catch {
    return null;
  }
}

function asSeverity(v: unknown): AtsSeverity {
  return SEVERITIES.includes(v as AtsSeverity) ? (v as AtsSeverity) : "info";
}

function asCategory(v: unknown): AtsCategory {
  return CATEGORIES.includes(v as AtsCategory) ? (v as AtsCategory) : "content";
}

export function mergeAiReview(report: AtsReport, review: AiAtsReview | null, rawText: string): AtsReport {
  if (!review) {
    return {
      ...report,
      issues: [
        ...report.issues,
        {
          id: "ai-unparsed",
          severity: "info",
          category: "content",
          title: "AI notes (unstructured)",
          detail: rawText.slice(0, 4000),
          howToFix: "Use the suggestions above together with the ATS parse issues.",
        },
      ],
    };
  }

  const extra: AtsIssue[] = (review.issues ?? [])
    .filter((i) => i.title && i.detail)
    .map((i, idx) => ({
      id: `ai-${idx}-${(i.title ?? "issue").toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
      severity: asSeverity(i.severity),
      category: asCategory(i.category),
      title: i.title!.trim(),
      detail: i.detail!.trim(),
      howToFix: (i.howToFix ?? "").trim() || "Revise the résumé using the detail above.",
      example: i.example?.trim() || undefined,
    }));

  const seen = new Set(report.issues.map((i) => i.title.toLowerCase()));
  const novel = extra.filter((i) => !seen.has(i.title.toLowerCase()));

  const strengths = [...report.strengths];
  for (const s of review.strengths ?? []) {
    if (s && !strengths.includes(s)) strengths.push(s);
  }

  let content = report.categoryScores.content;
  if (typeof review.contentScore === "number" && Number.isFinite(review.contentScore)) {
    content = Math.round((content + Math.max(0, Math.min(100, review.contentScore))) / 2);
  }

  const categoryScores = { ...report.categoryScores, content };
  const overallScore =
    categoryScores.keywords == null
      ? Math.round(categoryScores.parse * 0.28 + categoryScores.format * 0.18 + categoryScores.structure * 0.28 + content * 0.26)
      : Math.round(
          categoryScores.parse * 0.2 +
            categoryScores.format * 0.12 +
            categoryScores.structure * 0.2 +
            content * 0.18 +
            categoryScores.keywords * 0.3,
        );

  const issues = [...report.issues, ...novel];
  const severityRank: Record<string, number> = { critical: 0, warning: 1, info: 2, pass: 3 };
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  if (review.keywordSuggestions?.length && report.keywords.matchRate != null) {
    issues.push({
      id: "ai-keyword-suggestions",
      severity: "info",
      category: "keywords",
      title: "Extra phrasing the job ad cares about",
      detail: `If these are true for you, add them in Skills or a bullet: ${review.keywordSuggestions.slice(0, 12).join(", ")}.`,
      howToFix: "Only add skills you can defend in an interview. Match the employer’s spelling.",
    });
  }

  for (const rw of (review.bulletRewrites ?? []).slice(0, 5)) {
    if (!rw.original || !rw.improved) continue;
    issues.push({
      id: `ai-rewrite-${rw.original.slice(0, 24)}`,
      severity: "info",
      category: "content",
      title: "Stronger ATS bullet",
      detail: `Original: ${rw.original}`,
      howToFix: "Replace with the improved line if it is accurate.",
      example: rw.improved,
    });
  }

  const verdict =
    overallScore >= 85
      ? "ATS-ready — small polish left"
      : overallScore >= 70
        ? "Fair match — fix the issues below before applying"
        : overallScore >= 50
          ? "At risk — several ATS blockers"
          : "Poor parse / match — rewrite for ATS before sending";

  return {
    ...report,
    overallScore,
    verdict,
    categoryScores,
    issues,
    strengths,
  };
}
