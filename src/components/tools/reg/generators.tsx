"use client";

import { makeReg } from "./_util";
import {
  JsonFormatter, JsonToCsv, CsvToJson, CsvToTsv, JsonYaml, XmlToJson, JsonToXml, JsonToTs,
  SqlToJson, Base64Tool, JwtDecoder, RegexTester, TimestampConverter, UuidGenerator,
  MarkdownToHtml, HtmlToMarkdown, RandomNumber, RandomString, ListRandomizer, Minifier, CronGenerator,
} from "@/components/tools/impl/data";
import { BaseConverter } from "@/components/tools/impl/unit-converter";
import { ColorConverter } from "@/components/tools/impl/color";
import { QrGenerator, BarcodeGenerator } from "@/components/tools/impl/generators";
import { CaseConverter, LoremIpsum, SlugTool } from "@/components/tools/impl/text";
import { PasswordGenerator, HashGenerator } from "@/components/tools/impl/security";
import { InvoiceGenerator, IbanValidator } from "@/components/tools/impl/high-demand";
import {
  EmailSignatureGenerator, VcardGenerator, IcsCalendarGenerator,
} from "@/components/tools/impl/demand-extra";
import { DecisionWheel, PomodoroTimer } from "@/components/tools/impl/engaging-suite";

export default makeReg({
  "json-to-csv": JsonToCsv,
  "csv-to-json": CsvToJson,
  "csv-to-tsv": CsvToTsv,
  "json-formatter": JsonFormatter,
  "json-to-yaml": () => <JsonYaml dir="j2y" />,
  "xml-to-json": XmlToJson,
  "json-to-xml": JsonToXml,
  "json-to-typescript": JsonToTs,
  "sql-to-json": SqlToJson,
  "base64-encoder-decoder": Base64Tool,
  "qr-code-generator": () => <QrGenerator />,
  "barcode-generator": BarcodeGenerator,
  "uuid-generator": UuidGenerator,
  "password-generator": () => <PasswordGenerator />,
  "lorem-ipsum-generator": LoremIpsum,
  "hash-generator": () => <HashGenerator />,
  "case-converter": CaseConverter,
  "timestamp-converter": TimestampConverter,
  "html-to-markdown": HtmlToMarkdown,
  "markdown-to-html": MarkdownToHtml,
  "color-converter": ColorConverter,
  "number-base-converter": BaseConverter,
  "random-number-generator": RandomNumber,
  "random-string-generator": RandomString,
  "regex-tester": RegexTester,
  "jwt-decoder": JwtDecoder,
  "text-to-slug": SlugTool,
  "cron-expression-generator": CronGenerator,
  "list-randomizer": ListRandomizer,
  "code-minifier": () => <Minifier kind="js" />,
  "invoice-generator": InvoiceGenerator,
  "iban-validator": IbanValidator,
  "email-signature-generator": EmailSignatureGenerator,
  "vcard-generator": VcardGenerator,
  "ics-calendar-generator": IcsCalendarGenerator,
  "decision-wheel": DecisionWheel,
  "pomodoro-timer": PomodoroTimer,
});
