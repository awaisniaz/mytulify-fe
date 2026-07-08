"use client";

import { makeReg } from "./_util";
import {
  WordCounter, CharacterCounter, SentenceCounter, CaseConverter, TitleCaseConverter,
  CapitalizeEachWord, RemoveLineBreaks, RemoveExtraSpaces, WhitespaceRemover, RemovePunctuation,
  RemoveDuplicateLines, ReverseText, AddLineNumbers, SortTextLines, TextRepeater, FindReplace,
  WordFrequency, SlugTool, BinaryTranslator, MorseTranslator, NatoConverter, BionicReading,
  DiffChecker, LoremIpsum, TextToSpeech,
} from "@/components/tools/impl/text";
import { TextToAsciiArt, TextToHandwriting } from "@/components/tools/impl/text-extra";
import { MultiStyler, SingleStyler } from "@/components/tools/impl/text-styler";

export default makeReg({
  "word-counter": WordCounter,
  "character-counter": CharacterCounter,
  "sentence-counter": SentenceCounter,
  "case-converter": CaseConverter,
  "title-case-converter": TitleCaseConverter,
  "capitalize-each-word": CapitalizeEachWord,
  "lorem-ipsum-generator": LoremIpsum,
  "remove-line-breaks": RemoveLineBreaks,
  "remove-extra-spaces": RemoveExtraSpaces,
  "whitespace-remover": WhitespaceRemover,
  "remove-punctuation": RemovePunctuation,
  "remove-duplicate-lines": RemoveDuplicateLines,
  "reverse-text": ReverseText,
  "add-line-numbers": AddLineNumbers,
  "sort-text-lines": SortTextLines,
  "text-repeater": TextRepeater,
  "find-and-replace-text": FindReplace,
  "word-frequency-counter": WordFrequency,
  "text-to-slug": SlugTool,
  "binary-translator": BinaryTranslator,
  "morse-code-translator": MorseTranslator,
  "nato-phonetic-alphabet-converter": NatoConverter,
  "bionic-reading-converter": BionicReading,
  "text-diff-checker": DiffChecker,
  "text-to-speech": TextToSpeech,
  "fancy-text-generator": () => <MultiStyler defaultText="Fancy Text" />,
  "strikethrough-text-generator": () => <SingleStyler styleName="Strikethrough" />,
  "upside-down-text-generator": () => <SingleStyler styleName="Upside Down" />,
  "text-to-ascii-art": TextToAsciiArt,
  "text-to-handwriting": TextToHandwriting,
});
