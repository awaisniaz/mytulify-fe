/** Shared freelance niches used to expand 50 templates per tool. */
export const FREELANCE_INDUSTRIES = [
  { id: "web", label: "Web Design & Development", amount: "4500", hours: "60", rate: "85" },
  { id: "software", label: "Software / App Development", amount: "12000", hours: "120", rate: "110" },
  { id: "mobile", label: "Mobile App Development", amount: "15000", hours: "140", rate: "120" },
  { id: "uiux", label: "UI/UX Design", amount: "3500", hours: "45", rate: "95" },
  { id: "brand", label: "Brand Identity & Logo", amount: "2200", hours: "30", rate: "90" },
  { id: "graphic", label: "Graphic Design", amount: "1800", hours: "28", rate: "75" },
  { id: "writing", label: "Content Writing & Copy", amount: "1500", hours: "25", rate: "70" },
  { id: "seo", label: "SEO & Content Strategy", amount: "2800", hours: "40", rate: "80" },
  { id: "marketing", label: "Digital Marketing", amount: "3200", hours: "40", rate: "85" },
  { id: "social", label: "Social Media Management", amount: "2000", hours: "30", rate: "65" },
  { id: "video", label: "Video Editing & Production", amount: "3500", hours: "40", rate: "90" },
  { id: "photo", label: "Photography", amount: "1600", hours: "20", rate: "100" },
  { id: "voice", label: "Voiceover & Audio", amount: "900", hours: "12", rate: "85" },
  { id: "translation", label: "Translation & Localization", amount: "1200", hours: "20", rate: "65" },
  { id: "consulting", label: "Business Consulting", amount: "5000", hours: "40", rate: "150" },
  { id: "coaching", label: "Coaching & Mentoring", amount: "2500", hours: "20", rate: "125" },
  { id: "accounting", label: "Bookkeeping & Accounting", amount: "1800", hours: "30", rate: "70" },
  { id: "legal", label: "Legal / Paralegal Support", amount: "4000", hours: "35", rate: "130" },
  { id: "data", label: "Data Analysis & BI", amount: "4500", hours: "50", rate: "100" },
  { id: "devops", label: "DevOps & Cloud", amount: "6000", hours: "55", rate: "115" },
  { id: "qa", label: "QA & Testing", amount: "2800", hours: "40", rate: "75" },
  { id: "support", label: "Virtual Assistance", amount: "1400", hours: "40", rate: "40" },
  { id: "ecommerce", label: "E-commerce Setup", amount: "5500", hours: "70", rate: "90" },
  { id: "wordpress", label: "WordPress / CMS", amount: "2500", hours: "35", rate: "75" },
  { id: "ai", label: "AI Automation & Chatbots", amount: "4800", hours: "50", rate: "105" },
] as const;

export const ENGAGEMENT_TYPES = [
  { id: "fixed", label: "Fixed project", schedule: "milestone", revisions: "2" },
  { id: "retainer", label: "Monthly retainer", schedule: "retainer", revisions: "2" },
] as const;

export type FreelanceIndustry = (typeof FREELANCE_INDUSTRIES)[number];

export type FlTemplateMeta = {
  id: string;
  name: string;
  category: string;
  blurb: string;
};

export function assertFifty<T>(list: T[], label: string): T[] {
  if (list.length !== 50) {
    throw new Error(`${label}: expected 50 templates, got ${list.length}`);
  }
  return list;
}
