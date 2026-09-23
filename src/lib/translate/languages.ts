/** Common Google Translate language codes for the Language Translator tool. */
export const TRANSLATE_LANGUAGES = [
  { code: "auto", name: "Detect language" },
  { code: "en", name: "English" },
  { code: "ur", name: "Urdu" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "pa", name: "Punjabi" },
  { code: "fa", name: "Persian" },
  { code: "ps", name: "Pashto" },
  { code: "tr", name: "Turkish" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "pl", name: "Polish" },
  { code: "nl", name: "Dutch" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "tl", name: "Filipino" },
  { code: "he", name: "Hebrew" },
  { code: "el", name: "Greek" },
  { code: "sv", name: "Swedish" },
  { code: "ro", name: "Romanian" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "fi", name: "Finnish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "sw", name: "Swahili" },
] as const;

export type TranslateLangCode = (typeof TRANSLATE_LANGUAGES)[number]["code"];

export const TRANSLATE_TARGET_LANGUAGES = TRANSLATE_LANGUAGES.filter((l) => l.code !== "auto");

export const TRANSLATE_LIMITS = {
  maxTextsPerRequest: 200,
  maxCharsPerText: 4500,
  maxTotalChars: 80_000,
  maxFileCells: 2000,
  /** Max simultaneous target languages in one run. */
  maxTargets: 8,
} as const;

export function languageName(code: string): string {
  return TRANSLATE_LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
