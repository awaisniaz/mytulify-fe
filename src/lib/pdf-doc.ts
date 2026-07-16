import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { download } from "@/lib/utils";

const MARGIN = 50;
const PAGE_W = 595;
const PAGE_H = 842;
const MAX_W = PAGE_W - MARGIN * 2;

export type PdfWriter = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  draw: (text: string, opts?: { size?: number; bold?: boolean; gap?: number }) => void;
  gap: (n?: number) => void;
  save: (filename: string) => Promise<void>;
};

export async function createPdfWriter(): Promise<PdfWriter> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let y = PAGE_H - MARGIN;

  const ensure = (need: number) => {
    if (y - need < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const wrap = (text: string, size: number, f: PDFFont): string[] => {
    const words = text.replace(/\r/g, "").split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > MAX_W && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const draw = (text: string, opts?: { size?: number; bold?: boolean; gap?: number }) => {
    const size = opts?.size ?? 11;
    const f = opts?.bold ? bold : font;
    const paragraphs = String(text ?? "").split("\n");
    for (const para of paragraphs) {
      for (const line of wrap(para, size, f)) {
        ensure(size + 8);
        page.drawText(line, { x: MARGIN, y, size, font: f, color: rgb(0.12, 0.12, 0.14) });
        y -= size + (opts?.gap ?? 5);
      }
    }
  };

  return {
    doc,
    get page() {
      return page;
    },
    font,
    bold,
    get y() {
      return y;
    },
    draw,
    gap(n = 10) {
      y -= n;
    },
    async save(filename: string) {
      const bytes = await doc.save();
      download(new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), filename);
    },
  };
}
