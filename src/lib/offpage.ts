import { TOTAL_CATEGORIES, TOTAL_TOOLS, TOTAL_BROWSER_TOOLS } from "./catalog";
import { site } from "./site";

/** Off-page SEO: press kit, entity signals, directory submissions. */
export const offpage = {
  legalName: site.name,
  tagline: site.tagline,
  description: site.description,
  url: site.url,
  logo: `${site.url}/logo.png`,
  ogImage: `${site.url}/og-share.png`,
  email: site.supportEmail,
  twitter: site.twitter,
  twitterUrl: `https://twitter.com/${site.twitter.replace("@", "")}`,
  founded: "2024",
  stats: {
    tools: TOTAL_TOOLS,
    categories: TOTAL_CATEGORIES,
    browserTools: TOTAL_BROWSER_TOOLS,
  },
  sameAs: [`https://twitter.com/${site.twitter.replace("@", "")}`],
  boilerplate: {
    short: `${site.name} is a free online tools hub — ${TOTAL_TOOLS}+ browser-based utilities for PDF, image, text, SEO, developers, and freelancers.`,
    medium: `${site.name} offers ${TOTAL_TOOLS}+ free online tools across ${TOTAL_CATEGORIES} categories. Most tools run entirely in your browser for privacy and speed — PDF editors, image converters, SEO audits, AI writing helpers, and freelancer business tools. No install required.`,
    long: `${site.name} (${site.url}) is a comprehensive free online tools platform built for creators, developers, marketers, and freelancers. With ${TOTAL_TOOLS}+ tools spanning PDF, image, text, SEO, security, calculators, and AI-assisted workflows, Mytulify focuses on privacy-first browser processing, instant results, and zero signup for core features.`,
  },
  anchorTextSuggestions: [
    "free online tools",
    "Mytulify",
    "free PDF tools",
    "free SEO tools",
    "online tools hub",
  ],
} as const;

export const directoryTargets = [
  { name: "Product Hunt", url: "https://www.producthunt.com/posts/new", note: "Launch when you have 3–5 flagship tools ready" },
  { name: "AlternativeTo", url: "https://alternativeto.net/manage/new/", note: "List vs SmallPDF, iLovePDF, TinyPNG" },
  { name: "SaaS Hub", url: "https://www.saashub.com/submit", note: "Free tools category" },
  { name: "Toolify.ai", url: "https://www.toolify.ai/submit", note: "AI + utility tools directory" },
  { name: "Futurepedia", url: "https://www.futurepedia.io/submit-tool", note: "AI tools only" },
  { name: "Indie Hackers", url: "https://www.indiehackers.com/post/new", note: "Build-in-public launch post" },
  { name: "Reddit r/SideProject", url: "https://www.reddit.com/r/SideProject/submit", note: "Value-first demo, not spam" },
  { name: "Reddit r/webdev", url: "https://www.reddit.com/r/webdev/submit", note: "Highlight open dev tools / SEO suite" },
  { name: "Google Search Console", url: "https://search.google.com/search-console", note: "Verify domain + submit sitemap" },
  { name: "Bing Webmaster Tools", url: "https://www.bing.com/webmasters", note: "Verify + IndexNow key" },
] as const;
