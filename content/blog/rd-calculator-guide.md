---
title: RD Calculator Guide — Estimate Recurring Deposit Maturity Before You Save
slug: rd-calculator-guide
excerpt: Learn how a recurring deposit (RD) calculator works, the quarterly compounding formula banks often use, and how to estimate maturity, interest, and total deposits online.
publishedDate: 2026-09-05
updatedDate: 2026-09-05
featuredImage: /og-share.png
author: Mytulify Team
metaDescription: Free RD calculator guide — recurring deposit formula, quarterly compounding vs simple interest, and how to estimate maturity amount and interest online.
relatedToolSlugs:
  - calculators/rd-calculator
  - calculators/fd-calculator
  - calculators/sip-calculator
  - calculators/compound-interest-calculator
---

An **RD calculator** (recurring deposit calculator) answers a practical savings question: if you deposit a fixed amount every month at a stated bank rate for a set tenure, what maturity value and interest should you expect? Banks publish RD rates; the calculator turns those numbers into a clear payout estimate so you can compare tenures before you commit.

## What a recurring deposit is

A recurring deposit is a bank product where you pay a **fixed monthly installment** for a fixed period. Interest is credited according to the product’s rules (often with **quarterly compounding**). At maturity you receive the sum of deposits plus interest. Unlike a [fixed deposit (FD)](/calculators/fd-calculator), you do not put a lump sum up front — you build the corpus month by month.

An online calculator does **not** replace your bank’s official quote. It applies standard RD math so you can sanity-check rate sheets and tenure options.

## The common RD maturity formulas

### Quarterly compounding (typical for bank RDs)

Many bank RD calculators use this closed form:

**M = P × [((1 + i)^n − 1) / (1 − (1 + i)^(−1/3))]**

| Symbol | Meaning |
|--------|---------|
| P | Monthly deposit |
| i | Quarterly rate = annual rate % ÷ 400 (e.g. 7% → 0.0175) |
| n | Number of quarters = tenure in months ÷ 3 |
| M | Maturity amount |

**Total deposited** = P × (months)  
**Interest earned** = M − total deposited  

Because **n** counts whole quarters, tenure should be a multiple of 3 months when you use this formula (for example 12, 24, or 36 months).

### Simple interest RD

Some planning sheets use:

**Interest = P × n(n + 1) / 2 × r / (12 × 100)**

where **n** is the number of months and **r** is the annual rate in percent. Maturity = total deposits + interest. Use this only when the product truly does not compound — or as a rough cross-check.

## Worked example

- Monthly deposit: ₹5,000  
- Rate: 7% per year  
- Tenure: 3 years (36 months → 12 quarters)  
- Method: quarterly compounding  

Total deposited = ₹5,000 × 36 = ₹1,80,000. Maturity is higher than that sum because each installment earns interest for a different length of time. Plug the same inputs into the [RD Calculator](/calculators/rd-calculator) to see maturity and interest instantly in your browser.

## What to check before you open an RD

1. **Cash flow** — Can you sustain the monthly installment for the full tenure?  
2. **Compounding rule** — Confirm whether your bank compounds quarterly or uses another method.  
3. **Premature withdrawal** — Early exit often reduces the rate or adds a penalty.  
4. **Tax** — Interest may be taxable depending on your jurisdiction and product; the calculator does not apply tax.

## Try it free on Mytulify

Use the [RD Calculator](/calculators/rd-calculator) to enter monthly deposit, annual rate, and tenure (years + months). Choose quarterly compounding or simple interest, then compare maturity, interest, and total deposited — private in your browser, no signup.

For lump-sum bank deposits, use the [FD Calculator](/calculators/fd-calculator). For market-linked monthly investing, compare with the [SIP Calculator](/calculators/sip-calculator).
