import { PDFDocument } from "pdf-lib";
import { toPng } from "html-to-image";
import { download } from "@/lib/utils";

/** Render a DOM node to a downloadable PDF (supports Urdu/RTL via browser fonts). */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });
  const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(imgBytes);
  const maxW = 595.28;
  const scale = maxW / img.width;
  const w = maxW;
  const h = img.height * scale;
  const page = doc.addPage([w, h]);
  page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  const bytes = await doc.save();
  download(new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
}
