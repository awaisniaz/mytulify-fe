"use client";

/**
 * Client-only sensitive-region detectors for Screenshot Auto-Anonymizer.
 * Models load in the browser; the user's image never leaves the device.
 */

export type DetectedBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  score: number;
};

const FACE_MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";
const SENSITIVE_COCO = new Set([
  "person",
  "cell phone",
  "laptop",
  "book",
  "keyboard",
  "remote",
  "mouse",
  "tv",
  "handbag",
  "suitcase",
]);

let faceReady: Promise<typeof import("@vladmandic/face-api")> | null = null;
let cocoReady: Promise<{
  detect: (img: HTMLCanvasElement | HTMLImageElement) => Promise<DetectedBox[]>;
}> | null = null;

async function loadFaceApi() {
  if (!faceReady) {
    faceReady = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL)]);
      return faceapi;
    })();
  }
  return faceReady;
}

async function loadCoco() {
  if (!cocoReady) {
    cocoReady = (async () => {
      await import("@tensorflow/tfjs");
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      return {
        detect: async (img: HTMLCanvasElement | HTMLImageElement) => {
          const preds = await model.detect(img, 20, 0.45);
          return preds
            .filter((p) => SENSITIVE_COCO.has(p.class))
            .map((p) => ({
              x: p.bbox[0],
              y: p.bbox[1],
              w: p.bbox[2],
              h: p.bbox[3],
              label: p.class === "person" ? "person" : p.class,
              score: p.score,
            }));
        },
      };
    })();
  }
  return cocoReady;
}

function expandBox(b: DetectedBox, pad: number, maxW: number, maxH: number): DetectedBox {
  const x = Math.max(0, b.x - pad);
  const y = Math.max(0, b.y - pad);
  const r = Math.min(maxW, b.x + b.w + pad);
  const bot = Math.min(maxH, b.y + b.h + pad);
  return { ...b, x, y, w: Math.max(1, r - x), h: Math.max(1, bot - y) };
}

function looksLikeCardNumber(text: string): boolean {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 13 && digits.length <= 19;
}

async function detectFaces(canvas: HTMLCanvasElement): Promise<DetectedBox[]> {
  try {
    const faceapi = await loadFaceApi();
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
    const results = await faceapi.detectAllFaces(canvas, opts);
    return results.map((d) => {
      const box = d.box;
      return expandBox(
        { x: box.x, y: box.y, w: box.width, h: box.height, label: "face", score: d.score },
        Math.max(8, box.width * 0.12),
        canvas.width,
        canvas.height,
      );
    });
  } catch {
    return [];
  }
}

async function detectObjects(canvas: HTMLCanvasElement): Promise<DetectedBox[]> {
  try {
    const coco = await loadCoco();
    return await coco.detect(canvas);
  } catch {
    return [];
  }
}

async function detectTextAndCards(canvas: HTMLCanvasElement): Promise<DetectedBox[]> {
  try {
    const Tesseract = await import("tesseract.js");
    const result = await Tesseract.recognize(canvas, "eng", {
      logger: () => undefined,
    });
    const boxes: DetectedBox[] = [];
    const data = result.data as {
      words?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
      lines?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
      blocks?: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
    };

    // Prefer text lines/blocks so the UI isn't flooded with per-word boxes
    const lines = data.lines?.length ? data.lines : data.blocks ?? [];
    for (const line of lines) {
      if (!line.text?.trim() || line.confidence < 50) continue;
      const bw = line.bbox.x1 - line.bbox.x0;
      const bh = line.bbox.y1 - line.bbox.y0;
      if (bw < 12 || bh < 8) continue;
      const card = looksLikeCardNumber(line.text);
      boxes.push({
        x: line.bbox.x0,
        y: line.bbox.y0,
        w: bw,
        h: bh,
        label: card ? "credit-card" : "text",
        score: line.confidence / 100,
      });
    }

    const words = data.words ?? [];
    const digitWords = words.filter(
      (w) => looksLikeCardNumber(w.text) || /^\d[\d\s-]{8,}\d$/.test(w.text.trim()),
    );
    if (digitWords.length >= 1) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = 0;
      let maxY = 0;
      for (const w of digitWords) {
        minX = Math.min(minX, w.bbox.x0);
        minY = Math.min(minY, w.bbox.y0);
        maxX = Math.max(maxX, w.bbox.x1);
        maxY = Math.max(maxY, w.bbox.y1);
      }
      boxes.push(
        expandBox(
          { x: minX, y: minY, w: maxX - minX, h: maxY - minY, label: "credit-card", score: 0.92 },
          14,
          canvas.width,
          canvas.height,
        ),
      );
    }

    return boxes;
  } catch {
    return [];
  }
}

function iou(a: DetectedBox, b: DetectedBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

function dedupe(boxes: DetectedBox[], threshold = 0.45): DetectedBox[] {
  const sorted = [...boxes].sort((a, b) => b.score - a.score);
  const kept: DetectedBox[] = [];
  for (const b of sorted) {
    if (kept.some((k) => k.label === b.label && iou(k, b) > threshold)) continue;
    kept.push(b);
  }
  return kept;
}

export async function detectSensitiveRegions(
  canvas: HTMLCanvasElement,
  onProgress?: (msg: string) => void,
): Promise<DetectedBox[]> {
  onProgress?.("Loading face detector…");
  const facesP = detectFaces(canvas);
  onProgress?.("Loading object detector…");
  const objectsP = detectObjects(canvas);
  onProgress?.("Scanning text & card numbers…");
  const textP = detectTextAndCards(canvas);

  const [faces, objects, text] = await Promise.all([facesP, objectsP, textP]);
  onProgress?.("Merging detections…");

  // Prefer face boxes over overlapping person boxes
  const personFiltered = objects.filter((o) => {
    if (o.label !== "person") return true;
    return !faces.some((f) => iou(f, o) > 0.2);
  });

  return dedupe([...faces, ...personFiltered, ...text]);
}
