---
title: XIRR vs CAGR — Which Return Rate Fits Your Cash Flows
slug: xirr-vs-cagr
excerpt: Compare XIRR and CAGR — what each measures, when irregular dates matter, and how to calculate both with free tools on Mytulify.
publishedDate: 2026-09-07
updatedDate: 2026-09-07
featuredImage: /og-share.png
author: Mytulify Team
metaDescription: XIRR vs CAGR explained — irregular cash flows vs start-to-end growth, when each metric fits, and how to calculate both free on Mytulify.
relatedToolSlugs:
  - calculators/xirr-calculator
  - calculators/cagr-calculator
  - calculators/roi-calculator
  - calculators/sip-calculator
---

**XIRR** and **CAGR** both produce an annualized percentage — but they answer different questions. CAGR assumes a single beginning value grows into a single ending value over a fixed number of years. XIRR allows many dated deposits and withdrawals and still returns one yearly rate. Mixing them up makes SIP histories look “wrong” next to lumpsum charts.

This article is educational planning content, not investment or tax advice. Definitions and day-count conventions can vary by spreadsheet or statement vendor — verify against your broker when decisions involve real money.

## Snapshot comparison

| Factor | XIRR | CAGR |
|--------|------|------|
| Typical question | What annualized return fits *this timeline of cash flows*? | What steady yearly rate takes *start → end* over N years? |
| Inputs | Many dated amounts (signed) | Beginning value, ending value, years |
| Handles mid-period top-ups / redemptions | Yes | No (unless you rebuild into one start/end) |
| Common use | Real SIP books, portfolios, Excel reconciliations | Fund/index start–end comparisons |
| Planning tool | [XIRR Calculator](/calculators/xirr-calculator) | [CAGR Calculator](/calculators/cagr-calculator) |
| Related idea | NPV = 0 solver | `(end ÷ start)^(1 ÷ years) − 1` |

Use the table as a lens for *your* data — not as a claim that one metric is always “better.”

## When XIRR is the natural starting point

If you are asking *I invested on several dates, maybe withdrew once, and now have a market value — what annualized return is that?* — start with the [XIRR Calculator](/calculators/xirr-calculator).

Practical steps:

1. List every cash flow with its date.
2. Mark investments negative and inflows / ending value positive.
3. Solve for XIRR (adjust the initial guess if needed).
4. Read the annualized rate plus outflow / inflow totals.

Deep dive on inputs and a worked timeline: [XIRR Calculator Guide](/blog/xirr-calculator-guide).

## When CAGR is the natural starting point

If you are asking *This lumpsum (or index level) went from A to B in Y years — what compound annual rate is that?* — use the [CAGR Calculator](/calculators/cagr-calculator). Classic CAGR ignores intermediate cash flows by design.

Typical uses:

- Comparing two funds from the same start and end dates
- Turning a multi-year business metric into an annualized growth rate
- Checking annualized ROI when you already collapsed cost and final value into two points

## Same story, different tools

Suppose you invested 100,000 once and two years later the holding is worth 121,000 with no other cash flows:

- **CAGR** ≈ 10% (clean start → end)
- **XIRR** with −100,000 then +121,000 on those dates is also ≈ 10%

Add a −20,000 top-up six months in, and CAGR no longer has a unique honest start value without inventing one. XIRR still has a well-defined solution for the full dated series.

If you only care about gain relative to total cost and *not* timing, the [ROI Calculator](/calculators/roi-calculator) is simpler — but it will not annualize irregular dates the way XIRR does.

## Quick chooser

| You care about… | Prefer |
|-----------------|--------|
| Irregular SIP / portfolio cash flows | [XIRR Calculator](/calculators/xirr-calculator) |
| Single start → end annualized growth | [CAGR Calculator](/calculators/cagr-calculator) |
| Gain ÷ cost without a timeline | [ROI Calculator](/calculators/roi-calculator) |
| Projecting fixed monthly investments forward | [SIP Calculator](/calculators/sip-calculator) |

## Bottom line

Use **CAGR** when the story truly is one beginning and one ending value. Use **XIRR** when the calendar of money matters. Both belong in a planner’s toolkit — and both run free in your browser on Mytulify.
