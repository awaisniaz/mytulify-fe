import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { download } from "@/lib/utils";
import {
  hexToRgb,
  normalizeWatermark,
  type PdfThemeOptions,
  type PdfWatermarkOptions,
} from "@/lib/pdf-theme";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN_X = 48;
const MARGIN_TOP = 44;
const FOOTER_H = 42;
const SIDE_ACCENT = 5;
/** Body content must stay above this Y so footer never collides. */
const CONTENT_BOTTOM = FOOTER_H + 24;
const MAX_W = PAGE_W - MARGIN_X * 2 - 8;

const DEFAULT_BRAND = rgb(0.06, 0.46, 0.43);
const DEFAULT_ACCENT = rgb(0.85, 0.55, 0.18);
const INK = rgb(0.09, 0.11, 0.14);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.86, 0.88, 0.91);
const SOFT = rgb(0.95, 0.97, 0.97);
const SOFT_ALT = rgb(0.98, 0.985, 0.99);
const WHITE = rgb(1, 1, 1);

export type { PdfThemeOptions, PdfWatermarkOptions };

export type PdfDocOptions = {
  title: string;
  subtitle?: string;
  /** Small badge above title, e.g. "CONTRACT" */
  docType?: string;
  meta?: { label: string; value: string }[];
  sections: { heading?: string; body: string }[];
  footerLeft?: string;
  footerRight?: string;
  /** Text (legacy) or { text, imageDataUrl, opacity } */
  watermark?: string | PdfWatermarkOptions;
  theme?: PdfThemeOptions;
  signatures?: string[];
  filename: string;
};

export type InvoicePdfOptions = {
  invoiceNo: string;
  date?: string;
  dueDate?: string;
  from: { name?: string; email?: string; address?: string };
  to: { name?: string; email?: string; address?: string };
  items: { desc: string; qty: number; price: number }[];
  taxPercent?: number;
  notes?: string;
  currencySymbol?: string;
  filename?: string;
  footerLeft?: string;
  watermark?: string | PdfWatermarkOptions;
  theme?: PdfThemeOptions;
};

export type TablePdfOptions = {
  title: string;
  subtitle?: string;
  /** First row = headers when hasHeader */
  rows: string[][];
  hasHeader?: boolean;
  filename: string;
  footerLeft?: string;
  watermark?: string | PdfWatermarkOptions;
  theme?: PdfThemeOptions;
};

type ThemeColors = { brand: RGB; brandDark: RGB; accent: RGB };

function resolveTheme(theme?: PdfThemeOptions): ThemeColors {
  const brand = hexToRgb(theme?.primary, DEFAULT_BRAND);
  const accent = hexToRgb(theme?.accent, DEFAULT_ACCENT);
  // Darken primary ~40% for headings
  const brandDark = rgb(brand.red * 0.55, brand.green * 0.55, brand.blue * 0.55);
  return { brand, brandDark, accent };
}

async function dataUrlToPngBytes(dataUrl: string): Promise<ArrayBuffer> {
  // Convert webp/gif/etc to PNG via canvas for pdf-lib
  if (typeof document === "undefined") {
    const res = await fetch(dataUrl);
    return res.arrayBuffer();
  }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("watermark image load failed"));
    el.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(img, 0, 0);
  const pngUrl = canvas.toDataURL("image/png");
  const res = await fetch(pngUrl);
  return res.arrayBuffer();
}

async function embedWatermarkImage(doc: PDFDocument, dataUrl: string): Promise<PDFImage | undefined> {
  try {
    const lower = dataUrl.slice(0, 48).toLowerCase();
    if (lower.includes("image/png") || lower.startsWith("data:image/png")) {
      const res = await fetch(dataUrl);
      return doc.embedPng(await res.arrayBuffer());
    }
    if (lower.includes("image/jpeg") || lower.includes("image/jpg") || lower.startsWith("data:image/jpeg")) {
      const res = await fetch(dataUrl);
      return doc.embedJpg(await res.arrayBuffer());
    }
    const pngBytes = await dataUrlToPngBytes(dataUrl);
    return doc.embedPng(pngBytes);
  } catch {
    try {
      const pngBytes = await dataUrlToPngBytes(dataUrl);
      return doc.embedPng(pngBytes);
    } catch {
      return undefined;
    }
  }
}

type PreparedWatermark = {
  text?: string;
  image?: PDFImage;
  opacity: number;
};

async function prepareWatermark(
  doc: PDFDocument,
  wm?: string | PdfWatermarkOptions,
): Promise<PreparedWatermark | undefined> {
  const n = normalizeWatermark(wm);
  if (!n) return undefined;
  const image = n.imageDataUrl ? await embedWatermarkImage(doc, n.imageDataUrl) : undefined;
  if (!n.text && !image) return undefined;
  return { text: n.text, image, opacity: n.opacity ?? 0.16 };
}

type Fonts = { regular: PDFFont; bold: PDFFont };

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

function safeText(s: string) {
  // WinAnsi-safe: drop characters Helvetica can't encode
  return String(s ?? "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, (ch) => {
      const map: Record<string, string> = {
        "—": "-",
        "–": "-",
        "‘": "'",
        "’": "'",
        "“": '"',
        "”": '"',
        "…": "...",
        "•": "-",
        "€": "EUR",
        "£": "GBP",
        "₹": "INR",
        "¥": "JPY",
      };
      return map[ch] ?? "";
    });
}

function drawWatermarkLayer(page: PDFPage, font: PDFFont, wm: PreparedWatermark) {
  const opacity = wm.opacity;
  if (wm.image) {
    const maxW = 320;
    const scale = Math.min(maxW / wm.image.width, 220 / wm.image.height);
    const w = wm.image.width * scale;
    const h = wm.image.height * scale;
    page.drawImage(wm.image, {
      x: (PAGE_W - w) / 2,
      y: (PAGE_H - h) / 2,
      width: w,
      height: h,
      opacity,
      rotate: degrees(28),
    });
  }
  if (wm.text?.trim()) {
    const label = safeText(wm.text).slice(0, 40);
    page.drawText(label, {
      x: 90,
      y: 360,
      size: wm.image ? 28 : 48,
      font,
      color: rgb(0.72, 0.76, 0.8),
      opacity: wm.image ? Math.min(opacity + 0.04, 0.4) : opacity,
      rotate: degrees(34),
    });
  }
}

function drawPageFrame(page: PDFPage, theme: ThemeColors) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: SIDE_ACCENT,
    height: PAGE_H,
    color: theme.brand,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 10,
    width: PAGE_W,
    height: 10,
    color: theme.brand,
  });
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 14,
    width: PAGE_W,
    height: 4,
    color: theme.accent,
  });
}

function drawFooter(
  page: PDFPage,
  fonts: Fonts,
  opts: {
    footerLeft: string;
    footerRight: string;
    watermark?: PreparedWatermark;
  },
) {
  if (opts.watermark) {
    drawWatermarkLayer(page, fonts.bold, opts.watermark);
  }

  page.drawLine({
    start: { x: MARGIN_X, y: FOOTER_H },
    end: { x: PAGE_W - MARGIN_X + 8, y: FOOTER_H },
    thickness: 0.7,
    color: RULE,
  });

  page.drawText(safeText(opts.footerLeft || "Mytulify"), {
    x: MARGIN_X,
    y: 22,
    size: 7.5,
    font: fonts.regular,
    color: MUTED,
  });
  const right = safeText(opts.footerRight);
  const rw = fonts.regular.widthOfTextAtSize(right, 7.5);
  page.drawText(right, {
    x: PAGE_W - MARGIN_X + 8 - rw,
    y: 22,
    size: 7.5,
    font: fonts.regular,
    color: MUTED,
  });
}

function drawSignatures(page: PDFPage, fonts: Fonts, labels: string[], theme: ThemeColors) {
  const blockH = 28 + Math.ceil(labels.length / 2) * 52;
  let y = CONTENT_BOTTOM + blockH;

  page.drawText("AUTHORIZATION", {
    x: MARGIN_X,
    y,
    size: 8,
    font: fonts.bold,
    color: theme.brand,
  });
  page.drawRectangle({
    x: MARGIN_X + fonts.bold.widthOfTextAtSize("AUTHORIZATION", 8) + 8,
    y: y + 2,
    width: 28,
    height: 2,
    color: theme.accent,
  });
  y -= 22;

  const cols = labels.length === 1 ? 1 : 2;
  const colW = cols === 1 ? MAX_W : (MAX_W - 24) / 2;

  labels.forEach((label, idx) => {
    const col = cols === 1 ? 0 : idx % 2;
    const row = cols === 1 ? idx : Math.floor(idx / 2);
    const x = MARGIN_X + col * (colW + 24);
    const lineY = y - row * 52;

    page.drawRectangle({
      x,
      y: lineY - 18,
      width: colW,
      height: 40,
      color: SOFT_ALT,
      borderColor: RULE,
      borderWidth: 0.6,
    });
    page.drawLine({
      start: { x: x + 12, y: lineY + 4 },
      end: { x: x + colW - 12, y: lineY + 4 },
      thickness: 0.9,
      color: MUTED,
    });
    page.drawText(safeText(label), {
      x: x + 12,
      y: lineY - 10,
      size: 8,
      font: fonts.regular,
      color: MUTED,
    });
    const dateLabel = "Date ________";
    page.drawText(dateLabel, {
      x: x + colW - 12 - fonts.regular.widthOfTextAtSize(dateLabel, 7.5),
      y: lineY - 10,
      size: 7.5,
      font: fonts.regular,
      color: MUTED,
    });
  });
}

/**
 * Designer letterhead PDF — contracts, proposals, NDAs, intake docs.
 */
export async function exportBrandedPdf(options: PdfDocOptions): Promise<void> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { regular, bold };
  const theme = resolveTheme(options.theme);
  const watermark = await prepareWatermark(doc, options.watermark);

  type Op =
    | { kind: "hero" }
    | { kind: "subtitle"; text: string }
    | { kind: "metaGrid"; items: { label: string; value: string }[] }
    | { kind: "heading"; text: string; index: number }
    | { kind: "body"; text: string }
    | { kind: "spacer"; h: number }
    | { kind: "rule" };

  const ops: Op[] = [{ kind: "hero" }];
  if (options.subtitle?.trim()) ops.push({ kind: "subtitle", text: options.subtitle.trim() });

  const meta = (options.meta ?? []).filter((m) => m.value?.trim());
  if (meta.length) {
    ops.push({ kind: "spacer", h: 4 });
    ops.push({ kind: "metaGrid", items: meta });
  }
  ops.push({ kind: "rule" });
  ops.push({ kind: "spacer", h: 6 });

  let sectionIdx = 0;
  for (const section of options.sections) {
    if (section.heading?.trim()) {
      sectionIdx += 1;
      ops.push({ kind: "heading", text: section.heading.trim(), index: sectionIdx });
    }
    if (section.body != null) {
      ops.push({ kind: "body", text: section.body });
      ops.push({ kind: "spacer", h: 12 });
    }
  }

  const sigCount = options.signatures?.length ?? 0;
  const sigBlockH = sigCount ? 28 + Math.ceil(sigCount / 2) * 52 + 10 : 0;

  const pages: PDFPage[] = [];
  let page = doc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H - MARGIN_TOP - 18;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - MARGIN_TOP - 18;
  };

  const floor = () => CONTENT_BOTTOM + sigBlockH;

  for (const op of ops) {
    switch (op.kind) {
      case "hero": {
        if (y - 70 < floor()) newPage();
        const docType = safeText(options.docType || "DOCUMENT").toUpperCase();
        page.drawText(docType, {
          x: MARGIN_X,
          y,
          size: 8,
          font: bold,
          color: theme.brand,
        });
        y -= 18;
        const title = safeText(options.title);
        for (const line of wrap(title, 22, bold, MAX_W)) {
          if (y - 26 < floor()) newPage();
          page.drawText(line, { x: MARGIN_X, y, size: 22, font: bold, color: INK });
          y -= 26;
        }
        page.drawRectangle({
          x: MARGIN_X,
          y: y + 10,
          width: 64,
          height: 3.5,
          color: theme.brand,
        });
        page.drawRectangle({
          x: MARGIN_X + 70,
          y: y + 11,
          width: 18,
          height: 2,
          color: theme.accent,
        });
        y -= 14;
        break;
      }
      case "subtitle": {
        for (const line of wrap(safeText(op.text), 10, regular)) {
          if (y - 14 < floor()) newPage();
          page.drawText(line, { x: MARGIN_X, y, size: 10, font: regular, color: MUTED });
          y -= 13;
        }
        y -= 2;
        break;
      }
      case "metaGrid": {
        const items = op.items;
        const colW = (MAX_W - 12) / 2;
        const rowH = 34;
        for (let i = 0; i < items.length; i += 2) {
          if (y - rowH - 4 < floor()) newPage();
          const pair = [items[i], items[i + 1]].filter(Boolean) as { label: string; value: string }[];
          pair.forEach((m, col) => {
            const x = MARGIN_X + col * (colW + 12);
            page.drawRectangle({
              x,
              y: y - rowH + 8,
              width: colW,
              height: rowH,
              color: SOFT,
              borderColor: RULE,
              borderWidth: 0.5,
            });
            page.drawText(safeText(m.label).toUpperCase(), {
              x: x + 10,
              y: y - 4,
              size: 7,
              font: bold,
              color: theme.brand,
            });
            const val = safeText(m.value);
            const clipped =
              fonts.regular.widthOfTextAtSize(val, 9.5) > colW - 20
                ? val.slice(0, 42) + "…"
                : val;
            page.drawText(clipped, {
              x: x + 10,
              y: y - 18,
              size: 9.5,
              font: regular,
              color: INK,
            });
          });
          y -= rowH + 8;
        }
        break;
      }
      case "heading": {
        if (y - 28 < floor()) newPage();
        y -= 2;
        const label = `${String(op.index).padStart(2, "0")}  ${safeText(op.text).toUpperCase()}`;
        page.drawRectangle({
          x: MARGIN_X - 4,
          y: y - 6,
          width: MAX_W + 8,
          height: 22,
          color: SOFT,
        });
        page.drawRectangle({
          x: MARGIN_X - 4,
          y: y - 6,
          width: 3,
          height: 22,
          color: theme.brand,
        });
        page.drawText(label, {
          x: MARGIN_X + 8,
          y: y,
          size: 8.5,
          font: bold,
          color: theme.brandDark,
        });
        y -= 24;
        break;
      }
      case "body": {
        for (const line of wrap(safeText(op.text), 10.5, regular)) {
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
        if (y - 10 < floor()) newPage();
        page.drawLine({
          start: { x: MARGIN_X, y: y + 2 },
          end: { x: PAGE_W - MARGIN_X + 8, y: y + 2 },
          thickness: 0.8,
          color: RULE,
        });
        y -= 10;
        break;
      }
    }
  }

  if (sigCount > 0 && options.signatures) {
    drawSignatures(pages[pages.length - 1]!, fonts, options.signatures, theme);
  }

  const pageCount = pages.length;
  const footerLeft = options.footerLeft ?? "Mytulify · Designed document";
  pages.forEach((p, i) => {
    drawPageFrame(p, theme);
    drawFooter(p, fonts, {
      footerLeft,
      footerRight: options.footerRight ?? `Page ${i + 1} of ${pageCount}`,
      watermark,
    });
  });

  const bytes = await doc.save();
  download(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), options.filename);
}

/**
 * Designer invoice PDF with parties, item table, and totals panel.
 */
export async function exportInvoicePdf(options: InvoicePdfOptions): Promise<void> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { regular, bold };
  const theme = resolveTheme(options.theme);
  const watermark = await prepareWatermark(doc, options.watermark);
  const sym = options.currencySymbol ?? "$";
  const money = (n: number) => `${sym}${n.toFixed(2)}`;

  const items = options.items.filter((it) => it.desc.trim() || it.qty || it.price);
  const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxPct = options.taxPercent ?? 0;
  const taxAmt = sub * (taxPct / 100);
  const total = sub + taxAmt;

  const page = doc.addPage([PAGE_W, PAGE_H]);
  drawPageFrame(page, theme);

  let y = PAGE_H - 48;

  // Hero
  page.drawText("INVOICE", {
    x: MARGIN_X,
    y,
    size: 28,
    font: bold,
    color: INK,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 10,
    width: 52,
    height: 3.5,
    color: theme.brand,
  });

  // Invoice meta card (right)
  const cardW = 168;
  const cardX = PAGE_W - MARGIN_X + 8 - cardW;
  page.drawRectangle({
    x: cardX,
    y: y - 52,
    width: cardW,
    height: 68,
    color: SOFT,
    borderColor: RULE,
    borderWidth: 0.6,
  });
  page.drawText("INVOICE NO.", {
    x: cardX + 12,
    y: y - 4,
    size: 7,
    font: bold,
    color: theme.brand,
  });
  page.drawText(safeText(options.invoiceNo || "INV-001"), {
    x: cardX + 12,
    y: y - 18,
    size: 12,
    font: bold,
    color: INK,
  });
  page.drawText(`Date  ${safeText(options.date || new Date().toLocaleDateString())}`, {
    x: cardX + 12,
    y: y - 34,
    size: 8.5,
    font: regular,
    color: MUTED,
  });
  if (options.dueDate) {
    page.drawText(`Due   ${safeText(options.dueDate)}`, {
      x: cardX + 12,
      y: y - 46,
      size: 8.5,
      font: regular,
      color: MUTED,
    });
  }

  y -= 78;

  // From / Bill to
  const half = (MAX_W - 16) / 2;
  const drawParty = (title: string, party: InvoicePdfOptions["from"], x: number) => {
    page.drawText(title, {
      x,
      y,
      size: 7.5,
      font: bold,
      color: theme.brand,
    });
    let py = y - 14;
    const lines = [party.name, party.email, party.address]
      .filter(Boolean)
      .flatMap((t) => wrap(safeText(String(t)), 9.5, regular, half - 8));
    if (!lines.length) lines.push("—");
    lines.slice(0, 6).forEach((line, i) => {
      page.drawText(line, {
        x,
        y: py - i * 12,
        size: i === 0 ? 11 : 9,
        font: i === 0 ? bold : regular,
        color: INK,
      });
    });
  };
  drawParty("FROM", options.from, MARGIN_X);
  drawParty("BILL TO", options.to, MARGIN_X + half + 16);
  y -= 92;

  // Table header
  const cols = [
    { key: "desc", label: "DESCRIPTION", x: MARGIN_X, w: 250 },
    { key: "qty", label: "QTY", x: MARGIN_X + 260, w: 40 },
    { key: "price", label: "RATE", x: MARGIN_X + 310, w: 70 },
    { key: "total", label: "AMOUNT", x: MARGIN_X + 390, w: 90 },
  ] as const;

  page.drawRectangle({
    x: MARGIN_X - 4,
    y: y - 6,
    width: MAX_W + 8,
    height: 22,
    color: theme.brand,
  });
  cols.forEach((c) => {
    const label = c.label;
    const tw = bold.widthOfTextAtSize(label, 8);
    const x = c.key === "desc" ? c.x : c.x + c.w - tw;
    page.drawText(label, { x, y: y, size: 8, font: bold, color: WHITE });
  });
  y -= 28;

  items.forEach((it, idx) => {
    if (y < CONTENT_BOTTOM + 120) {
      // keep simple single-page for typical invoices; overflow continues with thinner rows
      y = Math.max(y, CONTENT_BOTTOM + 100);
    }
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: MARGIN_X - 4,
        y: y - 8,
        width: MAX_W + 8,
        height: 22,
        color: SOFT_ALT,
      });
    }
    const lineTotal = it.qty * it.price;
    const desc = safeText(it.desc || "Item");
    const descClip =
      regular.widthOfTextAtSize(desc, 9.5) > 248 ? desc.slice(0, 38) + "…" : desc;
    page.drawText(descClip, { x: cols[0].x, y, size: 9.5, font: regular, color: INK });
    const qty = String(it.qty);
    page.drawText(qty, {
      x: cols[1].x + cols[1].w - regular.widthOfTextAtSize(qty, 9.5),
      y,
      size: 9.5,
      font: regular,
      color: INK,
    });
    const rate = money(it.price);
    page.drawText(rate, {
      x: cols[2].x + cols[2].w - regular.widthOfTextAtSize(rate, 9.5),
      y,
      size: 9.5,
      font: regular,
      color: INK,
    });
    const amt = money(lineTotal);
    page.drawText(amt, {
      x: cols[3].x + cols[3].w - regular.widthOfTextAtSize(amt, 9.5),
      y,
      size: 9.5,
      font: bold,
      color: INK,
    });
    y -= 22;
  });

  page.drawLine({
    start: { x: MARGIN_X, y: y + 8 },
    end: { x: PAGE_W - MARGIN_X + 8, y: y + 8 },
    thickness: 0.7,
    color: RULE,
  });
  y -= 8;

  // Totals panel
  const panelW = 200;
  const panelX = PAGE_W - MARGIN_X + 8 - panelW;
  const rows: { label: string; value: string; bold?: boolean; accent?: boolean }[] = [
    { label: "Subtotal", value: money(sub) },
  ];
  if (taxPct) rows.push({ label: `Tax (${taxPct}%)`, value: money(taxAmt) });
  rows.push({ label: "Total due", value: money(total), bold: true, accent: true });

  const panelH = 16 + rows.length * 20;
  page.drawRectangle({
    x: panelX,
    y: y - panelH + 12,
    width: panelW,
    height: panelH,
    color: SOFT,
    borderColor: RULE,
    borderWidth: 0.6,
  });

  rows.forEach((r, i) => {
    const ry = y - i * 20;
    page.drawText(r.label, {
      x: panelX + 12,
      y: ry,
      size: r.bold ? 11 : 9,
      font: r.bold ? bold : regular,
      color: r.accent ? theme.brandDark : MUTED,
    });
    page.drawText(r.value, {
      x: panelX + panelW - 12 - (r.bold ? bold : regular).widthOfTextAtSize(r.value, r.bold ? 12 : 9.5),
      y: ry,
      size: r.bold ? 12 : 9.5,
      font: r.bold ? bold : regular,
      color: r.accent ? theme.brand : INK,
    });
  });

  if (options.notes?.trim()) {
    y -= panelH + 20;
    page.drawText("NOTES", {
      x: MARGIN_X,
      y,
      size: 7.5,
      font: bold,
      color: theme.brand,
    });
    y -= 12;
    for (const line of wrap(safeText(options.notes), 9, regular, MAX_W * 0.55)) {
      page.drawText(line, { x: MARGIN_X, y, size: 9, font: regular, color: MUTED });
      y -= 12;
    }
  }

  // Signature line
  const sigY = CONTENT_BOTTOM + 36;
  page.drawLine({
    start: { x: MARGIN_X, y: sigY },
    end: { x: MARGIN_X + 180, y: sigY },
    thickness: 0.9,
    color: MUTED,
  });
  page.drawText("Authorized signature", {
    x: MARGIN_X,
    y: sigY - 12,
    size: 8,
    font: regular,
    color: MUTED,
  });

  drawFooter(page, fonts, {
    footerLeft: options.footerLeft ?? "Mytulify · Invoice",
    footerRight: "Thank you for your business",
    watermark,
  });

  const bytes = await doc.save();
  const filename =
    options.filename ?? `invoice-${(options.invoiceNo || "INV-001").replace(/[^\w.-]+/g, "-")}.pdf`;
  download(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), filename);
}

/**
 * Designer table PDF for CSV / spreadsheet exports.
 */
export async function exportTablePdf(options: TablePdfOptions): Promise<void> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { regular, bold };
  const theme = resolveTheme(options.theme);
  const watermark = await prepareWatermark(doc, options.watermark);

  const raw = options.rows.map((r) => r.map((c) => safeText(c)));
  if (!raw.length) raw.push(["(empty)"]);

  const colCount = Math.min(Math.max(...raw.map((r) => r.length)), 8);
  const rows = raw.map((r) => {
    const padded = [...r];
    while (padded.length < colCount) padded.push("");
    return padded.slice(0, colCount).map((c) => (c.length > 48 ? c.slice(0, 47) + "…" : c));
  });

  const colW = MAX_W / colCount;
  const rowH = 18;
  const header = options.hasHeader !== false && rows.length > 1;

  const pages: PDFPage[] = [];
  let page = doc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H - 52;

  const paintChrome = (p: PDFPage, pageNum: number, pageCount: number) => {
    drawPageFrame(p, theme);
    drawFooter(p, fonts, {
      footerLeft: options.footerLeft ?? "Mytulify · Table export",
      footerRight: `Page ${pageNum} of ${pageCount}`,
      watermark,
    });
  };

  // Title block (first page)
  page.drawText("DATA EXPORT", {
    x: MARGIN_X,
    y,
    size: 8,
    font: bold,
    color: theme.brand,
  });
  y -= 18;
  page.drawText(safeText(options.title), {
    x: MARGIN_X,
    y,
    size: 18,
    font: bold,
    color: INK,
  });
  y -= 12;
  page.drawRectangle({ x: MARGIN_X, y: y + 4, width: 48, height: 3, color: theme.brand });
  y -= 16;
  if (options.subtitle) {
    page.drawText(safeText(options.subtitle), {
      x: MARGIN_X,
      y,
      size: 9,
      font: regular,
      color: MUTED,
    });
    y -= 16;
  }
  y -= 4;

  const drawHeaderRow = () => {
    page.drawRectangle({
      x: MARGIN_X - 2,
      y: y - 5,
      width: MAX_W + 4,
      height: rowH,
      color: theme.brand,
    });
    const headers = rows[0]!;
    for (let c = 0; c < colCount; c++) {
      page.drawText(headers[c] || `Col ${c + 1}`, {
        x: MARGIN_X + c * colW + 4,
        y: y,
        size: 7.5,
        font: bold,
        color: WHITE,
      });
    }
    y -= rowH + 2;
  };

  let startRow = 0;
  if (header) {
    drawHeaderRow();
    startRow = 1;
  }

  for (let r = startRow; r < rows.length; r++) {
    if (y < CONTENT_BOTTOM + rowH) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      pages.push(page);
      y = PAGE_H - 52;
      if (header) drawHeaderRow();
    }
    if ((r - startRow) % 2 === 1) {
      page.drawRectangle({
        x: MARGIN_X - 2,
        y: y - 5,
        width: MAX_W + 4,
        height: rowH,
        color: SOFT_ALT,
      });
    }
    const row = rows[r]!;
    for (let c = 0; c < colCount; c++) {
      page.drawText(row[c] || "", {
        x: MARGIN_X + c * colW + 4,
        y,
        size: 8,
        font: regular,
        color: INK,
      });
    }
    y -= rowH;
  }

  const pageCount = pages.length;
  pages.forEach((p, i) => paintChrome(p, i + 1, pageCount));

  const bytes = await doc.save();
  download(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), options.filename);
}

/** @deprecated use exportBrandedPdf */
export async function createPdfWriter(): Promise<never> {
  throw new Error("createPdfWriter was removed — use exportBrandedPdf / exportInvoicePdf / exportTablePdf.");
}
