/** String-only message shape (placeholders: {n}, {total}, {cats}, {client}, {aiLimit}, {year}, {name}). */
export type RawMessages = {
  nav: {
    categories: string;
    allTools: string;
    blog: string;
    pricing: string;
    requestTool: string;
    search: string;
    menu: string;
    toolsCount: string;
  };
  auth: {
    signIn: string;
    signOut: string;
    managePro: string;
    upgradePro: string;
  };
  home: {
    explore: string;
    pickCategory: string;
    pickCategorySub: string;
    seeAll: string;
    trending: string;
    trendingTitle: string;
    valuePrivate: string;
    valuePrivateDesc: string;
    valueInstant: string;
    valueInstantDesc: string;
    valueOnline: string;
    valueOnlineDesc: string;
    ctaTitle: string;
    browseAll: string;
    searchAll: string;
    heroEverything: string;
    heroYouDo: string;
    searchPlaceholder: string;
    go: string;
    allToolsArrow: string;
    toolsInCategory: string;
  };
  footer: {
    allTools: string;
    blog: string;
    pricing: string;
    requestTool: string;
    about: string;
    privacy: string;
    copyright: string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
    browseTools: string;
  };
  categories: Record<string, string>;
  copy: {
    tagline: string;
    taglineWithTier: string;
    siteDescription: string;
    heroBadge: string;
    heroTitleLead: string;
    heroSubtitle: string;
    footerNote: string;
    homeValueFreeTitle: string;
    homeValueFreeDesc: string;
    homeCtaSubtitle: string;
  };
};

export type Messages = {
  nav: {
    categories: string;
    allTools: string;
    blog: string;
    pricing: string;
    requestTool: string;
    search: string;
    menu: string;
    toolsCount: (n: number) => string;
  };
  auth: {
    signIn: string;
    signOut: string;
    managePro: string;
    upgradePro: string;
  };
  home: {
    explore: string;
    pickCategory: string;
    pickCategorySub: (n: number) => string;
    seeAll: string;
    trending: string;
    trendingTitle: string;
    valuePrivate: string;
    valuePrivateDesc: string;
    valueInstant: string;
    valueInstantDesc: string;
    valueOnline: string;
    valueOnlineDesc: string;
    ctaTitle: string;
    browseAll: string;
    searchAll: string;
    heroEverything: string;
    heroYouDo: string;
    searchPlaceholder: (n: number) => string;
    go: string;
    allToolsArrow: string;
    toolsInCategory: (n: number) => string;
  };
  footer: {
    allTools: string;
    blog: string;
    pricing: string;
    requestTool: string;
    about: string;
    privacy: string;
    copyright: (year: number, name: string) => string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
    browseTools: string;
  };
  categories: Record<string, string>;
  copy: {
    tagline: (n: number) => string;
    taglineWithTier: (n: number) => string;
    siteDescription: (total: number, cats: number, client: number, aiLimit: number) => string;
    heroBadge: (n: number) => string;
    heroTitleLead: string;
    heroSubtitle: (client: number, aiLimit: number) => string;
    footerNote: (client: number) => string;
    homeValueFreeTitle: string;
    homeValueFreeDesc: (client: number, aiLimit: number) => string;
    homeCtaSubtitle: (client: number) => string;
  };
};
