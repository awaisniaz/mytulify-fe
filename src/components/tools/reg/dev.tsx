"use client";

import { makeReg } from "./_util";
import {
  JsonFormatter, JsonValidator, JsonToCsv, CsvToJson, JsonYaml, Base64Tool, UrlTool,
  HtmlEntitiesTool, Rot13Tool, JwtDecoder, RegexTester, TimestampConverter, UuidGenerator,
  Minifier, SqlFormatter, XmlFormatter, MarkdownPreview, ChmodCalculator, UserAgentParser, CronGenerator,
} from "@/components/tools/impl/data";
import { BaseConverter } from "@/components/tools/impl/unit-converter";
import { ColorConverter, GradientGenerator, ShadowGenerator } from "@/components/tools/impl/color";
import { QrGenerator } from "@/components/tools/impl/generators";
import { SlugTool } from "@/components/tools/impl/text";
import { MetaTagGenerator } from "@/components/tools/impl/seo";
import { GitignoreGenerator } from "@/components/tools/impl/devops";
import { RegexExplainer, DataFileMerger, DuplicateFileFinder } from "@/components/tools/impl/devx";
import { MockDataGenerator, PwaManifestGenerator } from "@/components/tools/impl/high-demand";
import { PxRemConverter } from "@/components/tools/impl/demand-extra";

export default makeReg({
  "json-formatter": JsonFormatter,
  "json-validator": JsonValidator,
  "json-to-csv": JsonToCsv,
  "csv-to-json": CsvToJson,
  "json-to-yaml": () => <JsonYaml dir="j2y" />,
  "yaml-to-json": () => <JsonYaml dir="y2j" />,
  "px-to-rem-converter": PxRemConverter,
  "base64-encoder-decoder": Base64Tool,
  "url-encoder-decoder": UrlTool,
  "html-encoder-decoder": HtmlEntitiesTool,
  "rot13-encoder-decoder": Rot13Tool,
  "jwt-decoder": JwtDecoder,
  "regex-tester": RegexTester,
  "timestamp-converter": TimestampConverter,
  "uuid-generator": UuidGenerator,
  "html-minifier": () => <Minifier kind="html" />,
  "css-minifier": () => <Minifier kind="css" />,
  "javascript-minifier": () => <Minifier kind="js" />,
  "sql-formatter": SqlFormatter,
  "xml-formatter": XmlFormatter,
  "markdown-preview": MarkdownPreview,
  "chmod-calculator": ChmodCalculator,
  "user-agent-parser": UserAgentParser,
  "cron-expression-generator": CronGenerator,
  "number-base-converter": BaseConverter,
  "hex-to-rgb-converter": ColorConverter,
  "color-picker": ColorConverter,
  "css-gradient-generator": GradientGenerator,
  "box-shadow-generator": () => <ShadowGenerator kind="box" />,
  "qr-code-generator": () => <QrGenerator />,
  "slug-generator": SlugTool,
  "meta-tag-generator": MetaTagGenerator,
  "gitignore-generator": GitignoreGenerator,
  "regex-explainer": RegexExplainer,
  "data-file-merger": DataFileMerger,
  "duplicate-file-finder": DuplicateFileFinder,
  "mock-data-generator": MockDataGenerator,
  "pwa-manifest-generator": PwaManifestGenerator,
});
