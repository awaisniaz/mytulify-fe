import { PDFDocument } from "pdf-lib";
import { toPng } from "html-to-image";
import { download } from "@/lib/utils";

const A4_W = 595.28;
const A4_H = 841.89;
/** Capture width ≈ CSS px for A4 @ 96dpi */
const CAPTURE_W = 794;

const STYLE_PROPS = [
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "color",
  "background-color",
  "background-image",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-decoration",
  "direction",
  "display",
  "flex-direction",
  "flex-wrap",
  "align-items",
  "justify-content",
  "gap",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-column",
  "grid-row",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "width",
  "max-width",
  "min-width",
  "min-height",
  "max-height",
  "height",
  "opacity",
  "box-sizing",
  "white-space",
  "overflow",
  "overflow-x",
  "overflow-y",
  "object-fit",
  "vertical-align",
  "transform",
  "visibility",
] as const;

function syncFormControls(source: HTMLElement, clone: HTMLElement) {
  const srcControls = source.querySelectorAll("input, textarea, select");
  const dstControls = clone.querySelectorAll("input, textarea, select");
  srcControls.forEach((src, i) => {
    const dst = dstControls[i];
    if (!(dst instanceof HTMLElement)) return;
    if (src instanceof HTMLInputElement && dst instanceof HTMLInputElement) {
      if (src.type === "checkbox" || src.type === "radio") {
        dst.checked = src.checked;
        if (src.checked) dst.setAttribute("checked", "checked");
        else dst.removeAttribute("checked");
      } else {
        dst.value = src.value;
        dst.setAttribute("value", src.value);
      }
    } else if (src instanceof HTMLTextAreaElement && dst instanceof HTMLTextAreaElement) {
      dst.value = src.value;
      dst.textContent = src.value;
    } else if (src instanceof HTMLSelectElement && dst instanceof HTMLSelectElement) {
      dst.value = src.value;
      Array.from(dst.options).forEach((opt) => {
        if (opt.value === src.value) opt.setAttribute("selected", "selected");
        else opt.removeAttribute("selected");
      });
    }
  });
}

/**
 * Clone the form with computed RGB styles inlined so html-to-image
 * never walks Tailwind v4 oklch stylesheets (common PDF failure).
 *
 * Host is placed ON-SCREEN (not left:-9999) — Chrome skips painting
 * off-screen fixed nodes, which produced blank PDFs.
 */
function buildPrintClone(source: HTMLElement): { host: HTMLElement; target: HTMLElement; overlay: HTMLElement } {
  const overlay = document.createElement("div");
  overlay.setAttribute("data-pdf-export-overlay", "1");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "background:#ffffff",
    "z-index:2147483646",
    "pointer-events:none",
  ].join(";");

  const host = document.createElement("div");
  host.setAttribute("data-pdf-export-host", "1");
  host.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${CAPTURE_W}px`,
    "background:#ffffff",
    "z-index:2147483645",
    "pointer-events:none",
    "opacity:1",
    "overflow:visible",
  ].join(";");

  const target = source.cloneNode(true) as HTMLElement;
  target.style.width = `${CAPTURE_W}px`;
  target.style.maxWidth = `${CAPTURE_W}px`;
  target.style.boxShadow = "none";
  target.style.margin = "0";
  target.style.position = "relative";
  target.style.left = "0";
  target.style.top = "0";
  target.style.transform = "none";
  target.style.opacity = "1";
  target.style.visibility = "visible";
  host.appendChild(target);
  document.body.appendChild(host);
  document.body.appendChild(overlay);

  syncFormControls(source, target);

  const srcNodes = [source, ...Array.from(source.querySelectorAll("*"))];
  const dstNodes = [target, ...Array.from(target.querySelectorAll("*"))];

  for (let i = 0; i < srcNodes.length; i++) {
    const s = srcNodes[i];
    const d = dstNodes[i];
    if (!(s instanceof HTMLElement) || !(d instanceof HTMLElement)) continue;
    const cs = getComputedStyle(s);
    if (cs.display === "none") {
      d.style.cssText = "display:none";
      continue;
    }

    const parts: string[] = [];
    for (const prop of STYLE_PROPS) {
      const val = cs.getPropertyValue(prop);
      if (!val || val === "auto") continue;
      if (prop === "height" && (val === "0px" || val === "auto")) continue;
      if (/oklch|oklab|color-mix|lab\(|lch\(/i.test(val)) continue;
      parts.push(`${prop}:${val}`);
    }
    // Keep absolute/fixed decorations correctly (accent rail, etc.)
    d.style.cssText = parts.join(";");
    d.removeAttribute("class");
  }

  // Ensure root stays a positioned containing block for absolute children
  if (getComputedStyle(target).position === "static") {
    target.style.position = "relative";
  }
  target.style.opacity = "1";
  target.style.visibility = "visible";
  target.querySelectorAll("style, link").forEach((n) => n.remove());

  return { host, target, overlay };
}

async function capturePng(el: HTMLElement): Promise<string> {
  // Force layout before rasterize
  void el.offsetHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

  return toPng(el, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
    width: Math.max(CAPTURE_W, el.scrollWidth || CAPTURE_W),
    height: Math.max(el.scrollHeight, el.offsetHeight, 200),
    style: {
      transform: "none",
      width: `${CAPTURE_W}px`,
      maxWidth: `${CAPTURE_W}px`,
      left: "0",
      top: "0",
      position: "relative",
      opacity: "1",
      visibility: "visible",
    },
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      const tag = node.tagName;
      if (tag === "STYLE" || tag === "LINK" || tag === "SCRIPT") return false;
      if (node.getAttribute("data-pdf-export-overlay") === "1") return false;
      return true;
    },
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not render form image for PDF."));
    img.src = dataUrl;
  });
}

function assertCaptureHasContent(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const sampleW = Math.min(img.width, 200);
  const sampleH = Math.min(img.height, 200);
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
  let nonWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i]! < 250 || data[i + 1]! < 250 || data[i + 2]! < 250) nonWhite++;
  }
  const ratio = nonWhite / (sampleW * sampleH);
  // Only left accent rail ≈ very low ratio; real forms are much denser
  if (ratio < 0.01) {
    throw new Error(
      "PDF capture blank nikli. Page refresh karke dobara Download try karein. Agar phir bhi blank ho to branding colors simplify karein.",
    );
  }
}

/** Render a DOM node to a multi-page A4 PDF (supports Urdu/RTL via browser fonts). */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  if (!el || el.offsetHeight < 8) {
    // Off-screen sources can report 0 height — still try after clone; warn early if empty DOM
    if (!el?.childNodes?.length) {
      throw new Error("Form preview empty hai. Pehle form load/generate karein.");
    }
  }

  const { host, target, overlay } = buildPrintClone(el);
  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

    let dataUrl: string;
    try {
      dataUrl = await capturePng(target);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/oklch|unsupported|color function|css/i.test(msg)) {
        throw new Error(
          "PDF export failed due to browser CSS. Refresh the page and try again, or simplify branding colors.",
        );
      }
      throw new Error(msg || "PDF export failed. Try again.");
    }

    const imgEl = await loadImage(dataUrl);
    if (imgEl.width < 10 || imgEl.height < 10) {
      throw new Error("PDF image too small — form preview render nahi hui. Refresh karke try karein.");
    }
    assertCaptureHasContent(imgEl);

    const doc = await PDFDocument.create();
    const pageContentH = (A4_H / A4_W) * imgEl.width;
    let offsetY = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available for PDF export.");

    canvas.width = imgEl.width;

    while (offsetY < imgEl.height - 1) {
      const sliceH = Math.min(pageContentH, imgEl.height - offsetY);
      canvas.height = Math.ceil(sliceH);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgEl, 0, offsetY, imgEl.width, sliceH, 0, 0, imgEl.width, sliceH);

      const sliceUrl = canvas.toDataURL("image/png");
      const sliceBytes = await fetch(sliceUrl).then((r) => r.arrayBuffer());
      const embedded = await doc.embedPng(sliceBytes);
      const page = doc.addPage([A4_W, A4_H]);
      const drawH = (sliceH / imgEl.width) * A4_W;
      page.drawImage(embedded, {
        x: 0,
        y: A4_H - drawH,
        width: A4_W,
        height: drawH,
      });
      offsetY += sliceH;
    }

    const bytes = await doc.save();
    download(new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
  } finally {
    host.remove();
    overlay.remove();
  }
}
