/** How default How-to / About / FAQ copy should speak for a tool. */
export type ToolGuideKind = "browser" | "ai" | "ocr";

export function toolGuideKind(input: {
  clientSide: boolean;
  categorySlug?: string | null;
  slug?: string | null;
}): ToolGuideKind {
  if (input.clientSide) return "browser";
  const cat = input.categorySlug ?? "";
  const slug = input.slug ?? "";
  if (
    cat === "handwriting-ocr" ||
    /handwriting|handwritten|\bocr\b/i.test(slug) ||
    /handwriting|handwritten|\bocr\b/i.test(cat)
  ) {
    return "ocr";
  }
  return "ai";
}

/**
 * Compact per-script notes for language OCR pages.
 * Shared OCR tips live elsewhere — these lines stay distinctive per language.
 */
const OCR_SCRIPT_NOTES: Record<string, { language: string; script: string; tip: string }> = {
  arabic: {
    language: "Arabic",
    script: "Arabic (right-to-left)",
    tip: "Photograph the page upright; skewed RTL lines are a common source of letter swaps.",
  },
  bengali: {
    language: "Bengali",
    script: "Bengali (Bangla) abugida",
    tip: "Keep conjugate characters fully in frame — cropped matras often drop vowels.",
  },
  chinese: {
    language: "Chinese",
    script: "Han characters",
    tip: "Avoid heavy JPEG compression on dense characters; soft edges confuse similar radicals.",
  },
  dutch: {
    language: "Dutch",
    script: "Latin with Dutch accents",
    tip: "Accented letters (é, ë, ï) need sharp focus — blur turns them into plain vowels.",
  },
  english: {
    language: "English",
    script: "Latin alphabet",
    tip: "Cursive joins are the usual failure mode; a flatter writing angle helps the model.",
  },
  french: {
    language: "French",
    script: "Latin with French diacritics",
    tip: "Keep accents (é, è, ç) sharp; washout lighting erases them first.",
  },
  german: {
    language: "German",
    script: "Latin with umlauts and ß",
    tip: "Umlauts and ß need clear dots/strokes — phone glare often flattens them.",
  },
  greek: {
    language: "Greek",
    script: "Greek alphabet",
    tip: "Similar letterforms (ν/υ, ο/σ) need even lighting across the whole line.",
  },
  gujarati: {
    language: "Gujarati",
    script: "Gujarati abugida",
    tip: "Include the full headline (shirorekha) of each word; clipped tops lose identity.",
  },
  hindi: {
    language: "Hindi",
    script: "Devanagari",
    tip: "Keep the shirorekha continuous in the crop; broken headlines confuse conjuncts.",
  },
  indonesian: {
    language: "Indonesian",
    script: "Latin alphabet",
    tip: "Printed worksheets OCR cleanly; rushed cursive benefits from higher resolution.",
  },
  italian: {
    language: "Italian",
    script: "Latin with Italian accents",
    tip: "Accented finals (à, è, ò) need contrast — pale ink loses them first.",
  },
  japanese: {
    language: "Japanese",
    script: "Kanji, hiragana, and katakana",
    tip: "Mixed scripts on one line need higher resolution than Latin-only pages.",
  },
  kannada: {
    language: "Kannada",
    script: "Kannada abugida",
    tip: "Rounded letterforms need soft, even light — harsh shadows split curves.",
  },
  korean: {
    language: "Korean",
    script: "Hangul",
    tip: "Keep syllable blocks intact in the crop; cutting a jamo changes the reading.",
  },
  malayalam: {
    language: "Malayalam",
    script: "Malayalam abugida",
    tip: "Tall, complex glyphs need more pixels per character than Latin text.",
  },
  marathi: {
    language: "Marathi",
    script: "Devanagari",
    tip: "Same Devanagari tips as Hindi — protect the headline and conjunct clusters.",
  },
  persian: {
    language: "Persian",
    script: "Arabic-based (right-to-left)",
    tip: "Photograph flat and upright; slanted RTL lines scramble connected forms.",
  },
  polish: {
    language: "Polish",
    script: "Latin with Polish diacritics",
    tip: "Diacritics (ą, ę, ł, ń, ś, ź, ż) need sharp focus to stay distinct.",
  },
  portuguese: {
    language: "Portuguese",
    script: "Latin with Portuguese accents",
    tip: "Tildes and cedillas (ã, õ, ç) wash out under glare — diffuse light helps.",
  },
  punjabi: {
    language: "Punjabi",
    script: "Gurmukhi",
    tip: "Keep vowel signs fully visible; cropped matras are a frequent miss.",
  },
  russian: {
    language: "Russian",
    script: "Cyrillic",
    tip: "Look-alike Cyrillic/Latin pairs need a clean crop without mixed fonts in one shot.",
  },
  spanish: {
    language: "Spanish",
    script: "Latin with Spanish accents and ñ",
    tip: "Preserve ñ and accented vowels — soft focus turns them into n or plain vowels.",
  },
  swedish: {
    language: "Swedish",
    script: "Latin with å, ä, ö",
    tip: "Ring and umlaut marks need contrast; low light is the usual failure.",
  },
  tamil: {
    language: "Tamil",
    script: "Tamil abugida",
    tip: "Curved letters need even illumination; side light splits loops into wrong glyphs.",
  },
  telugu: {
    language: "Telugu",
    script: "Telugu abugida",
    tip: "Complex conjuncts need higher resolution; phone distance shots lose secondary strokes.",
  },
  thai: {
    language: "Thai",
    script: "Thai script",
    tip: "Tone marks above/below must stay in frame — tight crops drop them first.",
  },
  turkish: {
    language: "Turkish",
    script: "Latin with Turkish letters (ğ, ı, ş, ç, ö, ü)",
    tip: "Dotless ı and soft g (ğ) need sharp focus to stay distinct from i and g.",
  },
  ukrainian: {
    language: "Ukrainian",
    script: "Cyrillic (Ukrainian set)",
    tip: "Ukrainian-specific letters (і, ї, є, ґ) need a clear, high-contrast photo.",
  },
  urdu: {
    language: "Urdu",
    script: "Nastaliq / Arabic-based (right-to-left)",
    tip: "Nastaliq stacking needs a flat photo from above; angle shots merge ligatures.",
  },
  vietnamese: {
    language: "Vietnamese",
    script: "Latin with Vietnamese tone marks",
    tip: "Tone diacritics are dense — use more light and avoid compression artifacts.",
  },
};

/** Parse `handwriting-to-text-bengali` → script note, if known. */
export function ocrScriptNote(slug: string): {
  language: string;
  script: string;
  tip: string;
} | null {
  const m = /^handwriting-to-text-([a-z]+)$/i.exec(slug);
  if (!m?.[1]) return null;
  return OCR_SCRIPT_NOTES[m[1].toLowerCase()] ?? null;
}
