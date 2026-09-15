import { matchKeywords } from "./keywords";
import type { AtsIssue, AtsReport, CategoryScores, ParsedResume } from "./types";

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function verdictFor(score: number): string {
  if (score >= 85) return "ATS-ready — small polish left";
  if (score >= 70) return "Fair match — fix the issues below before applying";
  if (score >= 50) return "At risk — several ATS blockers";
  return "Poor parse / match — rewrite for ATS before sending";
}

const FANCY = /[✓✔●◆■►▸❖★☆❖❑□■▪▫◦‣⁃]/;

function filenameIssues(parsed: ParsedResume): AtsIssue[] {
  const issues: AtsIssue[] = [];
  const name = parsed.fileName;
  if (parsed.source === "paste") return issues;
  if (/\s{2,}|\(|\)|copy|final|untitled|document|resume\s*\d/i.test(name) || /[^\w.\- ]/.test(name)) {
    issues.push({
      id: "filename-messy",
      severity: "info",
      category: "format",
      title: "File name looks messy",
      detail: `ATS and recruiters see the file name in the attachment list. "${name}" looks like a draft dump, not a candidate document.`,
      howToFix: "Rename to FirstLast_Role_Resume.pdf — letters, numbers, hyphens or underscores only. No “(1)”, “FINAL”, or emoji.",
    });
  }
  if (parsed.fileSize > 5 * 1024 * 1024) {
    issues.push({
      id: "file-too-large",
      severity: "warning",
      category: "format",
      title: "File is larger than 5 MB",
      detail: "Several ATS portals reject uploads over 2–5 MB or time out while parsing.",
      howToFix: "Export a text-based PDF (not a scanned image). Compress images or drop a photo to stay under 2 MB.",
    });
  }
  return issues;
}

function parseIssues(parsed: ParsedResume): { issues: AtsIssue[]; score: number } {
  const issues: AtsIssue[] = [];
  let score = 100;

  if (parsed.layout.likelyScanned || parsed.wordCount < 80) {
    issues.push({
      id: "scanned-or-empty",
      severity: "critical",
      category: "parse",
      title: "ATS cannot read enough text",
      detail: parsed.layout.likelyScanned
        ? "This looks like a scanned or image-based résumé. Applicant tracking systems extract text, not pixels — a photo of a CV scores near zero."
        : `Only ${parsed.wordCount} words were extracted. An ATS will treat this as a blank or broken file.`,
      howToFix: "Rebuild in Word/Google Docs and Export as PDF (File → Download → PDF). Do not screenshot, do not flatten to an image, and skip Canva/InDesign exports that outline text.",
    });
    score -= 55;
  }

  if (parsed.layout.hasMultiColumn) {
    issues.push({
      id: "multi-column",
      severity: "critical",
      category: "parse",
      title: "Multi-column layout detected",
      detail: "Two-column résumés (sidebar skills + main timeline) scramble reading order. ATS parsers often interleave columns: job titles mixed into the skills list, dates attached to the wrong employer.",
      howToFix: "Use a single column, top to bottom. Skills can sit under a Skills heading — not in a left rail. Tables and text boxes are the usual cause; delete them.",
    });
    score -= 22;
  }

  if (parsed.layout.tableCount > 0) {
    issues.push({
      id: "tables",
      severity: "critical",
      category: "parse",
      title: `${parsed.layout.tableCount} table${parsed.layout.tableCount > 1 ? "s" : ""} found`,
      detail: "Workday, Taleo, Greenhouse, and iCIMS frequently skip or jumbled table cells. Contact info and dates inside tables are a common reason candidates look unqualified in the ATS view.",
      howToFix: "Replace tables with headings + bullet lists. In Word: Table → Convert to Text. Check the Parsed text tab after re-upload.",
    });
    score -= Math.min(18, parsed.layout.tableCount * 8);
  }

  if (parsed.layout.imageCount >= 3) {
    issues.push({
      id: "images",
      severity: "warning",
      category: "parse",
      title: `${parsed.layout.imageCount} images/graphics on the résumé`,
      detail: "Icons used as section labels, skill bars, and headshots are invisible to ATS. If “Experience” is only an icon, the section may not register.",
      howToFix: "Remove photos, skill meters, and icon headings. Type the word Experience, Education, Skills as plain text headings.",
    });
    score -= 12;
  } else if (parsed.layout.imageCount > 0) {
    issues.push({
      id: "images-few",
      severity: "info",
      category: "parse",
      title: "Graphic elements present",
      detail: `${parsed.layout.imageCount} image object(s) were found. A logo or photo will not be read; keep all important words as real text.`,
      howToFix: "Leave a simple text header. Skip logos, charts, and headshots for ATS submissions (you can use a designed PDF later for a human-only email).",
    });
    score -= 4;
  }

  if (parsed.layout.headerFooterContact) {
    issues.push({
      id: "header-footer-contact",
      severity: "critical",
      category: "contact",
      title: "Contact details sit in the header/footer",
      detail: "Many parsers ignore running headers and footers. If email or phone only appear there, the ATS profile is created with no contact fields — recruiters cannot email you from the system.",
      howToFix: "Put name, city, phone, email, and LinkedIn in the first lines of the document body — not in Insert → Header.",
    });
    score -= 20;
  }

  if (parsed.layout.uniqueFonts > 8) {
    issues.push({
      id: "too-many-fonts",
      severity: "info",
      category: "format",
      title: "Too many fonts",
      detail: `${parsed.layout.uniqueFonts} font files were embedded. Decorative fonts can subset poorly and extract as garbage characters.`,
      howToFix: "Stick to Calibri, Arial, Cambria, Georgia, or Helvetica. One font family, two weights (regular + bold).",
    });
    score -= 4;
  }

  return { issues, score: clamp(score) };
}

function formatIssues(parsed: ParsedResume): { issues: AtsIssue[]; score: number } {
  const issues: AtsIssue[] = [...filenameIssues(parsed)];
  let score = 100;

  if (parsed.source === "txt" || parsed.source === "paste") {
    issues.push({
      id: "plain-text-ok",
      severity: "info",
      category: "format",
      title: "Checking pasted / plain text",
      detail: "Plain text is ATS-safe, but employers usually want a PDF. Run the check again on the file you will actually upload.",
      howToFix: "Save a .docx, then File → Export → PDF (text-based). Re-upload that PDF here.",
    });
    score -= 6;
  }

  if (parsed.pages > 2) {
    issues.push({
      id: "too-long",
      severity: "warning",
      category: "format",
      title: `Résumé is ${parsed.pages} pages`,
      detail: "Most ATS-screened professional roles expect 1 page (<10 years) or 2 pages (senior). Extra pages dilute keyword density and get truncated in some viewers.",
      howToFix: "Cut older roles to one line, drop generic objectives, and keep 10–15 year window unless academia/federal.",
    });
    score -= 14;
  } else if (parsed.pages === 1 && parsed.wordCount > 900) {
    issues.push({
      id: "cramped",
      severity: "warning",
      category: "format",
      title: "Too much text packed onto one page",
      detail: `${parsed.wordCount} words on one page usually means tiny type or dense columns — both hurt parse quality and recruiter skim time.`,
      howToFix: "11–12 pt body, 0.5–0.75 in margins, generous line spacing. Move overflow to page 2 rather than shrinking fonts.",
    });
    score -= 10;
  }

  if (parsed.wordCount > 0 && parsed.wordCount < 320) {
    issues.push({
      id: "too-short",
      severity: "warning",
      category: "content",
      title: "Résumé is very short",
      detail: `${parsed.wordCount} words is thin for keyword matching. ATS scores improve when skills and outcomes are stated in the same language as the job ad.`,
      howToFix: "Add 3–6 bullets per recent role with tools + results. Include a Skills section listing the stack you actually used.",
    });
    score -= 16;
  } else if (parsed.wordCount > 1200) {
    issues.push({
      id: "too-wordy",
      severity: "info",
      category: "content",
      title: "Very long body copy",
      detail: `${parsed.wordCount} words. Parsers will still read it, but recruiters spend ~7 seconds on a first pass.`,
      howToFix: "Keep bullets to one line. Drop duties that every peer also does; keep outcomes.",
    });
    score -= 6;
  }

  if (FANCY.test(parsed.text)) {
    issues.push({
      id: "fancy-bullets",
      severity: "warning",
      category: "format",
      title: "Decorative bullet / symbol characters",
      detail: "Characters like ★ ● ✓ often become tofu (□) or vanish in ATS plain-text view, gluing words together.",
      howToFix: "Use standard hyphens (-) or the Word bullet library’s simple round bullets. Avoid Wingdings and emoji.",
    });
    score -= 8;
  }

  const lines = parsed.text.split("\n").filter((l) => l.trim());
  const allCaps = lines.filter((l) => l.trim().length > 12 && l === l.toUpperCase() && /[A-Z]/.test(l)).length;
  if (allCaps > 6) {
    issues.push({
      id: "all-caps",
      severity: "info",
      category: "format",
      title: "Heavy ALL CAPS usage",
      detail: "Some parsers tokenize ALL CAPS poorly, and it reads as shouting. Headings in Title Case parse more reliably.",
      howToFix: "Section headings in Title Case (Work Experience), not WORK EXPERIENCE. Body in sentence case.",
    });
    score -= 4;
  }

  return { issues, score: clamp(score - issues.filter((i) => i.id.startsWith("filename") || i.id === "file-too-large").length * 3) };
}

function structureIssues(parsed: ParsedResume): { issues: AtsIssue[]; score: number } {
  const issues: AtsIssue[] = [];
  let score = 100;
  const byId = Object.fromEntries(parsed.sections.map((s) => [s.id, s.found]));

  if (!parsed.email) {
    issues.push({
      id: "no-email",
      severity: "critical",
      category: "contact",
      title: "No email address found",
      detail: "ATS candidate records key off email. If it is missing, formatted as an image, or split with spaces (jane @ gmail), the profile is incomplete.",
      howToFix: "Add a plain-text email on line 2: jane.doe@email.com — no icons, no “Email:” inside a text box.",
    });
    score -= 22;
  }
  if (!parsed.phone) {
    issues.push({
      id: "no-phone",
      severity: "warning",
      category: "contact",
      title: "No phone number found",
      detail: "Phone is a standard ATS field. Unusual separators or numbers inside a graphic are skipped.",
      howToFix: "Use an international or local format in the body, e.g. +92 300 1234567 or (415) 555-0133.",
    });
    score -= 10;
  }
  if (!parsed.linkedin) {
    issues.push({
      id: "no-linkedin",
      severity: "info",
      category: "contact",
      title: "No LinkedIn URL",
      detail: "Not a hard ATS reject, but recruiters click through. Custom LinkedIn URLs also double as a unique identifier.",
      howToFix: "Add https://www.linkedin.com/in/yourname as plain text (not a tiny icon).",
    });
    score -= 4;
  }

  if (!byId.experience) {
    issues.push({
      id: "no-experience-heading",
      severity: "critical",
      category: "structure",
      title: "No standard Experience heading",
      detail: "ATS section mapping looks for headings like Experience, Work Experience, or Employment. Creative labels (Where I’ve made impact) are ignored, so dates and employers may not land in the right fields.",
      howToFix: "Use a line that is only: Experience  (or Work Experience). Then company, title, dates, bullets.",
    });
    score -= 20;
  }
  if (!byId.education) {
    issues.push({
      id: "no-education-heading",
      severity: "warning",
      category: "structure",
      title: "No Education heading",
      detail: "Degree filters in ATS (Bachelor’s required) need an Education section they can map.",
      howToFix: "Add Education with school, degree, field, and graduation year. Skip GPA unless asked or you are early-career.",
    });
    score -= 10;
  }
  if (!byId.skills) {
    issues.push({
      id: "no-skills-heading",
      severity: "warning",
      category: "structure",
      title: "No Skills heading",
      detail: "Hard-skill keyword hits are more reliable in a dedicated Skills list than buried in paragraphs. Many ATS skill clouds are built from this section.",
      howToFix: "Add Skills and list tools in the same spelling as the job ad (React, not “front-end library”). Comma-separated or bullets — not skill bars.",
    });
    score -= 14;
  }

  const dateHits = parsed.text.match(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+'?\d{2,4}\b|\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current|now)\b|\b(?:0?[1-9]|1[0-2])[/\-](?:19|20)\d{2}\b/gi,
  );
  if (!dateHits || dateHits.length < 2) {
    issues.push({
      id: "dates-unclear",
      severity: "warning",
      category: "structure",
      title: "Employment dates are hard to parse",
      detail: "ATS timeline fields expect Month Year or MM/YYYY. “Summer ’19 – late 21” leaves gaps that look like job hopping or missing history.",
      howToFix: "Use Jan 2022 – Present or 01/2022 – 03/2024 on every role, same format throughout. Spell Present, not a tilde.",
    });
    score -= 12;
  }

  return { issues, score: clamp(score) };
}

function contentIssues(parsed: ParsedResume): { issues: AtsIssue[]; score: number; strengths: string[] } {
  const issues: AtsIssue[] = [];
  const strengths: string[] = [];
  let score = 78;
  const text = parsed.text;
  const words = parsed.wordCount || 1;

  const metrics = text.match(/\b\d+(?:\.\d+)?\s?%|\$\s?\d|\b\d+\s?(?:k|m|million|billion|users|customers|clients|people|hours|days|weeks|months)\b/gi) ?? [];
  if (metrics.length >= 4) {
    strengths.push(`Measurable results found (${metrics.length} number/metric mentions).`);
    score += 10;
  } else if (metrics.length === 0) {
    issues.push({
      id: "no-metrics",
      severity: "warning",
      category: "content",
      title: "Almost no numbers or outcomes",
      detail: "ATS does not grade “impact”, but recruiters and ranking models both prefer bullets with scale (%, $, time, volume). Duty-only résumés look interchangeable.",
      howToFix: "Rewrite bullets as: action + tool + result. Example: Cut invoice cycle from 12 days to 4 using Xero, saving ~6 hours/week.",
      example: "Led a team → Led a 6-person squad that shipped a billing v2 and cut failed payments 18% in one quarter.",
    });
    score -= 16;
  } else {
    issues.push({
      id: "few-metrics",
      severity: "info",
      category: "content",
      title: "Few quantified achievements",
      detail: `Only ${metrics.length} metric-like number(s) detected. Add scale on the two most recent roles.`,
      howToFix: "Give each recent job 1–2 bullets with a number: revenue, speed, quality, cost, users, or time saved.",
    });
    score -= 6;
  }

  const iCount = (text.match(/\bI\b/g) ?? []).length;
  const myCount = (text.match(/\b[Mm]y\b/g) ?? []).length;
  if (iCount + myCount > 8) {
    issues.push({
      id: "first-person",
      severity: "info",
      category: "content",
      title: "First-person pronouns (I / my)",
      detail: "Résumés in ATS databases are usually third-person implied (“Led”, not “I led”). Pronouns waste characters and look unedited.",
      howToFix: "Start bullets with past-tense verbs: Led, Built, Shipped, Reduced. Drop I, me, my.",
    });
    score -= 5;
  }

  const bullets = (text.match(/(^|\n)\s*(?:[-*•]|\d+\.)\s+\S/g) ?? []).length;
  if (bullets < 4 && words > 200) {
    issues.push({
      id: "few-bullets",
      severity: "warning",
      category: "content",
      title: "Few bullet points — looks like paragraphs",
      detail: "Long paragraphs are harder for both ATS snippet views and recruiters. Achievement lines parse as separate facts.",
      howToFix: "3–6 bullets per recent role. One idea per bullet, ~12–20 words.",
    });
    score -= 10;
  } else if (bullets >= 6) {
    strengths.push("Uses bullet points, which parse cleanly in most ATS.");
    score += 4;
  }

  const weak = (text.match(/\b(responsible for|duties included|helped with|worked on|various|etc\.|tasked with)\b/gi) ?? []).length;
  if (weak >= 3) {
    issues.push({
      id: "weak-verbs",
      severity: "warning",
      category: "content",
      title: "Duty language instead of achievements",
      detail: `Phrases like “responsible for” / “helped with” appeared ${weak} times. They describe a job description, not what you delivered.`,
      howToFix: "Swap for owned outcomes: “Owned X, resulting in Y.” Keep the tools the posting names.",
    });
    score -= 8;
  }

  if (parsed.sections.find((s) => s.id === "skills")?.found) {
    strengths.push("Has a Skills section — good for keyword mapping.");
  }
  if (parsed.email && parsed.phone) {
    strengths.push("Email and phone are in the extracted text.");
  }

  return { issues, score: clamp(score), strengths };
}

function keywordIssues(
  parsed: ParsedResume,
  jobDescription: string,
): { issues: AtsIssue[]; score: number | null; matchRate: number | null; matched: ReturnType<typeof matchKeywords>["matched"]; missing: ReturnType<typeof matchKeywords>["missing"] } {
  const { matchRate, matched, missing } = matchKeywords(parsed.text, jobDescription);
  if (matchRate == null) {
    return {
      issues: [
        {
          id: "no-jd",
          severity: "info",
          category: "keywords",
          title: "No job description — keyword match skipped",
          detail: "ATS ranking is almost always job-specific. Without the posting, this check can only score parseability and structure — not whether you will rank for a role.",
          howToFix: "Paste the full job ad (requirements + responsibilities) and run the check again. Mirror honest keywords in Skills and in 2–3 bullets.",
        },
      ],
      score: null,
      matchRate: null,
      matched,
      missing,
    };
  }

  const issues: AtsIssue[] = [];
  let score = matchRate;
  const requiredMissing = missing.filter((m) => m.importance === "required");
  const topMissing = missing.slice(0, 12);

  if (matchRate < 45) {
    issues.push({
      id: "keyword-low",
      severity: "critical",
      category: "keywords",
      title: `Low keyword match (${matchRate}%)`,
      detail: `The posting’s important terms barely appear in the résumé. Ranking models (Workday, Lever, Greenhouse) score overlap between the job description and parsed résumé text. Missing: ${topMissing.map((m) => m.term).slice(0, 8).join(", ") || "—"}.`,
      howToFix: "Copy the exact tool/skill names from the ad into Skills if you have used them. Then add one bullet per must-have skill showing where you used it. Do not stuff skills you do not have.",
    });
  } else if (matchRate < 70) {
    issues.push({
      id: "keyword-mid",
      severity: "warning",
      category: "keywords",
      title: `Partial keyword match (${matchRate}%)`,
      detail: `You overlap with some of the posting, but ${missing.length} scored term(s) are absent. ATS often filters “must have” skills before a human sees the file.`,
      howToFix: `Add the missing terms you genuinely have. Highest-priority gaps: ${requiredMissing.concat(topMissing).slice(0, 8).map((m) => m.term).join(", ")}.`,
    });
  } else {
    issues.push({
      id: "keyword-ok",
      severity: "pass",
      category: "keywords",
      title: `Solid keyword overlap (${matchRate}%)`,
      detail: "The résumé already shares a good amount of language with the posting. Tighten remaining gaps without keyword stuffing.",
      howToFix: missing.length
        ? `Optional adds if true: ${missing.slice(0, 6).map((m) => m.term).join(", ")}.`
        : "Keep spellings identical to the job ad (e.g. JavaScript vs JS).",
    });
    score = Math.min(100, matchRate + 4);
  }

  if (requiredMissing.length >= 2 && matchRate >= 45) {
    issues.push({
      id: "required-skills-missing",
      severity: "critical",
      category: "keywords",
      title: `${requiredMissing.length} required-style terms missing`,
      detail: `These appear next to “required / must have / qualifications” in the ad but not in the résumé: ${requiredMissing.slice(0, 10).map((m) => m.term).join(", ")}.`,
      howToFix: "If you have the skill, use that exact phrase. If you don’t, do not invent it — apply only if you meet the real must-haves.",
    });
    score = Math.max(0, score - 12);
  }

  return { issues, score: clamp(score), matchRate, matched, missing };
}

function overall(scores: CategoryScores): number {
  if (scores.keywords == null) {
    return clamp(scores.parse * 0.28 + scores.format * 0.18 + scores.structure * 0.28 + scores.content * 0.26);
  }
  return clamp(
    scores.parse * 0.2 +
      scores.format * 0.12 +
      scores.structure * 0.2 +
      scores.content * 0.18 +
      scores.keywords * 0.3,
  );
}

export function buildAtsReport(parsed: ParsedResume, jobDescription = ""): AtsReport {
  const parse = parseIssues(parsed);
  const format = formatIssues(parsed);
  const structure = structureIssues(parsed);
  const content = contentIssues(parsed);
  const keywords = keywordIssues(parsed, jobDescription);

  const categoryScores: CategoryScores = {
    parse: parse.score,
    format: format.score,
    structure: structure.score,
    content: content.score,
    keywords: keywords.score,
  };

  const issues = [...parse.issues, ...format.issues, ...structure.issues, ...content.issues, ...keywords.issues].filter(
    (i) => i.severity !== "pass" || i.category === "keywords",
  );

  const severityRank: Record<string, number> = { critical: 0, warning: 1, info: 2, pass: 3 };
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const overallScore = overall(categoryScores);
  return {
    overallScore,
    verdict: verdictFor(overallScore),
    categoryScores,
    issues,
    keywords: {
      matchRate: keywords.matchRate,
      matched: keywords.matched,
      missing: keywords.missing,
    },
    parsed,
    strengths: content.strengths,
  };
}

export function reportToText(report: AtsReport): string {
  const lines: string[] = [
    `ATS score: ${report.overallScore}/100 — ${report.verdict}`,
    `Parse ${report.categoryScores.parse} · Format ${report.categoryScores.format} · Structure ${report.categoryScores.structure} · Content ${report.categoryScores.content} · Keywords ${report.categoryScores.keywords ?? "n/a"}`,
    "",
    "Issues",
    ...report.issues.map(
      (i) =>
        `[${i.severity.toUpperCase()}] ${i.title}\n  ${i.detail}\n  Fix: ${i.howToFix}${i.example ? `\n  Example: ${i.example}` : ""}`,
    ),
    "",
    report.keywords.matchRate != null ? `Keyword match: ${report.keywords.matchRate}%` : "Keyword match: (no job description)",
    report.keywords.missing.length ? `Missing: ${report.keywords.missing.map((k) => k.term).join(", ")}` : "",
    "",
    "Parsed text",
    report.parsed.text,
  ];
  return lines.filter(Boolean).join("\n");
}
