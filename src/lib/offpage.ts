import { TOTAL_CATEGORIES, TOTAL_TOOLS, TOTAL_BROWSER_TOOLS } from "./catalog";
import { site } from "./site";

/** Off-page SEO: press kit, entity signals, directory submissions. */
export const offpage = {
  legalName: site.name,
  tagline: site.tagline,
  description: site.description,
  url: site.url,
  logo: `${site.url}/logo.svg`,
  ogImage: `${site.url}/og-share.png`,
  email: site.supportEmail,
  twitter: site.twitter,
  twitterUrl: site.twitter ? `https://twitter.com/${site.twitter.replace("@", "")}` : "",
  founded: "2024",
  stats: {
    tools: TOTAL_TOOLS,
    categories: TOTAL_CATEGORIES,
    browserTools: TOTAL_BROWSER_TOOLS,
  },
  sameAs: site.twitter ? [`https://twitter.com/${site.twitter.replace("@", "")}`] : [],
  boilerplate: {
    short: `${site.name} brings together ${TOTAL_TOOLS}+ free online calculators for money, health, school, home projects, and everyday decisions.`,
    medium: `${site.name} offers ${TOTAL_TOOLS}+ free calculators across ${TOTAL_CATEGORIES} useful collections. Enter your numbers to explore financial, health, school, home, and trade estimates in your browser. No account required.`,
    long: `${site.name} (${site.url}) is a free collection of ${TOTAL_TOOLS}+ online calculators. It helps people estimate costs, compare options, plan projects, and answer everyday number questions with focused browser-based tools.`,
  },
  anchorTextSuggestions: [
    "free online calculators",
    "Calculator Bazaar",
    "financial calculators",
    "home project calculators",
    "health calculators",
  ],
} as const;

export const directoryTargets = [
  { name: "Product Hunt", url: "https://www.producthunt.com/posts/new", note: "Launch when you have 3–5 flagship tools ready" },
  { name: "AlternativeTo", url: "https://alternativeto.net/manage-item/", note: "Sign in, then suggest the app vs SmallPDF, iLovePDF, TinyPNG" },
  { name: "SaaS Hub", url: "https://www.saashub.com/submit", note: "Free tools category" },
  { name: "Toolify.ai", url: "https://www.toolify.ai/submit", note: "AI + utility tools directory" },
  { name: "Futurepedia", url: "https://www.futurepedia.io/contact", note: "AI tools only — public submit form was removed; request a listing here" },
  { name: "Indie Hackers", url: "https://www.indiehackers.com/new-post", note: "Build-in-public launch post (sign in required)" },
  { name: "Reddit r/SideProject", url: "https://www.reddit.com/r/SideProject/submit", note: "Value-first demo, not spam" },
  { name: "Reddit r/webdev", url: "https://www.reddit.com/r/webdev/submit", note: "Highlight open dev tools / SEO suite" },
  { name: "Bing Webmaster Tools", url: "https://www.bing.com/webmasters", note: "Verify + IndexNow key" },
] as const;
