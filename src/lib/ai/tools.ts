/**
 * Declarative registry of AI-powered tools.
 *
 * This module is pure data (no secrets, no server-only imports) so it can be
 * shared by the server route handler — which reads the `system`/`buildUser`
 * prompts — and the client shell, which reads `fields`/`cta`/`outputLabel` to
 * render the form. The AI provider API key is NEVER referenced here; it is read
 * only inside the server route from `process.env`.
 *
 * `effort`/`think` are provider-neutral generation hints. They are consumed by
 * the Anthropic implementation; the current OpenAI route ignores them and uses
 * a fixed temperature. Kept so the registry stays provider-agnostic.
 */

import type { Level, Complexity } from "@/lib/catalog/types";

export type Effort = "low" | "medium" | "high";

export type AiField =
  | {
      name: string;
      type: "textarea";
      label: string;
      placeholder?: string;
      required?: boolean;
      rows?: number;
      mono?: boolean;
    }
  | {
      name: string;
      type: "text";
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      name: string;
      type: "select";
      label: string;
      options: { value: string; label: string }[];
      default?: string;
    }
  | {
      name: string;
      type: "image";
      label: string;
      required?: boolean;
    };

export type AiInput = Record<string, string>;

export interface AiTool {
  /** matches the catalog tool slug */
  slug: string;
  /** button label */
  cta: string;
  /** label above the result panel */
  outputLabel: string;
  /** whether the result is code/markdown (mono) or prose */
  mono?: boolean;
  fields: AiField[];
  maxTokens: number;
  effort: Effort;
  /** enable adaptive thinking for reasoning-heavy tools (slower, deeper) */
  think?: boolean;
  system: (input: AiInput) => string;
  buildUser: (input: AiInput) => string;
}

/* ------------------------------------------------------------------ helpers */

const codeField = (
  name = "code",
  label = "Your code",
  placeholder = "Paste your code here…",
): AiField => ({ name, type: "textarea", label, placeholder, required: true, rows: 12, mono: true });

/* ------------------------------------------------------------------- tools  */

export const AI_TOOLS: Record<string, AiTool> = {
  "code-explainer": {
    slug: "code-explainer",
    cta: "Explain code",
    outputLabel: "Explanation",
    fields: [
      codeField(),
      {
        name: "level",
        type: "select",
        label: "Explanation depth",
        default: "beginner",
        options: [
          { value: "beginner", label: "Beginner — assume little background" },
          { value: "expert", label: "Expert — concise, technical" },
        ],
      },
    ],
    maxTokens: 1600,
    effort: "medium",
    system: ({ level }) =>
      `You are an expert programming tutor. Explain the given code in clear, plain English for a ${
        level === "expert" ? "senior engineer (be concise and technical, skip basics)" : "beginner (assume little background, define jargon)"
      }. Structure the answer as: a one-line summary, a short step-by-step walkthrough, then a "Potential issues" section flagging likely bugs, edge cases, or smells inline (or "None obvious"). Use Markdown. Do not repeat the code back verbatim.`,
    buildUser: ({ code }) => code ?? "",
  },

  "sql-query-generator": {
    slug: "sql-query-generator",
    cta: "Generate SQL",
    outputLabel: "Generated SQL",
    mono: true,
    fields: [
      {
        name: "request",
        type: "textarea",
        label: "Describe the query in plain English",
        placeholder: "e.g. Top 5 customers by total order value in 2024, with their email",
        required: true,
        rows: 5,
      },
      {
        name: "schema",
        type: "textarea",
        label: "Table schema (optional)",
        placeholder: "customers(id, name, email)\norders(id, customer_id, total, created_at)",
        rows: 4,
        mono: true,
      },
      {
        name: "dialect",
        type: "select",
        label: "SQL dialect",
        default: "postgres",
        options: [
          { value: "postgres", label: "PostgreSQL" },
          { value: "mysql", label: "MySQL" },
          { value: "sqlite", label: "SQLite" },
          { value: "tsql", label: "SQL Server (T-SQL)" },
        ],
      },
    ],
    maxTokens: 1200,
    effort: "medium",
    system: ({ dialect }) =>
      `You are an expert SQL engineer. Convert the user's request into a correct, well-formatted ${dialect} query. Respond in Markdown: first a \`\`\`sql code block with the query, then a short "Explanation" section describing in plain English what the query does. If a schema is provided, use exactly those table/column names. Prefer explicit JOINs and readable aliasing.`,
    buildUser: ({ request, schema }) =>
      schema?.trim() ? `Request: ${request}\n\nSchema:\n${schema}` : `Request: ${request}`,
  },

  "error-diagnoser": {
    slug: "error-diagnoser",
    cta: "Diagnose error",
    outputLabel: "Diagnosis & fix",
    fields: [
      {
        name: "error",
        type: "textarea",
        label: "Error message / stack trace",
        placeholder: "Paste the full error or stack trace…",
        required: true,
        rows: 8,
        mono: true,
      },
      {
        name: "context",
        type: "textarea",
        label: "Relevant code (optional)",
        placeholder: "Paste the code the error points to, if you have it…",
        rows: 6,
        mono: true,
      },
    ],
    maxTokens: 1600,
    effort: "high",
    think: true,
    system: () =>
      `You are a senior debugging expert. Given an error message or stack trace (and optional code), respond in Markdown with: "Cause" (what actually went wrong, reading the stack trace carefully), then "Fix" showing the exact corrected code as a diff-style \`\`\`diff or code block, then "Why it works" in one or two sentences. Be specific and actionable — point at the real line, not generic advice.`,
    buildUser: ({ error, context }) =>
      context?.trim() ? `Error:\n${error}\n\nCode:\n${context}` : `Error:\n${error}`,
  },

  "code-review-assistant": {
    slug: "code-review-assistant",
    cta: "Review code",
    outputLabel: "Review",
    fields: [codeField("code", "Code to review")],
    maxTokens: 1800,
    effort: "high",
    think: true,
    system: () =>
      `You are a meticulous senior code reviewer. Review the given code and organize findings under three separate Markdown sections — "## Security", "## Performance", and "## Style" — with a bulleted list under each (write "No issues found." if a section is clean). For each finding, be concrete: name the line or construct and suggest the fix. End with a one-line overall verdict.`,
    buildUser: ({ code }) => code ?? "",
  },

  "regex-generator": {
    slug: "regex-generator",
    cta: "Generate regex",
    outputLabel: "Regular expression",
    mono: true,
    fields: [
      {
        name: "request",
        type: "textarea",
        label: "Describe what to match, in plain English",
        placeholder: "e.g. Match a US phone number like (555) 123-4567 or 555-123-4567",
        required: true,
        rows: 4,
      },
      {
        name: "flavor",
        type: "select",
        label: "Flavor",
        default: "js",
        options: [
          { value: "js", label: "JavaScript" },
          { value: "python", label: "Python (re)" },
          { value: "pcre", label: "PCRE / general" },
        ],
      },
    ],
    maxTokens: 900,
    effort: "medium",
    system: ({ flavor }) =>
      `You are a regular-expression expert. Produce a correct ${flavor} regex for the user's description. Respond in Markdown: a \`\`\`regex (or code) block with the pattern only, then a "How it works" section breaking the pattern into parts, then a short "Examples" list showing 2–3 matching and 1–2 non-matching strings.`,
    buildUser: ({ request }) => request ?? "",
  },

  "commit-message-generator": {
    slug: "commit-message-generator",
    cta: "Generate commit message",
    outputLabel: "Commit message",
    mono: true,
    fields: [
      {
        name: "diff",
        type: "textarea",
        label: "git diff (or a description of your changes)",
        placeholder: "Paste the output of `git diff` here…",
        required: true,
        rows: 12,
        mono: true,
      },
      {
        name: "style",
        type: "select",
        label: "Format",
        default: "conventional",
        options: [
          { value: "conventional", label: "Conventional Commits" },
          { value: "gitmoji", label: "Gitmoji" },
          { value: "plain", label: "Plain / concise" },
        ],
      },
    ],
    maxTokens: 700,
    effort: "low",
    system: ({ style }) => {
      const rules =
        style === "conventional"
          ? "Use Conventional Commits: `type(scope): summary` (types: feat, fix, docs, style, refactor, perf, test, chore, build, ci). Add a body with bullet points only if the change is non-trivial."
          : style === "gitmoji"
          ? "Use the Gitmoji convention: start the subject with an appropriate emoji, then a concise summary. Add a short body if useful."
          : "Write a plain, concise commit message: an imperative subject line under 60 chars, optional short body.";
      return `You are an expert at writing git commit messages. Given a diff (or change description), write ONE commit message. ${rules} Output the commit message inside a single \`\`\`text code block and nothing else — no preamble.`;
    },
    buildUser: ({ diff }) => diff ?? "",
  },

  "readme-generator": {
    slug: "readme-generator",
    cta: "Generate README",
    outputLabel: "README.md",
    mono: true,
    fields: [
      {
        name: "info",
        type: "textarea",
        label: "Project details",
        placeholder:
          "Project name, what it does, install/run commands. Or paste your package.json / requirements.txt to auto-detect the stack.",
        required: true,
        rows: 10,
      },
    ],
    maxTokens: 2200,
    effort: "medium",
    system: () =>
      `You are a technical writer. Generate a polished, professional README.md from the project details provided. If a package.json, requirements.txt, or similar manifest is included, detect the tech stack and pre-fill Installation/Usage accordingly. Include sensible sections: title + one-line description, badges placeholder, Features, Installation, Usage, Configuration (if relevant), and License. Output raw Markdown inside a single \`\`\`markdown code block.`,
    buildUser: ({ info }) => info ?? "",
  },

  "test-case-generator": {
    slug: "test-case-generator",
    cta: "Generate tests",
    outputLabel: "Test cases",
    mono: true,
    fields: [
      codeField("code", "Function to test"),
      {
        name: "framework",
        type: "select",
        label: "Test framework",
        default: "jest",
        options: [
          { value: "jest", label: "Jest (JavaScript/TS)" },
          { value: "pytest", label: "PyTest (Python)" },
          { value: "junit", label: "JUnit (Java)" },
        ],
      },
    ],
    maxTokens: 1800,
    effort: "medium",
    system: ({ framework }) =>
      `You are a testing expert. Write a thorough ${framework} test suite for the given function, covering the happy path, edge cases, and error conditions. Respond with the test code inside a single code block for ${framework}, preceded by one short sentence describing the coverage. Use idiomatic assertions and clear test names.`,
    buildUser: ({ code }) => code ?? "",
  },

  "docker-compose-generator": {
    slug: "docker-compose-generator",
    cta: "Generate compose file",
    outputLabel: "docker-compose.yml",
    mono: true,
    fields: [
      {
        name: "stack",
        type: "select",
        label: "Start from a stack template",
        default: "custom",
        options: [
          { value: "custom", label: "Custom — describe it below" },
          { value: "laravel-mysql-redis", label: "Laravel + MySQL + Redis" },
          { value: "mern", label: "MERN (Mongo + Express + React + Node)" },
          { value: "django-postgres", label: "Django + PostgreSQL" },
          { value: "wordpress-mysql", label: "WordPress + MySQL" },
        ],
      },
      {
        name: "description",
        type: "textarea",
        label: "Describe your services (or tweaks to the template)",
        placeholder:
          "e.g. a Node API on port 3000, a Postgres 16 database, and an Nginx reverse proxy",
        required: true,
        rows: 6,
      },
    ],
    maxTokens: 1600,
    effort: "medium",
    system: ({ stack }) =>
      `You are a Docker expert. Produce a valid, production-sensible docker-compose.yml (Compose spec v3+). ${
        stack && stack !== "custom"
          ? `Base it on the well-known "${stack}" stack, wiring the services together correctly (networks, depends_on, env vars, named volumes), then apply the user's tweaks.`
          : "Build it from the user's description."
      } Use pinned image tags, named volumes for data, and a shared network. Respond in Markdown: the file inside a single \`\`\`yaml code block, then an "## Notes" section listing image-size / multi-stage optimizations and any assumptions. Ensure the YAML is syntactically valid.`,
    buildUser: ({ stack, description }) =>
      stack && stack !== "custom"
        ? `Stack template: ${stack}\nRequirements: ${description}`
        : `Requirements: ${description}`,
  },

  "cron-explainer": {
    slug: "cron-explainer",
    cta: "Convert",
    outputLabel: "Result",
    fields: [
      {
        name: "mode",
        type: "select",
        label: "Direction",
        default: "to-cron",
        options: [
          { value: "to-cron", label: "English → cron expression" },
          { value: "to-english", label: "Cron expression → plain English" },
        ],
      },
      {
        name: "input",
        type: "text",
        label: "Input",
        placeholder: "e.g. every weekday at 9:30am  —  or  —  30 9 * * 1-5",
        required: true,
      },
      {
        name: "timezone",
        type: "text",
        label: "Timezone (optional)",
        placeholder: "e.g. America/New_York (default: UTC)",
      },
    ],
    maxTokens: 800,
    effort: "medium",
    system: ({ mode, timezone }) => {
      const tz = timezone?.trim() || "UTC";
      return mode === "to-english"
        ? `You are a cron expert. Explain the given cron expression in plain English. Respond in Markdown: a one-line summary in bold, then a bullet list breaking down each field, then a "Next runs" list of the next 5 fire times in the ${tz} timezone (note they are approximate).`
        : `You are a cron expert. Convert the user's English schedule into a standard 5-field cron expression. Respond in Markdown: the expression inside a \`\`\`text code block, then a one-line explanation, then a "Next runs" list of the next 5 fire times in the ${tz} timezone (note they are approximate). If the request is ambiguous, pick the most common interpretation and say so.`;
    },
    buildUser: ({ input }) => input ?? "",
  },
};

/* ------------------------------------------------------ AI SEO workflows --- */
Object.assign(AI_TOOLS, {
  "content-brief-generator": {
    slug: "content-brief-generator",
    cta: "Generate brief",
    outputLabel: "SEO content brief",
    fields: [
      {
        name: "keyword",
        type: "textarea",
        label: "Primary keyword / topic",
        placeholder: "how to create an xml sitemap",
        required: true,
        rows: 2,
      },
      {
        name: "audience",
        type: "text",
        label: "Audience",
        placeholder: "Marketing managers at SaaS startups",
        default: "General web audience",
      },
      {
        name: "intent",
        type: "select",
        label: "Search intent",
        default: "informational",
        options: [
          { value: "informational", label: "Informational" },
          { value: "commercial", label: "Commercial investigation" },
          { value: "transactional", label: "Transactional" },
        ],
      },
    ],
    maxTokens: 2200,
    effort: "high",
    system: ({ intent, audience }) =>
      `You are a senior SEO content strategist. Create a comprehensive content brief for a ${intent} page aimed at: ${audience}. Use Markdown with sections: Title ideas (5), Primary & secondary keywords, Search intent notes, Recommended outline (H2/H3), People Also Ask style questions, Internal link opportunities (generic but realistic), Word count target, and On-page checklist. Be specific and actionable.`,
    buildUser: ({ keyword, audience, intent }) =>
      `Primary keyword/topic: ${keyword}\nAudience: ${audience}\nIntent: ${intent}`,
  },
  "ai-meta-tag-writer": {
    slug: "ai-meta-tag-writer",
    cta: "Write meta tags",
    outputLabel: "Titles & meta descriptions",
    fields: [
      {
        name: "keyword",
        type: "text",
        label: "Focus keyword",
        required: true,
        placeholder: "keyword density checker",
      },
      {
        name: "page",
        type: "textarea",
        label: "Page summary or draft",
        required: true,
        rows: 6,
        placeholder: "Describe what the page covers…",
      },
      {
        name: "brand",
        type: "text",
        label: "Brand name (optional)",
        placeholder: "Mytulify",
      },
    ],
    maxTokens: 1200,
    effort: "medium",
    system: () =>
      `You are an SEO copywriter. Write click-worthy but honest SERP copy. Respond in Markdown with: ## Title tags (5 options, 50–60 characters each), ## Meta descriptions (5 options, 140–160 characters each), ## Notes (keyword placement + CTA tips). Count characters carefully. Do not stuff keywords.`,
    buildUser: ({ keyword, page, brand }) =>
      `Focus keyword: ${keyword}\nBrand: ${brand || "(none)"}\nPage content:\n${page}`,
  },
  "ai-seo-outline-generator": {
    slug: "ai-seo-outline-generator",
    cta: "Generate outline",
    outputLabel: "SEO outline",
    fields: [
      {
        name: "keyword",
        type: "text",
        label: "Target keyword",
        required: true,
      },
      {
        name: "angle",
        type: "textarea",
        label: "Unique angle / product to mention (optional)",
        rows: 3,
        placeholder: "We have a free online tool the reader can use…",
      },
    ],
    maxTokens: 1800,
    effort: "medium",
    system: () =>
      `You are an SEO editor. Produce a detailed article outline in Markdown: H1, then nested H2/H3 with 1-sentence notes under each on what to cover. Include intro hook, FAQ section ideas, and a conclusion CTA. Optimize for featured snippets with definition and list-friendly headings.`,
    buildUser: ({ keyword, angle }) =>
      angle?.trim() ? `Keyword: ${keyword}\nAngle: ${angle}` : `Keyword: ${keyword}`,
  },
  "ai-seo-page-audit": {
    slug: "ai-seo-page-audit",
    cta: "Audit page",
    outputLabel: "SEO audit",
    fields: [
      {
        name: "pageUrl",
        type: "text",
        label: "Page URL (optional — fetch live HTML)",
        placeholder: "https://example.com/page",
      },
      {
        name: "keyword",
        type: "text",
        label: "Target keyword (optional)",
        placeholder: "primary keyword",
      },
      {
        name: "html",
        type: "textarea",
        label: "Page HTML or text",
        required: false,
        rows: 12,
        mono: true,
        placeholder: "Paste HTML — or leave empty and use Page URL above",
      },
    ],
    maxTokens: 2200,
    effort: "high",
    think: true,
    system: () =>
      `You are a technical + on-page SEO auditor. Analyze the provided page HTML/text. Respond in Markdown with: ## Summary score (0-100) + one-line verdict, ## Critical issues, ## On-page recommendations, ## Technical notes (from HTML if present: title, meta, headings, canonical, schema), ## Quick wins (top 5 actions). Be concrete; quote snippets from the input.`,
    buildUser: ({ keyword, html, pageUrl }) => {
      const parts = [];
      if (pageUrl?.trim()) parts.push(`Page URL: ${pageUrl}`);
      if (keyword?.trim()) parts.push(`Target keyword: ${keyword}`);
      parts.push(`Page:\n${html || "(empty)"}`);
      return parts.join("\n\n");
    },
  },
} as Record<string, AiTool>);

/* ------------------------------------------------------ Handwriting OCR --- */
/**
 * 30 language-specific handwriting-OCR tools plus a generic one, all generated
 * from a single list so adding a language is a one-line change. Each uses an
 * image input sent to a vision model.
 */
export const OCR_LANGUAGES = [
  "Arabic", "Bengali", "Chinese", "Dutch", "English", "French", "German", "Greek",
  "Gujarati", "Hindi", "Indonesian", "Italian", "Japanese", "Kannada", "Korean",
  "Malayalam", "Marathi", "Persian", "Polish", "Portuguese", "Punjabi", "Russian",
  "Spanish", "Swedish", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Vietnamese",
];

export const ocrSlug = (lang: string) =>
  "handwriting-to-text-" + lang.toLowerCase().replace(/\s+/g, "-");

function makeOcrTool(lang: string | null): AiTool {
  return {
    slug: lang ? ocrSlug(lang) : "handwriting-to-text",
    cta: "Extract text",
    outputLabel: "Extracted text",
    mono: false,
    fields: [
      {
        name: "image",
        type: "image",
        label: lang ? `Upload an image of ${lang} handwriting` : "Upload an image of handwriting",
        required: true,
      },
      {
        name: "format",
        type: "select",
        label: "Output style",
        default: "plain",
        options: [
          { value: "plain", label: "Plain text (preserve line breaks)" },
          { value: "markdown", label: "Keep formatting (Markdown)" },
        ],
      },
    ],
    maxTokens: 2000,
    effort: "low",
    system: ({ format }) =>
      `You are an expert OCR engine that reads handwriting${lang ? ` written in ${lang}` : ""}. Transcribe the handwritten text in the image exactly as written${
        lang ? `, keeping it in ${lang}` : ", keeping it in its original language"
      }. ${
        format === "markdown"
          ? "Preserve structure with Markdown (headings, lists, line breaks)."
          : "Output plain text and preserve line breaks."
      } Do not translate, summarise or add commentary. Mark any unreadable part as [illegible]. Output only the transcription.`,
    buildUser: () =>
      lang
        ? `Transcribe the ${lang} handwriting in this image.`
        : "Transcribe the handwriting in this image in its original language.",
  };
}

for (const lang of OCR_LANGUAGES) AI_TOOLS[ocrSlug(lang)] = makeOcrTool(lang);
AI_TOOLS["handwriting-to-text"] = makeOcrTool(null);

/** Catalog rows for the Handwriting OCR category, built from the same list. */
export function ocrCatalogTools(): {
  name: string;
  slug: string;
  description: string;
  searchVolume: Level;
  competition: Level;
  complexity: Complexity;
  clientSide: boolean;
}[] {
  const row = (name: string, slug: string, description: string) => ({
    name,
    slug,
    description,
    searchVolume: "medium" as Level,
    competition: "low" as Level,
    complexity: "hard" as Complexity,
    clientSide: false,
  });
  return [
    row(
      "Handwriting to Text (OCR)",
      "handwriting-to-text",
      "Convert a photo of handwriting into digital text in any language using AI vision.",
    ),
    ...OCR_LANGUAGES.map((l) =>
      row(
        `${l} Handwriting to Text`,
        ocrSlug(l),
        `Convert ${l} handwriting from a photo into editable ${l} text with AI-powered OCR.`,
      ),
    ),
  ];
}

export function getAiTool(slug: string): AiTool | undefined {
  return AI_TOOLS[slug];
}
