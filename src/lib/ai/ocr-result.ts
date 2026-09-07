import { parseJsonLoose } from "./parse-json";

export type OcrResult = {
  text: string;
  original: string;
  translation: string;
  translationLanguage: string;
};

function wantsTranslation(translateTo: string | undefined): string {
  const t = translateTo?.trim() ?? "";
  return !t || t === "none" ? "" : t;
}

function splitMarkers(raw: string): { original: string; translation: string } | null {
  const origMarker = "<<<ORIGINAL>>>";
  const transMarker = "<<<TRANSLATION>>>";
  const endMarker = "<<<END>>>";
  const origIdx = raw.indexOf(origMarker);
  const transIdx = raw.indexOf(transMarker);
  if (origIdx === -1 || transIdx === -1 || transIdx <= origIdx) return null;
  const original = raw.slice(origIdx + origMarker.length, transIdx).trim();
  const after = raw.slice(transIdx + transMarker.length);
  const endIdx = after.indexOf(endMarker);
  const translation = (endIdx === -1 ? after : after.slice(0, endIdx)).trim();
  if (!original && !translation) return null;
  return { original, translation };
}

function splitHeadings(raw: string): { original: string; translation: string } | null {
  const orig = raw.match(/##\s*Original\b([\s\S]*?)(?=##\s*Translation\b|$)/i);
  const trans = raw.match(/##\s*Translation\b[^\n]*\n([\s\S]*)$/i);
  if (!orig && !trans) return null;
  const original = (orig?.[1] ?? "").trim();
  const translation = (trans?.[1] ?? "").trim();
  if (!original && !translation) return null;
  return { original, translation };
}

function combine(original: string, translation: string, lang: string): string {
  if (!translation) return original;
  return `Original\n\n${original}\n\nTranslation (${lang})\n\n${translation}`;
}

/** Parse vision-model OCR output into original + optional translation. */
export function parseOcrResponse(raw: string, translateTo?: string): OcrResult {
  const text = raw.trim();
  const lang = wantsTranslation(translateTo);
  if (!lang) {
    return { text, original: text, translation: "", translationLanguage: "" };
  }

  const marked = splitMarkers(text);
  if (marked) {
    return {
      text: combine(marked.original, marked.translation, lang),
      original: marked.original,
      translation: marked.translation,
      translationLanguage: lang,
    };
  }

  try {
    const obj = parseJsonLoose<{ original?: string; translation?: string }>(text);
    const original = (obj.original ?? "").trim();
    const translation = (obj.translation ?? "").trim();
    if (original || translation) {
      return {
        text: combine(original, translation, lang),
        original,
        translation,
        translationLanguage: lang,
      };
    }
  } catch {
    /* not JSON */
  }

  const headed = splitHeadings(text);
  if (headed) {
    return {
      text: combine(headed.original, headed.translation, lang),
      original: headed.original,
      translation: headed.translation,
      translationLanguage: lang,
    };
  }

  return { text, original: text, translation: "", translationLanguage: lang };
}
