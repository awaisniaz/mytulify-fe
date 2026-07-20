#!/usr/bin/env node
/**
 * Generates per-tool Lucide icon map from slug keyword rules.
 * Run: node scripts/generate-tool-icons.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const META = {
  "ai-tools": "Sparkles",
  "handwriting-ocr": "ScanText",
  "devops-tools": "Server",
  "health-tools": "Activity",
  "text-tools": "Type",
  "developer-tools": "Code2",
  "security-password-tools": "ShieldCheck",
  "pdf-tools": "FileText",
  "image-tools": "Image",
  "color-tools": "Palette",
  calculators: "Calculator",
  "unit-converters": "Ruler",
  "seo-web-tools": "Search",
  "social-media-tools": "Share2",
  "converters-generators": "Repeat",
  "freelancer-tools": "Briefcase",
};

const RULES = [
  [/handwriting|ocr|scan-text/i, "ScanText"],
  [/llms-txt|llms\.txt/i, "Bot"],
  [/ads-txt|ads\.txt/i, "Megaphone"],
  [/security-headers|csp|hsts/i, "Shield"],
  [/domain-name|domain-finder/i, "Globe"],
  [/invoice|receipt/i, "Receipt"],
  [/contract-generator|nda-generator|change-order|proposal-generator|onboarding-form/i, "FileText"],
  [/rate-calculator|quote-calculator|late-fee|break-even|self-employment-tax/i, "DollarSign"],
  [/iban/i, "Landmark"],
  [/email-signature/i, "Share2"],
  [/vcard|vcf/i, "Fingerprint"],
  [/ics-calendar/i, "Calendar"],
  [/px-to-rem|rem-to-px|aspect-ratio/i, "Ruler"],
  [/reading-time|read-time/i, "Type"],
  [/profit-margin|markup-calculator/i, "DollarSign"],
  [/mock-data|fake-data/i, "Database"],
  [/pwa-manifest|manifest\.json/i, "Smartphone"],
  [/wifi-qr|wifi/i, "Wifi"],
  [/qr-code|qr-generator/i, "QrCode"],
  [/barcode/i, "Barcode"],
  [/favicon|image-to-ico|\.ico/i, "Sparkle"],
  [/open-graph|twitter-card|og-/i, "Share2"],
  [/schema|json-ld|breadcrumb-schema|faq-schema|howto-schema|local-business-schema|schema-markup/i, "Braces"],
  [/backlink|disavow|orphan-page|internal-link/i, "Link"],
  [/rank-tracker|keyword-rank|url-page-seo|inflation/i, "TrendingUp"],
  [/decision-wheel|spin-wheel|wheel-of/i, "Shuffle"],
  [/pomodoro|focus-timer/i, "Clock"],
  [/speech-to-text|dictation|voice-to-text/i, "Megaphone"],
  [/debt-payoff|loan-payoff/i, "DollarSign"],
  [/seo-audit|seo-content-score|heading-structure|nap-consistency|search-intent|keyword-difficulty|related-keywords|content-brief|ai-seo|ai-meta|meta-tags-analyzer/i, "Search"],
  [/robots\.txt|robots-meta|sitemap|canonical|hreflang|redirect|htaccess|utm|serp|meta-tag|meta-tags|keyword|readability|email-extract|html-tag|code-to-text|url-slug/i, "Search"],
  [/pdf|document-to-pdf|images-to-pdf|word-to-pdf|html-to-pdf|pdf-to-/i, "FileText"],
  [/merge-pdf|combine-pdf|join-pdf/i, "Files"],
  [/split-pdf|extract-page/i, "Scissors"],
  [/rotate-pdf|flip-pdf/i, "RotateCw"],
  [/watermark|stamp/i, "Stamp"],
  [/compress-pdf|optimize-pdf/i, "Archive"],
  [/protect-pdf|unlock-pdf|password-pdf/i, "LockKeyhole"],
  [/page-number|page-num/i, "Hash"],
  [/resize-image|scale-image|image-resiz/i, "Maximize2"],
  [/compress-image|optimize-image|reduce-image/i, "Archive"],
  [/crop-image|crop/i, "Crop"],
  [/convert-image|image-converter|png-to-jpg|jpg-to-png|webp|heic|bmp|gif|svg-to|to-svg|to-png|to-jpg|to-webp/i, "Image"],
  [/filter|blur|sharpen|grayscale|sepia|invert|meme|collage|flip-image|rotate-image|exif|metadata|background-remov|transparent|aspect-ratio|pixelate|vignette|brightness|contrast|saturation|hue|duotone|posterize|border-image|round-corn|add-text|watermark-to-image/i, "Wand2"],
  [/home-color|room-color|paint-visual|color-visualizer/i, "Palette"],
  [/color-picker|palette|gradient|shadow|contrast-check|color-blind|tint|shade|tone|harmony|analogous|complementary|triadic|monochrome|random-color|color-name|color-mix|extract-color|image-color|dominant-color/i, "Palette"],
  [/hex-to-|rgb-to-|hsl-to-|cmyk|color-convert|color-code/i, "Palette"],
  [/password-generator|passphrase|random-password/i, "KeyRound"],
  [/password-strength|strength-check/i, "ShieldCheck"],
  [/hash-generator|md5|sha-|hash-/i, "Hash"],
  [/hmac|bcrypt|scrypt|argon|pbkdf/i, "Shield"],
  [/encrypt|decrypt|aes|cipher|caesar|rot13|vigenere|substitution|transposition|atbash|morse|binary-encode|base32|base58|base85|hex-encode|url-safe|jwt|token-generator|api-key|csrf|otp|totp|2fa|pin-generator|secret-generator|random-string|random-token/i, "Lock"],
  [/vpn|firewall|ssl|tls|certificate|security-audit|penetration|xss|sql-injection|csrf|sanitize|escape-html|html-sanitize/i, "ShieldCheck"],
  [/json-to-|csv-to-|xml-to-|yaml-to-|sql-to-|html-to-|markdown-to-|to-json|to-csv|to-xml|to-yaml|to-typescript|to-markdown|to-html|json-to|csv-to|xml-to|yaml-to|sql-to|html-to|markdown-to|data-file-merger|data-convert|file-merger|merger/i, "ArrowLeftRight"],
  [/json-format|json-valid|json-beaut|json-minif|json-tree|json-path|json-diff|json-sort|json-flatten|json-pretty/i, "Braces"],
  [/xml-format|xml-valid|xml-beaut|xml-minif/i, "CodeXml"],
  [/sql-format|sql-beaut|sql-minif|sql-query|sql-generator/i, "Database"],
  [/regex|regular-expression/i, "Regex"],
  [/base64|encoder|decoder|encode|decode|url-encoder|html-encoder|unicode-encoder|rot13|entity/i, "ArrowLeftRight"],
  [/jwt-decoder|jwt/i, "KeyRound"],
  [/uuid|guid/i, "Fingerprint"],
  [/cron|schedule|timestamp|time-zone|timezone|unix-time|epoch|date-calculator|countdown|hours-calculator|time-duration|due-date|ovulation|pregnancy|age-calculator|date-/i, "Calendar"],
  [/timestamp/i, "Clock"],
  [/docker|compose|container/i, "Container"],
  [/kubernetes|k8s|helm|kubectl|kube/i, "Boxes"],
  [/nginx|apache|server-config|htaccess|proxy|load-balancer|reverse-proxy/i, "Server"],
  [/github-actions|gitlab-ci|jenkins|pipeline|ci-cd|workflow/i, "Workflow"],
  [/gitignore|git-/i, "GitBranch"],
  [/backup-script|backup/i, "HardDrive"],
  [/terraform|cloudformation|pulumi|ansible|chef|puppet|vagrant/i, "Cloud"],
  [/ssl-cert|letsencrypt|certbot/i, "ShieldCheck"],
  [/chmod|permission|umask/i, "Terminal"],
  [/user-agent|browser-detect/i, "Monitor"],
  [/curl|http-request|api-tester|rest-client|postman/i, "Globe"],
  [/minif|minify|compress-code|uglify|beautif|prettif|format-code|code-format/i, "Minimize2"],
  [/html-minif|css-minif|javascript-minif|js-minif|code-minif/i, "Minimize2"],
  [/markdown-preview|markdown/i, "FileText"],
  [/lorem|ipsum|placeholder-text|dummy-text/i, "AlignLeft"],
  [/word-count|character-count|letter-count|line-count|sentence-count|paragraph-count|reading-time|syllable|word-frequency|keyword-density/i, "Type"],
  [/case-convert|uppercase|lowercase|title-case|camel-case|snake-case|kebab-case|swap-case|invert-case|capitalize|alternating-case/i, "CaseSensitive"],
  [/text-diff|diff-check|compare-text|plagiarism|similarity|duplicate-line|remove-duplicate|unique-line|sort-line|reverse-line|shuffle-line|trim-line|add-line-number|remove-line-break|remove-empty-line|text-clean|whitespace|indent|outdent|tab-to-space|space-to-tab/i, "GitCompare"],
  [/find-replace|search-replace|text-replace/i, "Replace"],
  [/bold-text|italic-text|underline|strikethrough|fancy-font|cursive|bubble|glitch|mirror|upside|small-caps|wide-text|zalgo|unicode-font|instagram-font|twitter-font|facebook-font|tiktok-font|stylish-text|cool-text|aesthetic/i, "Sparkles"],
  [/hashtag|caption|bio|tweet|twitter|instagram|facebook|linkedin|social|mockup|fake-tweet|fake-instagram|post-generator|thread|emoji-picker|emoji/i, "Share2"],
  [/bmi|bmr|tdee|body-fat|ideal-weight|calorie|macro|protein|carb|fat-intake|water-intake|heart-rate|vo2|pace|steps|sleep|workout|exercise|fitness|health|blood-pressure|waist|hip|lean|muscle|weight-loss|weight-gain|nutrition|diet|keto|pregnancy|ovulation|period|due-date/i, "Activity"],
  [/loan|mortgage|interest|compound|amortization|investment|roi|retirement|savings|salary|paycheck|tip|discount|sales-tax|vat|gst|profit|margin|markup|break-even|currency|exchange-rate|inflation|depreciation|net-worth|debt|credit|finance|tax|payment|emi|apr/i, "DollarSign"],
  [/percentage|fraction|ratio|gpa|grade|scientific-calculator|math|algebra|equation|quadratic|statistics|standard-deviation|mean|median|mode|variance|probability|permutation|combination|factorial|prime|fibonacci|gcd|lcm|matrix|vector|derivative|integral|logarithm|exponent|square-root|cube-root|power|modulo|remainder|round|ceil|floor|absolute|sign|random-number|random-dice|random-coin|random-card/i, "Calculator"],
  [/length|height|width|distance|mile|kilometer|meter|feet|inch|yard|centimeter|millimeter|nautical|light-year|parsecs/i, "Ruler"],
  [/weight|mass|pound|kilogram|gram|ounce|ton|stone/i, "Weight"],
  [/temperature|celsius|fahrenheit|kelvin|rankine/i, "Thermometer"],
  [/volume|liter|gallon|cup|pint|quart|tablespoon|teaspoon|milliliter|fluid/i, "Droplet"],
  [/area|acre|hectare|square/i, "Square"],
  [/speed|velocity|mph|kph|knot|mach/i, "Gauge"],
  [/pressure|pascal|bar|psi|atmosphere|torr/i, "Gauge"],
  [/energy|joule|calorie|btu|watt-hour|kilowatt/i, "Zap"],
  [/data-size|byte|bit|kb|mb|gb|tb|storage|file-size/i, "HardDrive"],
  [/angle|degree|radian|gradian|arcmin|arcsec/i, "Compass"],
  [/fuel|mpg|l100|consumption|mileage/i, "Fuel"],
  [/time-zone|timezone|utc|gmt|world-clock/i, "Globe"],
  [/ai-|explainer|generator|assistant|review|diagnos|commit-message|readme-generator|test-case|code-review|error-diagnos|sql-query-generator|code-explainer|regex-generator|docker-compose-generator|cron-explainer/i, "Sparkles"],
  [/duplicate-file|file-finder|file-hash|checksum|file-compare/i, "Copy"],
  [/list-random|shuffle|randomize|picker-wheel|lottery|raffle/i, "Shuffle"],
  [/number-base|binary-convert|octal|hex-convert|decimal-to|base-convert/i, "Binary"],
];

function pickIcon(slug, category) {
  for (const [re, icon] of RULES) {
    if (re.test(slug)) return icon;
  }
  return META[category] || "Wrench";
}

const map = {};
const catDir = join(root, "src/lib/catalog/categories");
for (const f of readdirSync(catDir)) {
  const j = JSON.parse(readFileSync(join(catDir, f), "utf8"));
  for (const t of j.tools) map[t.slug] = pickIcon(t.slug, j.slug);
}

const ocrText = readFileSync(join(root, "src/lib/ai/tools.ts"), "utf8");
for (const m of ocrText.matchAll(/slug:\s*"([^"]+)"/g)) map[m[1]] = "ScanText";

writeFileSync(
  join(root, "src/lib/catalog/tool-icon-map.generated.ts"),
  `/** Auto-generated — run: node scripts/generate-tool-icons.mjs */\nexport const TOOL_ICON_MAP: Record<string, string> = ${JSON.stringify(map, null, 2)};\n`,
);

console.log(`✓ ${Object.keys(map).length} tool icons → src/lib/catalog/tool-icon-map.generated.ts`);
