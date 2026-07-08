import { TOTAL_TOOLS, TOTAL_CATEGORIES } from "./catalog";
import { messaging } from "./messaging";

export const site = {
  name: "Mytulify",
  tagline: messaging.tagline,
  description: messaging.siteDescription,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytulify.com",
  locale: "en_US",
  twitter: "@mytulify",
  supportEmail: "support@mytulify.com",
  keywords: [
    "online tools",
    "free online tools",
    "online tools hub",
    "pdf tools",
    "image tools",
    "text tools",
    "seo tools",
    "developer tools",
    "unit converter",
    "calculator",
  ],
};
