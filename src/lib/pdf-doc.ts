import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { download } from "@/lib/utils";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 56;
const MARGIN_TOP = 52;
const FOOTER_H = 48;
const HEADER_BAND = 6;
/** Body content must stay above this Y so footer never collides. */
const CONTENT_BOTTOM = FOOTER_H + 28;
const MAX_W = PAGE_W - MARGIN_X * 2;

const BRAND = rgb(0.05, 0.58, 0.53);
const INK = rgb(0.12, 0.14, 0.16);
const MUTED = rgb(0.4, 0.43, 0.47);
const RULE = rgb(0.88, 0.9, 0.92);
const SOFT = rgb(0.96, 0.97, 0.98);

export type PdfDocOptions = {
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
  sections: { heading?: string; body: string }[];
  footerLeft?: string;
  footerRight?: string;
  watermark?: string;
  signatures?: string[];
  filename: string;
};

function wrap(text: string, size: number, font: PDFFont, maxW = MAX_W): string[] {
  const paragraphs = String(text ?? "").replace(/\r/g, "").split("\n");
  const out: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out.length ? out : [""];
}

function drawWatermark(page: PDFPage, font: PDFFont, text: string) {
  const size = 42;
  const label = text.slice(0, 40);
  page.drawText(label, {
    x: 90,
    y: 360,
    size,
    font,
    color: rgb(0.78, 0.82, 0.85),
    opacity: 0.22,
    rotate: degrees(32),
  });
}

function drawPageChrome(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  opts: {
    footerLeft: string;
    footerRight: string;
    watermark?: string;
    pageNum: number;
    pageCount: number;
  },
) {
  page.drawRectangle({
    x: 0,
    y: PAGE_H - HEADER_BAND,
    width: PAGE_W,
    height: HEADER_BAND,
    color: BRAND,
  });

  if (opts.watermark?.trim()) {
    drawWatermark(page, fonts.bold, opts.watermark.trim());
  }

  const footerY = 26;
  page.drawLine({
    start: { x: MARGIN_X, y: FOOTER_H },
    end: { x: PAGE_W - MARGIN_X, y: FOOTER_H },
    thickness: 0.8,
    color: RULE,
  });

  const left = opts.footerLeft || "Generated with Mytulify";
  const right = opts.footerRight || `Page ${opts.pageNum} of ${opts.pageCount}`;
  page.drawText(left, {
    x: MARGIN_X,
    y: footerY,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
  const rw = fonts.regular.widthOfTextAtSize(right, 8);
  page.drawText(right, {
    x: PAGE_W - MARGIN_X - rw,
    y: footerY,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
}

function drawSignatures(
  page: PDFPage,
  fonts: { regular: PDFFont; bold: PDFFont },
  labels: string[],
) {
  const blockH = 24 + Math.ceil(labels.length / 2) * 44;
  let y = CONTENT_BOTTOM + blockH - 6;

  page.drawText("AUTHORIZATION", {
    x: MARGIN_X,
    y,
    size: 9,
    font: fonts.bold,
    color: BRAND,
  });
  y -= 20;

  const cols = labels.length === 1 ? 1 : 2;
  const colW = cols === 1 ? MAX_W : (MAX_W - 20) / 2;

  labels.forEach((label, idx) => {
    const col = cols === 1 ? 0 : idx % 2;
    const row = cols === 1 ? idx : Math.floor(idx / 2);
    const x = MARGIN_X + col * (colW + 20);
    const lineY = y - row * 44;

    page.drawLine({
      start: { x, y: lineY },
      end: { x: x + colW, y: lineY },
      thickness: 0.9,
      color: MUTED,
    });
    page.drawText(label, {
      x,
      y: lineY - 12,
      size: 8.5,
      font: fonts.regular,
      color: MUTED,
    });
    const dateLabel = "Date ____________";
    page.drawText(dateLabel, {
      x: x + colW - fonts.regular.widthOfTextAtSize(dateLabel, 8),
      y: lineY - 12,
      size: 8,
      font: fonts.regular,
      color: MUTED,
    });
  });
}

/**
 * Designer-style multi-page PDF with:
 * brand header band, section headings, optional watermark,
 * footer pinned to bottom of every page, signatures pinned to last-page bottom.
 */
export async function exportBrandedPdf(options: PdfDocOptions): Promise<void> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  type Op =
    | { kind: "title"; text: string }
    | { kind: "subtitle"; text: string }
    | { kind: "meta"; label: string; value: string }
    | { kind: "heading"; text: string }
    | { kind: "body"; text: string }
    | { kind: "spacer"; h: number }
    | { kind: "rule" };

  const ops: Op[] = [];
  ops.push({ kind: "title", text: options.title });
  if (options.subtitle?.trim()) ops.push({ kind: "subtitle", text: options.subtitle.trim() });
  if (options.meta?.length) {
    ops.push({ kind: "spacer", h: 6 });
    for (const m of options.meta) {
      if (m.value?.trim()) ops.push({ kind: "meta", label: m.label, value: m.value });
    }
  }
  ops.push({ kind: "rule" });
  ops.push({ kind: "spacer", h: 8 });

  for (const section of options.sections) {
    if (section.heading?.trim()) ops.push({ kind: "heading", text: section.heading.trim() });
    if (section.body != null) {
      ops.push({ kind: "body", text: section.body });
      ops.push({ kind: "spacer", h: 10 });
    }
  }

  const sigCount = options.signatures?.length ?? 0;
  const sigBlockH = sigCount ? 24 + Math.ceil(sigCount / 2) * 44 + 8 : 0;

  const pages: PDFPage[] = [];
  let page = doc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H - MARGIN_TOP - 8;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - MARGIN_TOP - 8;
  };

  /** Reserve signature space on the current (would-be last) page while laying out. */
  const floor = () => CONTENT_BOTTOM + sigBlockH;

  for (const op of ops) {
    switch (op.kind) {
      case "title": {
        if (y - 36 < floor()) newPage();
        page.drawText(op.text, { x: MARGIN_X, y, size: 20, font: bold, color: INK });
        y -= 26;
        page.drawRectangle({
          x: MARGIN_X,
          y: y + 8,
          width: 56,
          height: 3,
          color: BRAND,
        });
        y -= 10;
        break;
      }
      case "subtitle": {
        for (const line of wrap(op.text, 10.5, regular)) {
          if (y - 16 < floor()) newPage();
          page.drawText(line, { x: MARGIN_X, y, size: 10.5, font: regular, color: MUTED });
          y -= 14;
        }
        y -= 4;
        break;
      }
      case "meta": {
        if (y - 16 < floor()) newPage();
        const label = `${op.label}: `;
        page.drawText(label, { x: MARGIN_X, y, size: 9.5, font: bold, color: MUTED });
        const lx = MARGIN_X + bold.widthOfTextAtSize(label, 9.5);
        const valLines = wrap(op.value, 9.5, regular, MAX_W - bold.widthOfTextAtSize(label, 9.5));
        page.drawText(valLines[0] ?? "", { x: lx, y, size: 9.5, font: regular, color: INK });
        y -= 14;
        for (let li = 1; li < valLines.length; li++) {
          if (y - 14 < floor()) newPage();
          page.drawText(valLines[li], { x: MARGIN_X, y, size: 9.5, font: regular, color: INK });
          y -= 14;
        }
        break;
      }
      case "heading": {
        if (y - 30 < floor()) newPage();
        y -= 4;
        page.drawRectangle({
          x: MARGIN_X - 6,
          y: y - 4,
          width: MAX_W + 12,
          height: 20,
          color: SOFT,
        });
        page.drawRectangle({
          x: MARGIN_X - 6,
          y: y - 4,
          width: 3,
          height: 20,
          color: BRAND,
        });
        page.drawText(op.text.toUpperCase(), {
          x: MARGIN_X + 6,
          y: y + 2,
          size: 9,
          font: bold,
          color: BRAND,
        });
        y -= 22;
        break;
      }
      case "body": {
        for (const line of wrap(op.text, 10.5, regular)) {
          if (y - 14 < floor()) newPage();
          if (line === "") {
            y -= 7;
            continue;
          }
          page.drawText(line, { x: MARGIN_X, y, size: 10.5, font: regular, color: INK });
          y -= 14;
        }
        break;
      }
      case "spacer":
        y -= op.h;
        break;
      case "rule": {
        if (y - 12 < floor()) newPage();
        page.drawLine({
          start: { x: MARGIN_X, y: y + 4 },
          end: { x: PAGE_W - MARGIN_X, y: y + 4 },
          thickness: 1,
          color: RULE,
        });
        y -= 8;
        break;
      }
    }
  }

  // Signatures always on last page, physically at bottom (above footer) — not mid-content.
  if (sigCount > 0 && options.signatures) {
    drawSignatures(pages[pages.length - 1], { regular, bold }, options.signatures);
  }

  const pageCount = pages.length;
  const footerLeft = options.footerLeft ?? "Mytulify · Free freelancer tools";
  pages.forEach((p, i) => {
    drawPageChrome(p, { regular, bold }, {
      footerLeft,
      footerRight: options.footerRight ?? `Page ${i + 1} of ${pageCount}`,
      watermark: options.watermark,
      pageNum: i + 1,
      pageCount,
    });
  });

  const bytes = await doc.save();
  download(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), options.filename);
}
