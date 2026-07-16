import type { Messages, RawMessages } from "./types";

function fmt(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function compileMessages(raw: RawMessages): Messages {
  return {
    nav: {
      categories: raw.nav.categories,
      allTools: raw.nav.allTools,
      blog: raw.nav.blog,
      pricing: raw.nav.pricing,
      requestTool: raw.nav.requestTool,
      search: raw.nav.search,
      menu: raw.nav.menu,
      toolsCount: (n) => fmt(raw.nav.toolsCount, { n }),
    },
    auth: { ...raw.auth },
    home: {
      explore: raw.home.explore,
      pickCategory: raw.home.pickCategory,
      pickCategorySub: (n) => fmt(raw.home.pickCategorySub, { n }),
      seeAll: raw.home.seeAll,
      trending: raw.home.trending,
      trendingTitle: raw.home.trendingTitle,
      valuePrivate: raw.home.valuePrivate,
      valuePrivateDesc: raw.home.valuePrivateDesc,
      valueInstant: raw.home.valueInstant,
      valueInstantDesc: raw.home.valueInstantDesc,
      valueOnline: raw.home.valueOnline,
      valueOnlineDesc: raw.home.valueOnlineDesc,
      ctaTitle: raw.home.ctaTitle,
      browseAll: raw.home.browseAll,
      searchAll: raw.home.searchAll,
      heroEverything: raw.home.heroEverything,
      heroYouDo: raw.home.heroYouDo,
      searchPlaceholder: (n) => fmt(raw.home.searchPlaceholder, { n }),
      go: raw.home.go,
      allToolsArrow: raw.home.allToolsArrow,
      toolsInCategory: (n) => fmt(raw.home.toolsInCategory, { n }),
    },
    footer: {
      allTools: raw.footer.allTools,
      blog: raw.footer.blog,
      pricing: raw.footer.pricing,
      requestTool: raw.footer.requestTool,
      about: raw.footer.about,
      privacy: raw.footer.privacy,
      copyright: (year, name) => fmt(raw.footer.copyright, { year, name }),
    },
    notFound: { ...raw.notFound },
    categories: { ...raw.categories },
    copy: {
      tagline: (n) => fmt(raw.copy.tagline, { n }),
      taglineWithTier: (n) => fmt(raw.copy.taglineWithTier, { n }),
      siteDescription: (total, cats, client, aiLimit) =>
        fmt(raw.copy.siteDescription, { total, cats, client, aiLimit }),
      heroBadge: (n) => fmt(raw.copy.heroBadge, { n }),
      heroTitleLead: raw.copy.heroTitleLead,
      heroSubtitle: (client, aiLimit) => fmt(raw.copy.heroSubtitle, { client, aiLimit }),
      footerNote: (client) => fmt(raw.copy.footerNote, { client }),
      homeValueFreeTitle: raw.copy.homeValueFreeTitle,
      homeValueFreeDesc: (client, aiLimit) => fmt(raw.copy.homeValueFreeDesc, { client, aiLimit }),
      homeCtaSubtitle: (client) => fmt(raw.copy.homeCtaSubtitle, { client }),
    },
  };
}
