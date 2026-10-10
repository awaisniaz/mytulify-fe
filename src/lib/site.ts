import { messaging } from "./messaging";
import { SITE_URL } from "./env";

export const site = {
  name: "Calculator Bazaar",
  tagline: messaging.tagline,
  description: messaging.siteDescription,
  url: SITE_URL,
  locale: "en_US",
  /** Add the Calculator Bazaar account here after its handle is confirmed. */
  twitter: "",
  supportEmail: "support@mytulify.com",
  /** Inbox for /request-tool submissions (Next.js API → SMTP). */
  requestNotifyEmail: "mytulify@gmail.com",
  keywords: [
    "free online calculators",
    "financial calculators",
    "health calculators",
    "home improvement calculators",
    "loan calculator",
    "mortgage calculator",
    "BMI calculator",
    "percentage calculator",
  ],
};
