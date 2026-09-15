import mammoth from "mammoth";
import { loadPdfJs } from "@/lib/pdfjs";
import type { AtsSection, LayoutSignals, ParsedResume } from "./types";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:\s*(?:x|ext\.?)\s*\d{1,6})?/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9_-]+\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i;
const URL_RE = /https?:\/\/[^\s)]+/i;

const SECTIONS: { id: string; label: string; re: RegExp }[] = [
  { id: "summary", label: "Summary / Profile", re: /^(summary|profile|objective|about me|professional summary|career summary)\b/im },
  { id: "experience", label: "Experience", re: /^(experience|work experience|employment|work history|professional experience|relevant experience)\b/im },
  { id: "education", label: "Education", re: /^(education|academic|academics|qualifications)\b/im },
  { id: "skills", label: "Skills", re: /^(skills|technical skills|core skills|competencies|technologies|tech stack|expertise)\b/im },
  { id: "projects", label: "Projects", re: /^(projects|selected projects|personal projects|portfolio)\b/im },
  { id: "certifications", label: "Certifications", re: /^(certifications?|licenses?|certificates)\b/im },
];

function emptyLayout(): LayoutSignals {
  return {
    pages: 1,
    imageCount: 0,
    uniqueFonts: 0,
    hasMultiColumn: false,
    tableCount: 0,
    likelyScanned: false,
    headerFooterContact: false,
    textItemCount: 0,
  };
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[0] : null;
}

function detectSections(text: string): AtsSection[] {
  return SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    found: s.re.test(text),
  }));
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function finish(partial: Omit<ParsedResume, "wordCount" | "charCount" | "email" | "phone" | "linkedin" | "github" | "url" | "sections">): ParsedResume {
  const text = partial.text.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return {
    ...partial,
    text,
    wordCount: wordCount(text),
    charCount: text.length,
    email: firstMatch(text, EMAIL_RE),
    phone: firstMatch(text, PHONE_RE) && (text.match(PHONE_RE)?.[0].replace(/\D/g, "").length ?? 0) >= 10
      ? text.match(PHONE_RE)![0]
      : null,
    linkedin: firstMatch(text, LINKEDIN_RE),
    github: firstMatch(text, GITHUB_RE),
    url: firstMatch(text, URL_RE),
    sections: detectSections(text),
  };
}

type LineItem = { str: string; x: number; y: number; width: number; fontName: string };

function groupLines(items: LineItem[], yTol = 2.4): LineItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: LineItem[][] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].y - it.y) <= yTol) last.push(it);
    else lines.push([it]);
  }
  for (const line of lines) line.sort((a, b) => a.x - b.x);
  return lines;
}

function joinLine(items: LineItem[]): string {
  let out = "";
  let prevEnd = -Infinity;
  for (const it of items) {
    if (!it.str) continue;
    const gap = it.x - prevEnd;
    if (out && gap > 1.2) out += " ";
    out += it.str;
    prevEnd = it.x + (it.width || 0);
  }
  return out.replace(/\s+/g, " ").trim();
}

function detectColumns(items: LineItem[], pageWidth: number): boolean {
  if (items.length < 20 || pageWidth < 100) return false;
  const mid = pageWidth / 2;
  const left = items.filter((i) => i.x + i.width < mid - pageWidth * 0.06).length;
  const right = items.filter((i) => i.x > mid + pageWidth * 0.06).length;
  const both = left > items.length * 0.22 && right > items.length * 0.22;
  if (!both) return false;
  // Confirm a gutter: few items straddling the middle
  const gutter = items.filter((i) => i.x < mid && i.x + i.width > mid).length;
  return gutter < items.length * 0.08;
}

export async function parsePdfResume(file: File): Promise<ParsedResume> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageTexts: string[] = [];
  const fonts = new Set<string>();
  let imageCount = 0;
  let textItemCount = 0;
  let hasMultiColumn = false;
  let headerFooterContact = false;
  const emailRe = EMAIL_RE;
  const phoneRe = PHONE_RE;

  const opsPaint = new Set<number>();
  const OPS = (pdfjs as unknown as { OPS?: Record<string, number> }).OPS;
  if (OPS) {
    for (const key of Object.keys(OPS)) {
      if (/paintImage|paintJpeg|paintInlineImage/i.test(key)) opsPaint.add(OPS[key]);
    }
  }

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: LineItem[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !("transform" in raw)) continue;
      const t = raw.transform as number[];
      const fontName = "fontName" in raw && typeof raw.fontName === "string" ? raw.fontName : "";
      if (fontName) fonts.add(fontName);
      items.push({
        str: raw.str,
        x: t[4],
        y: t[5],
        width: "width" in raw && typeof raw.width === "number" ? raw.width : 0,
        fontName,
      });
    }
    textItemCount += items.length;
    if (detectColumns(items, viewport.width)) hasMultiColumn = true;

    const headerY = viewport.height * 0.9;
    const footerY = viewport.height * 0.1;
    const edgeText = items
      .filter((it) => it.y > headerY || it.y < footerY)
      .map((it) => it.str)
      .join(" ");
    const bodyText = items
      .filter((it) => it.y <= headerY && it.y >= footerY)
      .map((it) => it.str)
      .join(" ");
    if ((emailRe.test(edgeText) || (phoneRe.test(edgeText) && (edgeText.match(phoneRe)?.[0].replace(/\D/g, "").length ?? 0) >= 10)) &&
        !emailRe.test(bodyText) &&
        !(phoneRe.test(bodyText) && (bodyText.match(phoneRe)?.[0].replace(/\D/g, "").length ?? 0) >= 10)) {
      headerFooterContact = true;
    }

    try {
      const opList = await page.getOperatorList();
      for (const fn of opList.fnArray) {
        if (opsPaint.has(fn)) imageCount++;
      }
    } catch {
      /* operator list is best-effort */
    }

    const lines = groupLines(items);
    pageTexts.push(lines.map(joinLine).filter(Boolean).join("\n"));
  }

  const text = pageTexts.join("\n\n");
  const likelyScanned = doc.numPages > 0 && wordCount(text) < 40 * doc.numPages && imageCount > 0;

  return finish({
    text,
    source: "pdf",
    fileName: file.name,
    fileSize: file.size,
    pages: doc.numPages,
    layout: {
      pages: doc.numPages,
      imageCount,
      uniqueFonts: fonts.size,
      hasMultiColumn,
      tableCount: 0,
      likelyScanned,
      headerFooterContact,
      textItemCount,
    },
  });
}

export async function parseDocxResume(file: File): Promise<ParsedResume> {
  const arrayBuffer = await file.arrayBuffer();
  const raw = await mammoth.extractRawText({ arrayBuffer });
  const html = await mammoth.convertToHtml({ arrayBuffer });
  const tableCount = (html.value.match(/<table\b/gi) ?? []).length;
  const imageCount = (html.value.match(/<img\b/gi) ?? []).length;
  const text = raw.value.replace(/\r\n/g, "\n");
  const pages = Math.max(1, Math.ceil(wordCount(text) / 450));
  return finish({
    text,
    source: "docx",
    fileName: file.name,
    fileSize: file.size,
    pages,
    layout: {
      ...emptyLayout(),
      pages,
      imageCount,
      tableCount,
      likelyScanned: wordCount(text) < 40 && imageCount > 0,
    },
  });
}

export function parsePlainResume(text: string, fileName = "pasted-resume.txt", fileSize = 0): ParsedResume {
  const pages = Math.max(1, Math.ceil(wordCount(text) / 450));
  return finish({
    text,
    source: fileName.toLowerCase().endsWith(".txt") ? "txt" : "paste",
    fileName,
    fileSize: fileSize || new Blob([text]).size,
    pages,
    layout: { ...emptyLayout(), pages },
  });
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  const name = file.name.toLowerCase();
  const type = file.type;
  if (name.endsWith(".pdf") || type === "application/pdf") return parsePdfResume(file);
  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocxResume(file);
  }
  if (name.endsWith(".txt") || type === "text/plain") {
    return parsePlainResume(await file.text(), file.name, file.size);
  }
  if (name.endsWith(".doc")) {
    throw new Error("Old .doc files are not parseable here. Save as PDF or .docx — those are what most ATS systems accept.");
  }
  throw new Error("Upload a PDF, DOCX, or TXT resume (not a screenshot or image).");
}
