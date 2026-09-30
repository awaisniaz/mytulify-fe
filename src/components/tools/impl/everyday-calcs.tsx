"use client";

import * as React from "react";
import { Input, Select } from "@/components/ui/primitives";
import { CopyResult, Field, Notice, Stat } from "@/components/tools/shared";

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }) : "—";
const fmt = (n: number, d = 2) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "—");

function monthlyPayment(principal: number, annualPct: number, months: number) {
  if (months <= 0) return 0;
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

function payoff(principal: number, annualPct: number, payment: number) {
  const r = annualPct / 100 / 12;
  let bal = principal;
  let interest = 0;
  let months = 0;
  while (bal > 0.01 && months < 1200) {
    const int = bal * r;
    if (payment <= int) return { months: Infinity, interest: Infinity, leftover: bal };
    const prin = Math.min(bal, payment - int);
    interest += int;
    bal -= prin;
    months += 1;
  }
  return { months, interest, leftover: bal };
}

/* ------------------------------ Mortgage PITI ------------------------------ */
export function MortgageCalculator() {
  const [price, setPrice] = React.useState("400000");
  const [downMode, setDownMode] = React.useState<"amount" | "percent">("percent");
  const [down, setDown] = React.useState("20");
  const [rate, setRate] = React.useState("6.5");
  const [years, setYears] = React.useState("30");
  const [tax, setTax] = React.useState("4800");
  const [ins, setIns] = React.useState("1800");
  const [hoa, setHoa] = React.useState("0");
  const [pmiRate, setPmiRate] = React.useState("0.5");
  const [extra, setExtra] = React.useState("0");

  const home = num(price);
  const downAmt = downMode === "percent" ? home * (num(down) / 100) : num(down);
  const loan = Math.max(0, home - downAmt);
  const downPct = home > 0 ? (downAmt / home) * 100 : 0;
  const months = Math.max(1, Math.round(num(years) * 12));
  const pi = monthlyPayment(loan, num(rate), months);
  const pmi = downPct + 0.001 < 20 ? (loan * (num(pmiRate) / 100)) / 12 : 0;
  const housing = pi + num(tax) / 12 + num(ins) / 12 + num(hoa) + pmi;
  const base = payoff(loan, num(rate), pi);
  const withExtra = payoff(loan, num(rate), pi + num(extra));
  const pi15 = monthlyPayment(loan, num(rate), 180);
  const pi30 = monthlyPayment(loan, num(rate), 360);
  const cost15 = pi15 * 180;
  const cost30 = pi30 * 360;

  const yearsOut: { year: number; principal: number; interest: number; balance: number }[] = [];
  {
    let bal = loan;
    const r = num(rate) / 100 / 12;
    const pay = pi + num(extra);
    let yp = 0;
    let yi = 0;
    for (let m = 1; m <= Math.min(withExtra.months === Infinity ? months : withExtra.months, 600) && bal > 0.5; m++) {
      const interest = bal * r;
      const principal = Math.min(bal, Math.max(0, pay - interest));
      bal = Math.max(0, bal - principal);
      yp += principal;
      yi += interest;
      if (m % 12 === 0 || bal <= 0.5) {
        yearsOut.push({ year: Math.ceil(m / 12), principal: yp, interest: yi, balance: bal });
        yp = 0;
        yi = 0;
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Home price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Down payment as">
          <Select value={downMode} onChange={(e) => setDownMode(e.target.value as "amount" | "percent")}>
            <option value="percent">Percent of price</option>
            <option value="amount">Dollar amount</option>
          </Select>
        </Field>
        <Field label={downMode === "percent" ? "Down payment %" : "Down payment $"}>
          <Input type="number" value={down} onChange={(e) => setDown(e.target.value)} />
        </Field>
        <Field label="Interest rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Term (years)"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
        <Field label="Extra principal / month"><Input type="number" value={extra} onChange={(e) => setExtra(e.target.value)} /></Field>
        <Field label="Property tax / year"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
        <Field label="Home insurance / year"><Input type="number" value={ins} onChange={(e) => setIns(e.target.value)} /></Field>
        <Field label="HOA / month"><Input type="number" value={hoa} onChange={(e) => setHoa(e.target.value)} /></Field>
        <Field label="PMI rate % / year" hint="Applied only when down payment is under 20%">
          <Input type="number" value={pmiRate} onChange={(e) => setPmiRate(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Loan amount" value={money(loan)} />
        <Stat label="Principal & interest" value={money(pi)} />
        <Stat label="Full monthly (PITI)" value={money(housing)} />
        <Stat label="PMI / month" value={money(pmi)} />
        <Stat label="Interest, no extra" value={money(base.interest)} />
        <Stat label="Payoff with extra" value={withExtra.months === Infinity ? "Payment too low" : `${withExtra.months} mo`} />
        <Stat label="Interest saved" value={withExtra.months === Infinity ? "—" : money(base.interest - withExtra.interest)} />
        <Stat label="Down payment" value={`${money(downAmt)} (${fmt(downPct, 1)}%)`} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Same loan</th>
              <th className="px-3 py-2 text-right">15-year</th>
              <th className="px-3 py-2 text-right">30-year</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border"><td className="px-3 py-1.5">Monthly P&I</td><td className="px-3 py-1.5 text-right">{money(pi15)}</td><td className="px-3 py-1.5 text-right">{money(pi30)}</td></tr>
            <tr className="border-t border-border"><td className="px-3 py-1.5">Total paid</td><td className="px-3 py-1.5 text-right">{money(cost15)}</td><td className="px-3 py-1.5 text-right">{money(cost30)}</td></tr>
            <tr className="border-t border-border"><td className="px-3 py-1.5">Total interest</td><td className="px-3 py-1.5 text-right">{money(cost15 - loan)}</td><td className="px-3 py-1.5 text-right">{money(cost30 - loan)}</td></tr>
          </tbody>
        </table>
      </div>
      <Notice tone="info">
        Monthly P&I uses M = P × [r(1+r)^n] / [(1+r)^n − 1]. Taxes, insurance, HOA, and PMI are added on top. PMI drops to $0 at 20% down. This is an estimate, not a loan offer.
      </Notice>
      {yearsOut.length > 0 && (
        <div className="max-h-72 overflow-auto rounded-xl border border-border text-sm">
          <table className="w-full">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Year</th>
                <th className="px-3 py-2 text-right">Principal</th>
                <th className="px-3 py-2 text-right">Interest</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {yearsOut.map((row) => (
                <tr key={row.year} className="border-t border-border">
                  <td className="px-3 py-1.5">{row.year}</td>
                  <td className="px-3 py-1.5 text-right">{money(row.principal)}</td>
                  <td className="px-3 py-1.5 text-right">{money(row.interest)}</td>
                  <td className="px-3 py-1.5 text-right">{money(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CopyResult
        filename="mortgage-estimate.txt"
        rows={[
          ["Home price", money(home)],
          ["Loan", money(loan)],
          ["P&I", money(pi)],
          ["Full monthly", money(housing)],
          ["PMI", money(pmi)],
          ["15-year P&I", money(pi15)],
          ["30-year P&I", money(pi30)],
        ]}
      />
    </div>
  );
}

/* ------------------------------ Concrete ----------------------------------- */
export function ConcreteCalculator() {
  const [shape, setShape] = React.useState<"slab" | "column">("slab");
  const [length, setLength] = React.useState("20");
  const [width, setWidth] = React.useState("10");
  const [thick, setThick] = React.useState("4");
  const [diameter, setDiameter] = React.useState("12");
  const [height, setHeight] = React.useState("8");
  const [waste, setWaste] = React.useState("10");
  const [bag, setBag] = React.useState("0.6");
  const [price, setPrice] = React.useState("6");

  const cuFt =
    shape === "slab"
      ? num(length) * num(width) * (num(thick) / 12)
      : Math.PI * Math.pow(num(diameter) / 12 / 2, 2) * num(height);
  const withWaste = cuFt * (1 + num(waste) / 100);
  const yards = withWaste / 27;
  const meters = withWaste * 0.0283168;
  const bags = bag === "0" ? 0 : Math.ceil(withWaste / num(bag));
  const cost = bags * num(price);

  return (
    <div className="space-y-4">
      <Field label="Shape">
        <Select value={shape} onChange={(e) => setShape(e.target.value as "slab" | "column")}>
          <option value="slab">Rectangular slab or footing</option>
          <option value="column">Round column or pier</option>
        </Select>
      </Field>
      {shape === "slab" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
          <Field label="Width (ft)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
          <Field label="Thickness (in)"><Input type="number" value={thick} onChange={(e) => setThick(e.target.value)} /></Field>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Diameter (in)"><Input type="number" value={diameter} onChange={(e) => setDiameter(e.target.value)} /></Field>
          <Field label="Height (ft)"><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Waste %"><Input type="number" value={waste} onChange={(e) => setWaste(e.target.value)} /></Field>
        <Field label="Bag yield (cu ft)">
          <Select value={bag} onChange={(e) => setBag(e.target.value)}>
            <option value="0.45">60 lb bag ≈ 0.45 cu ft</option>
            <option value="0.6">80 lb bag ≈ 0.60 cu ft</option>
            <option value="1">1 cu ft bag</option>
          </Select>
        </Field>
        <Field label="Price per bag"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Net volume" value={`${fmt(cuFt, 2)} cu ft`} />
        <Stat label="With waste" value={`${fmt(withWaste, 2)} cu ft`} />
        <Stat label="Cubic yards" value={fmt(yards, 2)} />
        <Stat label="Cubic meters" value={fmt(meters, 2)} />
        <Stat label="Bags" value={fmt(bags, 0)} />
        <Stat label="Material cost" value={money(cost)} />
      </div>
      <Notice tone="info">Order a little extra for spillage and uneven grade. Ready-mix is usually sold by the cubic yard; bags are for small pours.</Notice>
      <CopyResult filename="concrete.txt" rows={[["Cubic yards", fmt(yards, 2)], ["Bags", fmt(bags, 0)], ["Cost", money(cost)]]} />
    </div>
  );
}

/* ------------------------------ Paint -------------------------------------- */
export function PaintCalculator() {
  const [length, setLength] = React.useState("14");
  const [width, setWidth] = React.useState("12");
  const [height, setHeight] = React.useState("8");
  const [doors, setDoors] = React.useState("2");
  const [windows, setWindows] = React.useState("3");
  const [ceiling, setCeiling] = React.useState(true);
  const [coats, setCoats] = React.useState("2");
  const [coverage, setCoverage] = React.useState("350");
  const [price, setPrice] = React.useState("45");

  const walls = 2 * (num(length) + num(width)) * num(height);
  const openings = num(doors) * 21 + num(windows) * 15;
  const ceil = ceiling ? num(length) * num(width) : 0;
  const area = Math.max(0, walls - openings + ceil);
  const gallons = (area * num(coats)) / Math.max(1, num(coverage));
  const cans = Math.ceil(gallons * 4) / 4;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Room length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Room width (ft)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Wall height (ft)"><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        <Field label="Doors"><Input type="number" value={doors} onChange={(e) => setDoors(e.target.value)} /></Field>
        <Field label="Windows"><Input type="number" value={windows} onChange={(e) => setWindows(e.target.value)} /></Field>
        <Field label="Coats"><Input type="number" value={coats} onChange={(e) => setCoats(e.target.value)} /></Field>
        <Field label="Coverage (sq ft / gallon)"><Input type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} /></Field>
        <Field label="Price per gallon"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={ceiling} onChange={(e) => setCeiling(e.target.checked)} /> Include ceiling
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Paintable area" value={`${fmt(area, 0)} sq ft`} />
        <Stat label="Gallons (exact)" value={fmt(gallons, 2)} />
        <Stat label="Buy (rounded up ¼ gal)" value={fmt(cans, 2)} />
        <Stat label="Paint cost" value={money(cans * num(price))} />
      </div>
      <Notice tone="info">Doors count as 21 sq ft and windows as 15 sq ft. Porous drywall and dark colors need the higher coat count.</Notice>
      <CopyResult filename="paint.txt" rows={[["Area sq ft", fmt(area, 0)], ["Gallons to buy", fmt(cans, 2)], ["Cost", money(cans * num(price))]]} />
    </div>
  );
}

/* ------------------------------ Gravel ------------------------------------- */
export function GravelCalculator() {
  const [length, setLength] = React.useState("20");
  const [width, setWidth] = React.useState("10");
  const [depth, setDepth] = React.useState("3");
  const [waste, setWaste] = React.useState("10");
  const [tonsPerYard, setTons] = React.useState("1.4");
  const [price, setPrice] = React.useState("50");

  const yards = (num(length) * num(width) * (num(depth) / 12) / 27) * (1 + num(waste) / 100);
  const tons = yards * num(tonsPerYard);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Width (ft)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Depth (in)"><Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} /></Field>
        <Field label="Waste / compaction %"><Input type="number" value={waste} onChange={(e) => setWaste(e.target.value)} /></Field>
        <Field label="Tons per cubic yard" hint="Gravel ≈ 1.4, sand ≈ 1.3, mulch ≈ 0.4">
          <Input type="number" value={tonsPerYard} onChange={(e) => setTons(e.target.value)} />
        </Field>
        <Field label="Price per ton"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Cubic yards" value={fmt(yards, 2)} />
        <Stat label="Tons" value={fmt(tons, 2)} />
        <Stat label="Material cost" value={money(tons * num(price))} />
      </div>
      <CopyResult filename="gravel.txt" rows={[["Yards", fmt(yards, 2)], ["Tons", fmt(tons, 2)], ["Cost", money(tons * num(price))]]} />
    </div>
  );
}

/* ------------------------------ Square footage ---------------------------- */
export function SquareFootageCalculator() {
  const [shape, setShape] = React.useState<"rect" | "circle" | "triangle" | "trap">("rect");
  const [a, setA] = React.useState("20");
  const [b, setB] = React.useState("12");
  const [height, setHeight] = React.useState("8");
  const sq =
    shape === "rect" ? num(a) * num(b)
    : shape === "circle" ? Math.PI * num(a) * num(a)
    : shape === "triangle" ? (num(a) * num(b)) / 2
    : ((num(a) + num(b)) / 2) * num(height);

  return (
    <div className="space-y-4">
      <Field label="Shape">
        <Select value={shape} onChange={(e) => setShape(e.target.value as typeof shape)}>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="triangle">Triangle</option>
          <option value="trap">Trapezoid</option>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={shape === "circle" ? "Radius (ft)" : shape === "trap" ? "Base A (ft)" : "Length or base (ft)"}>
          <Input type="number" value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        {shape !== "circle" && (
          <Field label={shape === "trap" ? "Base B (ft)" : "Width or height (ft)"}>
            <Input type="number" value={b} onChange={(e) => setB(e.target.value)} />
          </Field>
        )}
        {shape === "trap" && (
          <Field label="Height between bases (ft)"><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Square feet" value={fmt(sq, 2)} />
        <Stat label="Square meters" value={fmt(sq * 0.092903, 2)} />
      </div>
      <CopyResult filename="area.txt" rows={[["Square feet", fmt(sq, 2)], ["Square meters", fmt(sq * 0.092903, 2)]]} />
    </div>
  );
}

/* ------------------------------ Fuel cost ---------------------------------- */
export function FuelCostCalculator() {
  const [miles, setMiles] = React.useState("240");
  const [mpg, setMpg] = React.useState("28");
  const [price, setPrice] = React.useState("3.49");
  const [people, setPeople] = React.useState("1");
  const [mpg2, setMpg2] = React.useState("40");
  const gallons = num(mpg) > 0 ? num(miles) / num(mpg) : 0;
  const cost = gallons * num(price);
  const gallons2 = num(mpg2) > 0 ? num(miles) / num(mpg2) : 0;
  const cost2 = gallons2 * num(price);
  const split = Math.max(1, num(people));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Trip distance (miles)"><Input type="number" value={miles} onChange={(e) => setMiles(e.target.value)} /></Field>
        <Field label="Your MPG"><Input type="number" value={mpg} onChange={(e) => setMpg(e.target.value)} /></Field>
        <Field label="Compare MPG"><Input type="number" value={mpg2} onChange={(e) => setMpg2(e.target.value)} /></Field>
        <Field label="Price per gallon"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Split between"><Input type="number" value={people} onChange={(e) => setPeople(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Gallons" value={fmt(gallons, 2)} />
        <Stat label="Trip cost" value={money(cost)} />
        <Stat label="Cost per person" value={money(cost / split)} />
        <Stat label="Saved vs compare car" value={money(cost - cost2)} />
      </div>
      <Notice tone="info">Liters per 100 km convert as MPG ≈ 235.215 / (L/100 km). Highway and city MPG should be averaged for a mixed trip.</Notice>
      <CopyResult filename="fuel-cost.txt" rows={[["Gallons", fmt(gallons, 2)], ["Trip cost", money(cost)], ["Per person", money(cost / split)]]} />
    </div>
  );
}

/* ------------------------------ Credit card -------------------------------- */
export function CreditCardPayoffCalculator() {
  const [balance, setBalance] = React.useState("4500");
  const [apr, setApr] = React.useState("21.99");
  const [payment, setPayment] = React.useState("150");
  const [extra, setExtra] = React.useState("50");
  const base = payoff(num(balance), num(apr), num(payment));
  const faster = payoff(num(balance), num(apr), num(payment) + num(extra));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Balance"><Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
        <Field label="APR %"><Input type="number" value={apr} onChange={(e) => setApr(e.target.value)} /></Field>
        <Field label="Monthly payment"><Input type="number" value={payment} onChange={(e) => setPayment(e.target.value)} /></Field>
        <Field label="Extra each month"><Input type="number" value={extra} onChange={(e) => setExtra(e.target.value)} /></Field>
      </div>
      {base.months === Infinity && <Notice tone="error">That payment does not cover monthly interest, so the balance never reaches zero.</Notice>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Months at current payment" value={base.months === Infinity ? "—" : fmt(base.months, 0)} />
        <Stat label="Interest at current payment" value={base.months === Infinity ? "—" : money(base.interest)} />
        <Stat label="Months with extra" value={faster.months === Infinity ? "—" : fmt(faster.months, 0)} />
        <Stat label="Interest saved" value={base.months === Infinity || faster.months === Infinity ? "—" : money(base.interest - faster.interest)} />
      </div>
      <CopyResult filename="credit-card-payoff.txt" rows={[["Months", base.months], ["Interest", money(base.interest)], ["Months with extra", faster.months]]} />
    </div>
  );
}

/* ------------------------------ DTI ---------------------------------------- */
export function DebtToIncomeCalculator() {
  const [income, setIncome] = React.useState("6500");
  const [housing, setHousing] = React.useState("1800");
  const [other, setOther] = React.useState("450");
  const gross = num(income);
  const front = gross > 0 ? (num(housing) / gross) * 100 : 0;
  const back = gross > 0 ? ((num(housing) + num(other)) / gross) * 100 : 0;
  const band = back <= 36 ? "Comfortable for many conventional loans" : back <= 43 ? "Common approval range, tighter budget" : "Above typical 43% guideline";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Gross monthly income"><Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} /></Field>
        <Field label="Housing payment (PITI)"><Input type="number" value={housing} onChange={(e) => setHousing(e.target.value)} /></Field>
        <Field label="Other monthly debts"><Input type="number" value={other} onChange={(e) => setOther(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Front-end DTI" value={`${fmt(front, 1)}%`} />
        <Stat label="Back-end DTI" value={`${fmt(back, 1)}%`} />
        <Stat label="Read" value={band} />
      </div>
      <Notice tone="info">Front-end is housing ÷ gross income. Back-end adds car loans, student loans, and minimum card payments. Lenders still review credit and reserves.</Notice>
      <CopyResult filename="dti.txt" rows={[["Front-end DTI", `${fmt(front, 1)}%`], ["Back-end DTI", `${fmt(back, 1)}%`]]} />
    </div>
  );
}

/* ------------------------------ Affordability ------------------------------ */
export function HomeAffordabilityCalculator() {
  const [income, setIncome] = React.useState("8000");
  const [debts, setDebts] = React.useState("400");
  const [down, setDown] = React.useState("40000");
  const [rate, setRate] = React.useState("6.5");
  const [years, setYears] = React.useState("30");
  const [housingRatio, setHousingRatio] = React.useState("28");
  const [taxInsPct, setTaxIns] = React.useState("1.5");

  const maxHousing = num(income) * (num(housingRatio) / 100);
  const room = Math.max(0, num(income) * 0.36 - num(debts));
  const budget = Math.min(maxHousing, room);
  const months = Math.max(1, num(years) * 12);
  const r = num(rate) / 100 / 12;
  const k = r === 0 ? 1 / months : r / (1 - Math.pow(1 + r, -months));
  const t = (num(taxInsPct) / 100) / 12;
  const financed = (k + t) > 0 ? (budget + num(down) * k) / (k + t) : num(down);
  const cash = t > 0 ? budget / t : num(down);
  const price = financed >= num(down) ? financed : Math.min(num(down), cash);
  const loan = Math.max(0, price - num(down));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Gross monthly income"><Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} /></Field>
        <Field label="Other monthly debts"><Input type="number" value={debts} onChange={(e) => setDebts(e.target.value)} /></Field>
        <Field label="Down payment"><Input type="number" value={down} onChange={(e) => setDown(e.target.value)} /></Field>
        <Field label="Rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Term (years)"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
        <Field label="Housing ratio % of income"><Input type="number" value={housingRatio} onChange={(e) => setHousingRatio(e.target.value)} /></Field>
        <Field label="Tax + insurance % of price / year"><Input type="number" value={taxInsPct} onChange={(e) => setTaxIns(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Monthly housing budget" value={money(budget)} />
        <Stat label="Estimated max price" value={money(price)} />
        <Stat label="Estimated loan" value={money(loan)} />
      </div>
      <Notice tone="info">Uses the lower of your housing-ratio cap and a 36% back-end cap after other debts. It is a planning range, not a pre-approval.</Notice>
      <CopyResult filename="home-affordability.txt" rows={[["Max price", money(price)], ["Loan", money(loan)], ["Monthly budget", money(budget)]]} />
    </div>
  );
}

/* ------------------------------ APR ---------------------------------------- */
export function AprCalculator() {
  const [amount, setAmount] = React.useState("20000");
  const [rate, setRate] = React.useState("7.5");
  const [years, setYears] = React.useState("5");
  const [fees, setFees] = React.useState("600");

  const principal = num(amount);
  const months = Math.max(1, Math.round(num(years) * 12));
  const pay = monthlyPayment(principal, num(rate), months);
  const received = Math.max(1, principal - num(fees));
  let lo = 0;
  let hi = 0.1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const pv = mid === 0 ? pay * months : (pay * (1 - Math.pow(1 + mid, -months))) / mid;
    if (pv > received) lo = mid;
    else hi = mid;
  }
  const apr = ((lo + hi) / 2) * 12 * 100;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Loan amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Interest rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Term (years)"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
        <Field label="Upfront fees"><Input type="number" value={fees} onChange={(e) => setFees(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Monthly payment" value={money(pay)} />
        <Stat label="Amount you receive" value={money(principal - num(fees))} />
        <Stat label="APR" value={`${fmt(apr, 2)}%`} />
      </div>
      <Notice tone="info">APR is the rate that makes the payment stream equal the cash you actually receive after fees. It is higher than the note rate when fees are charged up front.</Notice>
      <CopyResult filename="apr.txt" rows={[["Payment", money(pay)], ["APR", `${fmt(apr, 2)}%`]]} />
    </div>
  );
}
