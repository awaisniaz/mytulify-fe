export type ToolFaqItem = { q: string; a: string };

export type ToolHowTo = {
  title: string;
  steps: string[];
};

export type LocalizedTool = {
  name: string;
  description: string;
  /** Full document title (bypasses the site title template). */
  metaTitle?: string;
  /** Unique meta description for SERP CTR. */
  metaDescription?: string;
  /** Unique supporting paragraphs shown below the tool. */
  about?: string[];
  /** Optional how-to mini-guide under the about section. */
  howTo?: ToolHowTo;
  /** Custom FAQ; when set, replaces the generic FAQ template. */
  faq?: ToolFaqItem[];
  /** Prefer these tools in the related section (`category/slug`). */
  related?: string[];
};

export type LocalizedCategory = { name: string; description: string; tagline: string };

export type ContentStrings = {
  home: string;
  category: string;
  hot: string;
  private: string;
  instant: string;
  aiPowered: string;
  popular: string;
  perDayFree: string;
  comingSoon: string;
  comingSoonTitle: string;
  comingSoonBody: string;
  faqTitle: string;
  aboutTool: string;
  relatedTools: string;
  exploreOther: string;
  toolsCount: string;
  toolsPageTitle: string;
  toolsPageSub: string;
  searchAllTools: string;
  searchTrendingHint: string;
  searchNoResults: string;
  searchResultsOne: string;
  searchResultsMany: string;
  searchClear: string;
  browseTools: string;
  faqIsFreeQ: string;
  faqIsFreeAClient: string;
  faqIsFreeAAi: string;
  faqSafeQ: string;
  faqSafeA: string;
  faqDataQ: string;
  faqDataA: string;
  faqHowQ: string;
  faqHowAClient: string;
  faqHowAAi: string;
  toolAboutClient: string;
  toolAboutAi: string;
  toolMetaTitle: string;
  toolMetaClient: string;
  toolMetaAi: string;
  categoryTitle: string;
  categoryDescription: string;
  aboutPage: {
    label: string;
    title: string;
    intro: string;
    statTools: string;
    statCategories: string;
    statBrowser: string;
    offerTitle: string;
    offerBody: string;
    privacyTitle: string;
    privacyBody: string;
    aiTitle: string;
    aiBody: string;
    pricingTitle: string;
    pricingBody: string;
    cta: string;
  };
};

export type ContentBundle = {
  categories: Record<string, LocalizedCategory>;
  tools: Record<string, LocalizedTool>;
  strings: ContentStrings;
};
