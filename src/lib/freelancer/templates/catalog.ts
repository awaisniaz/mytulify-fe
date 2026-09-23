import {
  FREELANCE_INDUSTRIES,
  ENGAGEMENT_TYPES,
  assertFifty,
  type FlTemplateMeta,
} from "../industries";

export type ContractTpl = FlTemplateMeta & {
  data: {
    projectTitle: string;
    scope: string;
    amount: string;
    schedule: string;
    revisions: string;
  };
};

export type ProposalTpl = FlTemplateMeta & {
  data: {
    summary: string;
    scope: string;
    timeline: string;
    pricing: string;
    about: string;
  };
};

export type NdaTpl = FlTemplateMeta & {
  data: {
    purpose: string;
    term: string;
    mutual: boolean;
    jurisdiction: string;
  };
};

export type EmailTpl = FlTemplateMeta & {
  data: {
    kind:
      | "cold-pitch"
      | "project-follow-up"
      | "invoice-friendly"
      | "invoice-firm"
      | "invoice-final"
      | "retainer"
      | "thank-you"
      | "scope-change"
      | "kickoff"
      | "availability";
    tone: "friendly" | "professional" | "firm";
    projectName: string;
    invoiceAmount: string;
  };
};

export type OnboardingTpl = FlTemplateMeta & {
  data: {
    business: string;
    includeBudget: boolean;
    includeBrand: boolean;
    extra: string;
    intro: string;
  };
};

export type ChangeOrderTpl = FlTemplateMeta & {
  data: {
    project: string;
    originalRef: string;
    work: string;
    cost: string;
    days: string;
  };
};

export type RateTpl = FlTemplateMeta & {
  data: { income: string; expenses: string; daysOff: string; hoursWeek: string; margin: string };
};

export type QuoteTpl = FlTemplateMeta & {
  data: { hours: string; rate: string; expenses: string; margin: string };
};

export type LateFeeTpl = FlTemplateMeta & {
  data: { amount: string; type: "flat" | "pct"; rate: string; daysOverdue: number };
};

export type BreakEvenTpl = FlTemplateMeta & {
  data: { fixed: string; price: string; variable: string; mode: "project" | "hour" };
};

export type TaxTpl = FlTemplateMeta & {
  data: { region: "us" | "pk"; income: string };
};

export type EstimatorTpl = FlTemplateMeta & {
  data: {
    projectName: string;
    hourlyRate: string;
    contingencyPct: string;
    marginPct: string;
    tasks: { phase: string; name: string; hours: string }[];
  };
};

function scopeFor(industry: string, engagement: string): string {
  const base = `Provide professional ${industry.toLowerCase()} services as described in the project brief and mutually agreed deliverables.`;
  if (engagement.includes("retainer")) {
    return `${base}\n\nIncluded (monthly retainer): agreed hours/deliverables per month, async updates, and priority support within business hours.\nExcluded: unused hours rollover (unless written), major new product launches, third-party licenses, and out-of-scope change requests without a change order.`;
  }
  return `${base}\n\nIncluded: discovery, delivery of scoped assets/features, up to the agreed revision rounds, and final handoff.\nExcluded: unlimited revisions, hosting/software subscriptions, paid ads spend, and work outside the written scope.`;
}

export const CONTRACT_TEMPLATES_50: ContractTpl[] = assertFifty(
  FREELANCE_INDUSTRIES.flatMap((ind) =>
    ENGAGEMENT_TYPES.map((eng) => ({
      id: `contract-${ind.id}-${eng.id}`,
      name: `${ind.label} — ${eng.label}`,
      category: ind.label,
      blurb: `${eng.label} agreement for ${ind.label.toLowerCase()} freelancers.`,
      data: {
        projectTitle: `${ind.label} ${eng.label} Agreement`,
        scope: scopeFor(ind.label, eng.label),
        amount: eng.id === "retainer" ? String(Math.round(Number(ind.amount) * 0.45)) : ind.amount,
        schedule: eng.schedule,
        revisions: eng.revisions,
      },
    })),
  ),
  "contracts",
);

export const PROPOSAL_TEMPLATES_50: ProposalTpl[] = assertFifty(
  FREELANCE_INDUSTRIES.flatMap((ind) =>
    ENGAGEMENT_TYPES.map((eng) => {
      const total = eng.id === "retainer" ? Math.round(Number(ind.amount) * 0.45) : Number(ind.amount);
      const hours = eng.id === "retainer" ? Math.round(Number(ind.hours) * 0.4) : Number(ind.hours);
      return {
        id: `proposal-${ind.id}-${eng.id}`,
        name: `${ind.label} — ${eng.label} proposal`,
        category: ind.label,
        blurb: `Client-ready proposal for ${ind.label.toLowerCase()}.`,
        data: {
          summary: `We'll help you achieve clearer results in ${ind.label.toLowerCase()} with a focused ${eng.label.toLowerCase()} engagement — scoped deliverables, transparent pricing, and a practical timeline.`,
          scope: scopeFor(ind.label, eng.label),
          timeline:
            eng.id === "retainer"
              ? `Week 1: Kickoff & priorities\nOngoing: Weekly check-ins\nMonth-end: Progress report & next-month plan`
              : `Week 1: Discovery & brief\nWeek 2–3: Core delivery\nWeek 4: Revisions & handoff`,
          pricing:
            eng.id === "retainer"
              ? `Monthly retainer — $${total.toLocaleString()}/mo (~${hours} hrs)\nOverage — $${ind.rate}/hr\nTotal first month — $${total.toLocaleString()}`
              : `Discovery — $${Math.round(total * 0.15).toLocaleString()}\nDelivery — $${Math.round(total * 0.7).toLocaleString()}\nRevisions & handoff — $${Math.round(total * 0.15).toLocaleString()}\nTotal — $${total.toLocaleString()}`,
          about: `Specialist in ${ind.label.toLowerCase()} for growing teams who want clear scope, reliable communication, and measurable outcomes.`,
        },
      };
    }),
  ),
  "proposals",
);

const NDA_JURISDICTIONS = [
  "State of California, USA",
  "State of Delaware, USA",
  "State of New York, USA",
  "England and Wales",
  "Province of Ontario, Canada",
];

export const NDA_TEMPLATES_50: NdaTpl[] = assertFifty(
  FREELANCE_INDUSTRIES.flatMap((ind, i) =>
    ([true, false] as const).map((mutual, j) => ({
      id: `nda-${ind.id}-${mutual ? "mutual" : "oneway"}`,
      name: `${ind.label} — ${mutual ? "Mutual" : "One-way"} NDA`,
      category: ind.label,
      blurb: `${mutual ? "Mutual" : "One-way"} confidentiality for ${ind.label.toLowerCase()} projects.`,
      data: {
        purpose: `Evaluating a potential ${ind.label.toLowerCase()} engagement and protecting non-public business, product, and client information.`,
        term: String(2 + ((i + j) % 3)),
        mutual,
        jurisdiction: NDA_JURISDICTIONS[(i + j) % NDA_JURISDICTIONS.length]!,
      },
    })),
  ),
  "ndas",
);

const EMAIL_KINDS: EmailTpl["data"]["kind"][] = [
  "cold-pitch",
  "project-follow-up",
  "invoice-friendly",
  "invoice-firm",
  "invoice-final",
  "retainer",
  "thank-you",
  "scope-change",
  "kickoff",
  "availability",
];
const EMAIL_TONES: EmailTpl["data"]["tone"][] = ["friendly", "professional", "firm"];

export const EMAIL_TEMPLATES_50: EmailTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const kind = EMAIL_KINDS[i % EMAIL_KINDS.length]!;
    const tone = EMAIL_TONES[i % EMAIL_TONES.length]!;
    const kindLabel = kind.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: `email-${i + 1}-${kind}-${ind.id}`,
      name: `${kindLabel} — ${ind.label} (${tone})`,
      category: kindLabel,
      blurb: `${tone} ${kindLabel.toLowerCase()} for ${ind.label.toLowerCase()}.`,
      data: {
        kind,
        tone,
        projectName: `${ind.label} project`,
        invoiceAmount: String(Math.round(Number(ind.amount) * (0.25 + (i % 4) * 0.15))),
      },
    };
  }),
  "emails",
);

export const ONBOARDING_TEMPLATES_50: OnboardingTpl[] = assertFifty(
  FREELANCE_INDUSTRIES.flatMap((ind) =>
    ENGAGEMENT_TYPES.map((eng) => ({
      id: `onboard-${ind.id}-${eng.id}`,
      name: `${ind.label} — ${eng.label} intake`,
      category: ind.label,
      blurb: `Client intake questionnaire tailored to ${ind.label.toLowerCase()}.`,
      data: {
        business: `${ind.label} Studio`,
        includeBudget: true,
        includeBrand: ["brand", "graphic", "uiux", "web", "social", "video"].includes(ind.id),
        extra: `Anything else we should know about your ${ind.label.toLowerCase()} goals, constraints, or stakeholders?`,
        intro: `Thanks for choosing us for your ${ind.label.toLowerCase()} ${eng.label.toLowerCase()}. Please complete this intake so we can kick off accurately.`,
      },
    })),
  ),
  "onboarding",
);

const CHANGE_WORK = [
  "Add an extra page / screen not in original scope",
  "Expand research phase and deliver a written audit",
  "Integrate a third-party API / plugin",
  "Produce additional revision round beyond allowance",
  "Create social creatives / thumbnail pack",
  "Add CMS training session for client team",
  "Migrate legacy content / assets",
  "Rush delivery (accelerated timeline)",
  "Multilingual / localization pass",
  "Accessibility remediation beyond baseline",
];

export const CHANGE_ORDER_TEMPLATES_50: ChangeOrderTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const work = CHANGE_WORK[i % CHANGE_WORK.length]!;
    const cost = String(Math.round(200 + (i % 10) * 150 + Number(ind.rate)));
    const days = String(2 + (i % 10));
    return {
      id: `co-${i + 1}`,
      name: `${ind.label} — ${work}`,
      category: ind.label,
      blurb: `Change order for out-of-scope ${ind.label.toLowerCase()} work.`,
      data: {
        project: `${ind.label} engagement — Client Co.`,
        originalRef: `Contract / Proposal #P-${100 + i}`,
        work: `${work} for the ${ind.label.toLowerCase()} project (not included in original scope).`,
        cost,
        days,
      },
    };
  }),
  "change-orders",
);

export const RATE_TEMPLATES_50: RateTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const income = String(40000 + (i % 10) * 8000 + Number(ind.rate) * 200);
    const expenses = String(6000 + (i % 8) * 1000);
    const daysOff = String(15 + (i % 6) * 5);
    const hoursWeek = String(15 + (i % 5) * 5);
    const margin = String(10 + (i % 5) * 5);
    return {
      id: `rate-${i + 1}`,
      name: `${ind.label} — $${Number(income).toLocaleString()} goal`,
      category: ind.label,
      blurb: `Rate scenario: ${hoursWeek} billable hrs/week, ${margin}% margin.`,
      data: { income, expenses, daysOff, hoursWeek, margin },
    };
  }),
  "rates",
);

export const QUOTE_TEMPLATES_50: QuoteTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const hours = String(Math.max(8, Math.round(Number(ind.hours) * (0.5 + (i % 5) * 0.2))));
    return {
      id: `quote-${i + 1}`,
      name: `${ind.label} — ${hours}h quote`,
      category: ind.label,
      blurb: `Quick quote at $${ind.rate}/hr with expenses & margin.`,
      data: {
        hours,
        rate: ind.rate,
        expenses: String(50 + (i % 8) * 50),
        margin: String(10 + (i % 4) * 5),
      },
    };
  }),
  "quotes",
);

export const LATE_FEE_TEMPLATES_50: LateFeeTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const type: "flat" | "pct" = i % 2 === 0 ? "pct" : "flat";
    return {
      id: `late-${i + 1}`,
      name: `${ind.label} invoice — ${type === "pct" ? "monthly %" : "flat"} fee`,
      category: ind.label,
      blurb: `Overdue invoice scenario for ${ind.label.toLowerCase()}.`,
      data: {
        amount: String(Math.round(Number(ind.amount) * (0.2 + (i % 5) * 0.15))),
        type,
        rate: type === "pct" ? String(1 + (i % 4) * 0.5) : String(25 + (i % 6) * 25),
        daysOverdue: 7 + (i % 8) * 7,
      },
    };
  }),
  "late-fees",
);

export const BREAK_EVEN_TEMPLATES_50: BreakEvenTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const mode: "project" | "hour" = i % 2 === 0 ? "project" : "hour";
    return {
      id: `be-${i + 1}`,
      name: `${ind.label} — break-even (${mode})`,
      category: ind.label,
      blurb: `Monthly break-even model for ${ind.label.toLowerCase()}.`,
      data: {
        fixed: String(1500 + (i % 10) * 250),
        price: mode === "project" ? ind.amount : ind.rate,
        variable: String(50 + (i % 6) * 25),
        mode,
      },
    };
  }),
  "break-even",
);

export const TAX_TEMPLATES_50: TaxTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const region: "us" | "pk" = i % 2 === 0 ? "us" : "pk";
    const income = String(region === "us" ? 30000 + (i % 15) * 5000 : 800000 + (i % 15) * 200000);
    return {
      id: `tax-${i + 1}`,
      name: `${region.toUpperCase()} — income ${Number(income).toLocaleString()}`,
      category: region === "us" ? "United States" : "Pakistan",
      blurb: `Self-employment / income tax planning scenario (${region.toUpperCase()}).`,
      data: { region, income },
    };
  }),
  "tax",
);

export const ESTIMATOR_TEMPLATES_50: EstimatorTpl[] = assertFifty(
  Array.from({ length: 50 }, (_, i) => {
    const ind = FREELANCE_INDUSTRIES[i % FREELANCE_INDUSTRIES.length]!;
    const h = Math.max(4, Math.round(Number(ind.hours) / 4));
    return {
      id: `est-${i + 1}`,
      name: `${ind.label} — phased estimate`,
      category: ind.label,
      blurb: `Multi-phase estimate for ${ind.label.toLowerCase()} projects.`,
      data: {
        projectName: `${ind.label} delivery`,
        hourlyRate: ind.rate,
        contingencyPct: String(10 + (i % 3) * 5),
        marginPct: String(15 + (i % 3) * 5),
        tasks: [
          { phase: "Discovery", name: "Kickoff & requirements", hours: String(Math.max(2, Math.round(h * 0.4))) },
          { phase: "Delivery", name: `Core ${ind.label.toLowerCase()} work`, hours: String(h) },
          { phase: "Delivery", name: "Internal QA / polish", hours: String(Math.max(2, Math.round(h * 0.35))) },
          { phase: "Handoff", name: "Revisions & documentation", hours: String(Math.max(2, Math.round(h * 0.3))) },
        ],
      },
    };
  }),
  "estimator",
);
