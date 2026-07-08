"use client";

import { makeReg } from "./_util";
import {
  MetaTagGenerator, OpenGraphGenerator, TwitterCardGenerator, KeywordDensity, RobotsTxtGenerator,
  SitemapGenerator, SchemaGenerator, UtmBuilder, SerpPreview, CanonicalTag, RobotsMetaTag, HreflangTag,
  HtmlTagStripper, EmailExtractor, CodeTextRatio, KeywordCombiner, ReadabilityChecker, HtaccessGenerator,
  MetaTagsAnalyzer, RobotsValidator,
} from "@/components/tools/impl/seo";
import { UrlTool } from "@/components/tools/impl/data";
import { WordCounter, CharacterCounter, SlugTool, DiffChecker } from "@/components/tools/impl/text";
import { FaviconGenerator } from "@/components/tools/impl/image";
import { DomainNameFinder } from "@/components/tools/impl/domain";
import { LlmsTxtGenerator, SecurityHeadersGenerator, AdsTxtGenerator } from "@/components/tools/impl/high-demand";

export default makeReg({
  "meta-tag-generator": MetaTagGenerator,
  "keyword-density-checker": KeywordDensity,
  "robots-txt-generator": RobotsTxtGenerator,
  "xml-sitemap-generator": SitemapGenerator,
  "schema-markup-generator": () => <SchemaGenerator kind="auto" />,
  "open-graph-generator": OpenGraphGenerator,
  "twitter-card-generator": TwitterCardGenerator,
  "serp-snippet-preview": SerpPreview,
  "htaccess-generator": HtaccessGenerator,
  "url-encoder-decoder": UrlTool,
  "url-slug-generator": SlugTool,
  "word-counter": WordCounter,
  "character-counter": CharacterCounter,
  "code-to-text-ratio-checker": CodeTextRatio,
  "robots-meta-tag-generator": RobotsMetaTag,
  "canonical-tag-generator": CanonicalTag,
  "hreflang-tag-generator": HreflangTag,
  "keyword-combiner": KeywordCombiner,
  "utm-builder": UtmBuilder,
  "html-tag-stripper": HtmlTagStripper,
  "meta-description-length-checker": SerpPreview,
  "text-diff-checker": DiffChecker,
  "faq-schema-generator": () => <SchemaGenerator kind="faq" />,
  "breadcrumb-schema-generator": () => <SchemaGenerator kind="breadcrumb" />,
  "redirect-checker": HtaccessGenerator,
  "email-extractor": EmailExtractor,
  "readability-checker": ReadabilityChecker,
  "meta-tags-analyzer": MetaTagsAnalyzer,
  "robots-txt-validator": RobotsValidator,
  "favicon-generator": FaviconGenerator,
  "domain-name-finder": DomainNameFinder,
  "llms-txt-generator": LlmsTxtGenerator,
  "security-headers-generator": SecurityHeadersGenerator,
  "ads-txt-generator": AdsTxtGenerator,
});
