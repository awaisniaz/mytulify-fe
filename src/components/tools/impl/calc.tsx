"use client";

import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Field, Stat, Notice, CopyResult } from "@/components/tools/shared";

const n = (v: string | number) => (typeof v === "number" ? v : parseFloat(v));
const fmt = (x: number, d = 2) => (isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : "—");

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

/* ------------------------------ BMI ---------------------------------------- */
export function BmiCalculator() {
  const [unit, setUnit] = React.useState<"metric" | "imperial">("metric");
  const [w, setW] = React.useState("70");
  const [h, setH] = React.useState("175");
  const kg = unit === "metric" ? n(w) : n(w) / 2.20462;
  const cm = unit === "metric" ? n(h) : n(h) * 2.54;
  const bmi = kg / Math.pow(cm / 100, 2);
  const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const healthyMin = 18.5 * Math.pow(cm / 100, 2);
  const healthyMax = 24.9 * Math.pow(cm / 100, 2);
  const prime = kg / Math.pow(cm / 100, 3);
  return (
    <div className="space-y-4">
      <Select value={unit} onChange={(e) => setUnit(e.target.value as "metric")} className="max-w-48">
        <option value="metric">Metric (kg, cm)</option>
        <option value="imperial">Imperial (lb, in)</option>
      </Select>
      <Row>
        <Field label={`Weight (${unit === "metric" ? "kg" : "lb"})`}><Input type="number" value={w} onChange={(e) => setW(e.target.value)} /></Field>
        <Field label={`Height (${unit === "metric" ? "cm" : "in"})`}><Input type="number" value={h} onChange={(e) => setH(e.target.value)} /></Field>
      </Row>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="BMI" value={fmt(bmi, 1)} />
        <Stat label="Category" value={cat} />
        <Stat label="Ponderal index" value={fmt(prime, 2)} />
        <Stat label="Healthy kg" value={`${fmt(healthyMin, 1)}–${fmt(healthyMax, 1)}`} />
      </div>
      <CopyResult rows={[["BMI", fmt(bmi, 1)], ["Category", cat], ["Healthy weight (kg)", `${fmt(healthyMin, 1)}–${fmt(healthyMax, 1)}`]]} />
    </div>
  );
}

/* ------------------------------ Percentage --------------------------------- */
export function PercentageCalculator() {
  const [a, setA] = React.useState("15");
  const [b, setB] = React.useState("200");
  const of = (n(a) / 100) * n(b);
  const isWhat = (n(a) / n(b)) * 100;
  const change = ((n(b) - n(a)) / n(a)) * 100;
  const increase = n(b) * (1 + n(a) / 100);
  const decrease = n(b) * (1 - n(a) / 100);
  const original = n(a) / (n(b) / 100);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="X"><Input type="number" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Y"><Input type="number" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={`${a}% of ${b}`} value={fmt(of)} />
        <Stat label={`${a} is what % of ${b}`} value={`${fmt(isWhat)}%`} />
        <Stat label={`% change ${a}→${b}`} value={`${fmt(change)}%`} />
        <Stat label={`${b} + ${a}%`} value={fmt(increase)} />
        <Stat label={`${b} − ${a}%`} value={fmt(decrease)} />
        <Stat label={`${a} is ${b}% of`} value={fmt(original)} />
      </div>
      <CopyResult rows={[
        [`${a}% of ${b}`, fmt(of)],
        [`${a} is % of ${b}`, `${fmt(isWhat)}%`],
        ["Percent change", `${fmt(change)}%`],
      ]} />
    </div>
  );
}

/* ------------------------------ Age ---------------------------------------- */
export function AgeCalculator() {
  const [dob, setDob] = React.useState("2000-01-01");
  const [asOf, setAsOf] = React.useState(new Date().toISOString().slice(0, 10));
  const birth = new Date(dob);
  const now = new Date(asOf);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  const nextDays = Math.ceil((next.getTime() - now.getTime()) / 86400000);
  const weekday = birth.toLocaleDateString(undefined, { weekday: "long" });
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Date of birth"><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
        <Field label="As of"><Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} /></Field>
      </Row>
      <div className="grid grid-cols-3 gap-3"><Stat label="Years" value={years} /><Stat label="Months" value={months} /><Stat label="Days" value={days} /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total days" value={fmt(totalDays, 0)} />
        <Stat label="Total weeks" value={fmt(totalDays / 7, 0)} />
        <Stat label="Born on" value={weekday} />
        <Stat label="Next birthday" value={`${nextDays}d`} />
      </div>
      <CopyResult rows={[["Age", `${years}y ${months}m ${days}d`], ["Born on", weekday], ["Next birthday in", `${nextDays} days`]]} />
    </div>
  );
}

/* ------------------------------ Loan / Mortgage ---------------------------- */
function amortize(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const m = years * 12;
  const pay = r === 0 ? principal / m : (principal * r) / (1 - Math.pow(1 + r, -m));
  return { pay, total: pay * m, interest: pay * m - principal };
}
export function LoanCalculator({ mortgage }: { mortgage?: boolean }) {
  const [amt, setAmt] = React.useState(mortgage ? "300000" : "20000");
  const [rate, setRate] = React.useState(mortgage ? "6.5" : "8");
  const [yrs, setYrs] = React.useState(mortgage ? "30" : "5");
  const [extra, setExtra] = React.useState("0");
  const { pay, total, interest } = amortize(n(amt), n(rate), n(yrs));
  const monthly = pay + n(extra);
  const rows: { mo: number; prin: number; int: number; bal: number }[] = [];
  let bal = n(amt);
  const r = n(rate) / 100 / 12;
  const m = Math.min(360, n(yrs) * 12);
  for (let i = 1; i <= m && bal > 0.01; i++) {
    const interestMo = bal * r;
    const prin = Math.min(bal, monthly - interestMo);
    bal = Math.max(0, bal - prin);
    if (i <= 12 || i === m) rows.push({ mo: i, prin, int: interestMo, bal });
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={mortgage ? "Loan amount" : "Amount"}><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
        <Field label="Interest rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Term (years)"><Input type="number" value={yrs} onChange={(e) => setYrs(e.target.value)} /></Field>
        <Field label="Extra monthly"><Input type="number" value={extra} onChange={(e) => setExtra(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Monthly payment" value={fmt(pay)} />
        <Stat label="Total interest" value={fmt(interest)} />
        <Stat label="Total paid" value={fmt(total)} />
      </div>
      <CopyResult rows={[["Monthly", fmt(pay)], ["Interest", fmt(interest)], ["Total", fmt(total)]]} />
      <div className="overflow-x-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-3 py-2 text-left">Month</th><th className="px-3 py-2 text-right">Principal</th><th className="px-3 py-2 text-right">Interest</th><th className="px-3 py-2 text-right">Balance</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.mo} className="border-t border-border">
                <td className="px-3 py-1.5">{row.mo}</td>
                <td className="px-3 py-1.5 text-right">{fmt(row.prin)}</td>
                <td className="px-3 py-1.5 text-right">{fmt(row.int)}</td>
                <td className="px-3 py-1.5 text-right">{fmt(row.bal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Compound interest -------------------------- */
export { CompoundInterest } from "./finance-calcs";

/* ------------------------------ Tip / Discount / Tax ----------------------- */
export function TipCalculator() {
  const [bill, setBill] = React.useState("50");
  const [pct, setPct] = React.useState("18");
  const [people, setPeople] = React.useState("2");
  const [roundUp, setRoundUp] = React.useState(false);
  const tip = n(bill) * (n(pct) / 100);
  let total = n(bill) + tip;
  let per = total / Math.max(1, n(people));
  if (roundUp) { per = Math.ceil(per); total = per * Math.max(1, n(people)); }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Bill amount"><Input type="number" value={bill} onChange={(e) => setBill(e.target.value)} /></Field>
        <Field label="Tip %"><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        <Field label="Split between"><Input type="number" value={people} onChange={(e) => setPeople(e.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {[10, 15, 18, 20, 25].map((p) => (
          <Button key={p} type="button" size="sm" variant={pct === String(p) ? "primary" : "secondary"} onClick={() => setPct(String(p))}>{p}%</Button>
        ))}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} /> Round up per person</label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Tip" value={fmt(roundUp ? total - n(bill) : tip)} /><Stat label="Total" value={fmt(total)} /><Stat label="Per person" value={fmt(per)} /></div>
      <CopyResult rows={[["Tip", fmt(roundUp ? total - n(bill) : tip)], ["Total", fmt(total)], ["Per person", fmt(per)]]} />
    </div>
  );
}
export function DiscountCalculator() {
  const [price, setPrice] = React.useState("80");
  const [pct, setPct] = React.useState("25");
  const [extra, setExtra] = React.useState("0");
  const save1 = n(price) * (n(pct) / 100);
  const after1 = n(price) - save1;
  const save2 = after1 * (n(extra) / 100);
  const final = after1 - save2;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Original price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Discount %"><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        <Field label="Extra % off"><Input type="number" value={extra} onChange={(e) => setExtra(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="You save" value={fmt(n(price) - final)} />
        <Stat label="Final price" value={fmt(final)} />
        <Stat label="Effective %" value={`${fmt(((n(price) - final) / n(price)) * 100)}%`} />
      </div>
      <CopyResult rows={[["Save", fmt(n(price) - final)], ["Final", fmt(final)]]} />
    </div>
  );
}
export function SalesTaxCalculator() {
  const [price, setPrice] = React.useState("100");
  const [rate, setRate] = React.useState("8.5");
  const [inc, setInc] = React.useState(false);
  const tax = inc ? n(price) - n(price) / (1 + n(rate) / 100) : n(price) * (n(rate) / 100);
  const net = inc ? n(price) - tax : n(price);
  const total = inc ? n(price) : n(price) + tax;
  return (
    <div className="space-y-4">
      <Row>
        <Field label={inc ? "Price (includes tax)" : "Price (pre-tax)"}><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Tax rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
      </Row>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inc} onChange={(e) => setInc(e.target.checked)} /> Amount already includes tax</label>
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Net" value={fmt(net)} /><Stat label="Tax" value={fmt(tax)} /><Stat label="Total" value={fmt(total)} /></div>
      <CopyResult rows={[["Net", fmt(net)], ["Tax", fmt(tax)], ["Total", fmt(total)]]} />
    </div>
  );
}

/* ------------------------------ Body metrics ------------------------------- */
function useBody() {
  const [g, setG] = React.useState<"male" | "female">("male");
  const [age, setAge] = React.useState("30");
  const [w, setW] = React.useState("70");
  const [h, setH] = React.useState("175");
  const bmr = 10 * n(w) + 6.25 * n(h) - 5 * n(age) + (g === "male" ? 5 : -161);
  return { g, setG, age, setAge, w, setW, h, setH, bmr };
}
function BodyInputs({ b }: { b: ReturnType<typeof useBody> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Gender"><Select value={b.g} onChange={(e) => b.setG(e.target.value as "male")}><option value="male">Male</option><option value="female">Female</option></Select></Field>
      <Field label="Age"><Input type="number" value={b.age} onChange={(e) => b.setAge(e.target.value)} /></Field>
      <Field label="Weight (kg)"><Input type="number" value={b.w} onChange={(e) => b.setW(e.target.value)} /></Field>
      <Field label="Height (cm)"><Input type="number" value={b.h} onChange={(e) => b.setH(e.target.value)} /></Field>
    </div>
  );
}
export function BmrCalculator() {
  const b = useBody();
  const harris = b.g === "male"
    ? 88.362 + 13.397 * n(b.w) + 4.799 * n(b.h) - 5.677 * n(b.age)
    : 447.593 + 9.247 * n(b.w) + 3.098 * n(b.h) - 4.330 * n(b.age);
  const katch = 370 + 21.6 * (n(b.w) * 0.8);
  return (
    <div className="space-y-4">
      <BodyInputs b={b} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Mifflin–St Jeor" value={fmt(b.bmr, 0)} />
        <Stat label="Harris–Benedict" value={fmt(harris, 0)} />
        <Stat label="Katch (est. 20% BF)" value={fmt(katch, 0)} />
      </div>
      <CopyResult
        filename="bmr.txt"
        rows={[
          ["Mifflin–St Jeor", fmt(b.bmr, 0)],
          ["Harris–Benedict", fmt(harris, 0)],
          ["Katch (est.)", fmt(katch, 0)],
        ]}
      />
    </div>
  );
}
export function TdeeCalculator() {
  const b = useBody();
  const [act, setAct] = React.useState("1.55");
  const tdee = b.bmr * n(act);
  return (
    <div className="space-y-4">
      <BodyInputs b={b} />
      <Field label="Activity level"><Select value={act} onChange={(e) => setAct(e.target.value)}>
        <option value="1.2">Sedentary (desk)</option><option value="1.375">Light (1–3 days)</option><option value="1.55">Moderate (3–5 days)</option><option value="1.725">Active (6–7 days)</option><option value="1.9">Very active</option>
      </Select></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="BMR" value={fmt(b.bmr, 0)} />
        <Stat label="TDEE" value={fmt(tdee, 0)} />
        <Stat label="Weekly" value={fmt(tdee * 7, 0)} />
      </div>
      <CopyResult rows={[["BMR", fmt(b.bmr, 0)], ["TDEE", fmt(tdee, 0)]]} />
    </div>
  );
}
export function CalorieCalculator() {
  const b = useBody();
  const [act, setAct] = React.useState("1.55");
  const tdee = b.bmr * n(act);
  return (
    <div className="space-y-4">
      <BodyInputs b={b} />
      <Field label="Activity level"><Select value={act} onChange={(e) => setAct(e.target.value)}>
        <option value="1.2">Sedentary</option><option value="1.375">Light</option><option value="1.55">Moderate</option><option value="1.725">Active</option><option value="1.9">Very active</option>
      </Select></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Lose (−500)" value={fmt(tdee - 500, 0)} />
        <Stat label="Maintain" value={fmt(tdee, 0)} />
        <Stat label="Gain (+500)" value={fmt(tdee + 500, 0)} />
        <Stat label="Aggressive (−750)" value={fmt(tdee - 750, 0)} />
      </div>
      <p className="text-xs text-muted">Weekly: lose ~{fmt((tdee - 500) * 7, 0)} · maintain {fmt(tdee * 7, 0)} · gain {fmt((tdee + 500) * 7, 0)} kcal</p>
      <CopyResult
        filename="calorie-targets.txt"
        rows={[
          ["Lose", fmt(tdee - 500, 0)],
          ["Maintain", fmt(tdee, 0)],
          ["Gain", fmt(tdee + 500, 0)],
        ]}
      />
    </div>
  );
}
export function IdealWeight() {
  const [g, setG] = React.useState<"male" | "female">("male");
  const [h, setH] = React.useState("175");
  const inches = n(h) / 2.54;
  const over5ft = Math.max(0, inches - 60);
  const devine = (g === "male" ? 50 : 45.5) + 2.3 * over5ft;
  const robinson = (g === "male" ? 52 : 49) + 1.9 * over5ft;
  const miller = (g === "male" ? 56.2 : 53.1) + 1.41 * over5ft;
  const bmiMin = 18.5 * Math.pow(n(h) / 100, 2);
  const bmiMax = 24.9 * Math.pow(n(h) / 100, 2);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Gender"><Select value={g} onChange={(e) => setG(e.target.value as "male")}><option value="male">Male</option><option value="female">Female</option></Select></Field>
        <Field label="Height (cm)"><Input type="number" value={h} onChange={(e) => setH(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Devine" value={`${fmt(devine, 1)} kg`} />
        <Stat label="Robinson" value={`${fmt(robinson, 1)} kg`} />
        <Stat label="Miller" value={`${fmt(miller, 1)} kg`} />
        <Stat label="BMI 18.5–24.9" value={`${fmt(bmiMin, 1)}–${fmt(bmiMax, 1)}`} />
      </div>
      <CopyResult rows={[["Devine", `${fmt(devine, 1)} kg`], ["Robinson", `${fmt(robinson, 1)} kg`], ["Miller", `${fmt(miller, 1)} kg`]]} />
    </div>
  );
}
export function BodyFat() {
  const [g, setG] = React.useState<"male" | "female">("male");
  const [waist, setWaist] = React.useState("85");
  const [neck, setNeck] = React.useState("38");
  const [h, setH] = React.useState("175");
  const [hip, setHip] = React.useState("95");
  const [w, setW] = React.useState("70");
  const bf = g === "male"
    ? 495 / (1.0324 - 0.19077 * Math.log10(n(waist) - n(neck)) + 0.15456 * Math.log10(n(h))) - 450
    : 495 / (1.29579 - 0.35004 * Math.log10(n(waist) + n(hip) - n(neck)) + 0.221 * Math.log10(n(h))) - 450;
  const cat = bf < 6 ? "Essential" : bf < 14 ? "Athletic" : bf < 18 ? "Fitness" : bf < 25 ? "Average" : "Obese";
  const fatKg = n(w) * (bf / 100);
  const leanKg = n(w) - fatKg;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Gender"><Select value={g} onChange={(e) => setG(e.target.value as "male")}><option value="male">Male</option><option value="female">Female</option></Select></Field>
        <Field label="Weight (kg)"><Input type="number" value={w} onChange={(e) => setW(e.target.value)} /></Field>
        <Field label="Waist (cm)"><Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} /></Field>
        <Field label="Neck (cm)"><Input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} /></Field>
        <Field label="Height (cm)"><Input type="number" value={h} onChange={(e) => setH(e.target.value)} /></Field>
        {g === "female" && <Field label="Hip (cm)"><Input type="number" value={hip} onChange={(e) => setHip(e.target.value)} /></Field>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Body fat (US Navy)" value={`${fmt(bf, 1)}%`} />
        <Stat label="Category" value={cat} />
        <Stat label="Fat mass" value={`${fmt(fatKg, 1)} kg`} />
        <Stat label="Lean mass" value={`${fmt(leanKg, 1)} kg`} />
      </div>
      <CopyResult filename="body-fat.txt" rows={[["Body fat", `${fmt(bf, 1)}%`], ["Category", cat], ["Fat mass", `${fmt(fatKg, 1)} kg`], ["Lean mass", `${fmt(leanKg, 1)} kg`]]} />
    </div>
  );
}

/* ------------------------------ Pregnancy ---------------------------------- */
export function DueDate({ mode = "due" }: { mode?: "due" | "ovulation" | "pregnancy" }) {
  const [lmp, setLmp] = React.useState("2026-01-01");
  const [cycle, setCycle] = React.useState("28");
  const start = new Date(lmp);
  const luteal = 14;
  const ovuOff = Math.max(8, n(cycle) - luteal);
  const due = new Date(start.getTime() + 280 * 86400000);
  const ovu = new Date(start.getTime() + ovuOff * 86400000);
  const conception = new Date(ovu.getTime());
  const weeks = Math.floor((Date.now() - start.getTime()) / (7 * 86400000));
  const days = Math.floor((Date.now() - start.getTime()) / 86400000);
  const t1 = new Date(start.getTime() + 13 * 7 * 86400000);
  const t2 = new Date(start.getTime() + 27 * 7 * 86400000);
  const iso = (d: Date) => d.toLocaleDateString();
  return (
    <div className="space-y-4">
      <Row>
        <Field label="First day of last period"><Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} /></Field>
        <Field label="Cycle length (days)"><Input type="number" value={cycle} onChange={(e) => setCycle(e.target.value)} /></Field>
      </Row>
      {mode === "ovulation" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Estimated ovulation" value={iso(ovu)} />
          <Stat label="Fertile start" value={iso(new Date(ovu.getTime() - 5 * 86400000))} />
          <Stat label="Fertile end" value={iso(new Date(ovu.getTime() + 86400000))} />
          <Stat label="Next period" value={iso(new Date(start.getTime() + n(cycle) * 86400000))} />
        </div>
      ) : mode === "pregnancy" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Weeks + days" value={`${Math.max(0, weeks)}w ${Math.max(0, days % 7)}d`} />
          <Stat label="Due date" value={iso(due)} />
          <Stat label="T1 ends" value={iso(t1)} />
          <Stat label="T2 ends" value={iso(t2)} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Estimated due date" value={iso(due)} />
          <Stat label="Conception ~" value={iso(conception)} />
          <Stat label="T1 ends" value={iso(t1)} />
          <Stat label="T2 ends" value={iso(t2)} />
        </div>
      )}
      <CopyResult filename="pregnancy.txt" rows={[["Due date", iso(due)], ["Ovulation", iso(ovu)], ["Conception", iso(conception)]]} />
    </div>
  );
}

/* ------------------------------ GPA / Grade -------------------------------- */
export function GpaCalculator() {
  const [rows, setRows] = React.useState([{ name: "Course 1", grade: "A", credits: "3" }, { name: "Course 2", grade: "B+", credits: "4" }]);
  const [scale, setScale] = React.useState<"4" | "5">("4");
  const map4: Record<string, number> = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, D: 1, F: 0 };
  const map5: Record<string, number> = { "A+": 5, A: 5, "A-": 4.7, "B+": 4.3, B: 4, "B-": 3.7, "C+": 3.3, C: 3, "C-": 2.7, D: 2, F: 0 };
  const map = scale === "5" ? map5 : map4;
  let pts = 0, cr = 0;
  for (const r of rows) { pts += (map[r.grade.toUpperCase()] ?? 0) * n(r.credits || 0); cr += n(r.credits || 0); }
  const gpa = cr ? pts / cr : 0;
  return (
    <div className="space-y-4">
      <Select value={scale} onChange={(e) => setScale(e.target.value as "4")} className="max-w-48">
        <option value="4">4.0 scale</option>
        <option value="5">5.0 scale</option>
      </Select>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3">
          <Input value={r.name} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Course" />
          <Input value={r.grade} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} placeholder="Grade (A, B+)" />
          <Input type="number" value={r.credits} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, credits: e.target.value } : x))} placeholder="Credits" />
          <Button variant="secondary" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setRows([...rows, { name: `Course ${rows.length + 1}`, grade: "A", credits: "3" }])}>+ Add course</Button>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="GPA" value={fmt(gpa, 2)} />
        <Stat label="Credits" value={fmt(cr, 1)} />
        <Stat label="Quality points" value={fmt(pts, 2)} />
      </div>
      <CopyResult filename="gpa.txt" rows={[["GPA", fmt(gpa, 2)], ["Credits", fmt(cr, 1)], ["Scale", scale === "5" ? "5.0" : "4.0"]]} />
    </div>
  );
}
export function GradeCalculator() {
  const [score, setScore] = React.useState("85");
  const [total, setTotal] = React.useState("100");
  const [want, setWant] = React.useState("90");
  const pct = (n(score) / n(total)) * 100;
  const letter = pct >= 97 ? "A+" : pct >= 93 ? "A" : pct >= 90 ? "A-" : pct >= 87 ? "B+" : pct >= 83 ? "B" : pct >= 80 ? "B-" : pct >= 77 ? "C+" : pct >= 73 ? "C" : pct >= 70 ? "C-" : pct >= 60 ? "D" : "F";
  const need = Math.max(0, n(want) - n(score));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Your score"><Input type="number" value={score} onChange={(e) => setScore(e.target.value)} /></Field>
        <Field label="Total points"><Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
        <Field label="Target %"><Input type="number" value={want} onChange={(e) => setWant(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Percentage" value={`${fmt(pct, 1)}%`} />
        <Stat label="Letter grade" value={letter} />
        <Stat label="Points to target" value={fmt(need, 1)} />
      </div>
      <CopyResult filename="grade.txt" rows={[["Percentage", `${fmt(pct, 1)}%`], ["Letter", letter], ["Points to target", fmt(need, 1)]]} />
    </div>
  );
}

/* ------------------------------ Fraction ----------------------------------- */
function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a; }
export function FractionCalculator() {
  const [a, setA] = React.useState("1");
  const [b, setB] = React.useState("2");
  const [op, setOp] = React.useState("+");
  const [c, setC] = React.useState("1");
  const [d, setD] = React.useState("3");
  let num = 0, den = 1;
  const [an, bn, cn, dn] = [n(a), n(b), n(c), n(d)];
  if (op === "+") { num = an * dn + cn * bn; den = bn * dn; }
  if (op === "-") { num = an * dn - cn * bn; den = bn * dn; }
  if (op === "×") { num = an * cn; den = bn * dn; }
  if (op === "÷") { num = an * dn; den = bn * cn; }
  const g = gcd(Math.abs(num), Math.abs(den)) || 1;
  const sn = num / g, sd = den / g;
  const whole = Math.trunc(sn / sd);
  const rem = Math.abs(sn % sd);
  const mixed = rem === 0 ? String(whole) : `${whole !== 0 ? whole + " " : ""}${rem}/${Math.abs(sd)}`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="a/b"><div className="flex items-center gap-1"><Input type="number" value={a} onChange={(e) => setA(e.target.value)} className="w-20" />/<Input type="number" value={b} onChange={(e) => setB(e.target.value)} className="w-20" /></div></Field>
        <Select value={op} onChange={(e) => setOp(e.target.value)} className="w-20"><option>+</option><option>-</option><option>×</option><option>÷</option></Select>
        <Field label="c/d"><div className="flex items-center gap-1"><Input type="number" value={c} onChange={(e) => setC(e.target.value)} className="w-20" />/<Input type="number" value={d} onChange={(e) => setD(e.target.value)} className="w-20" /></div></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Simplified" value={`${sn} / ${sd}`} />
        <Stat label="Mixed" value={mixed} />
        <Stat label="Decimal" value={fmt(num / den, 6)} />
      </div>
      <CopyResult filename="fraction.txt" rows={[["Simplified", `${sn}/${sd}`], ["Mixed", mixed], ["Decimal", fmt(num / den, 6)]]} />
    </div>
  );
}

/* ------------------------------ Scientific --------------------------------- */
export function ScientificCalculator() {
  const [expr, setExpr] = React.useState("");
  const [res, setRes] = React.useState("");
  const [hist, setHist] = React.useState<string[]>([]);
  const [deg, setDeg] = React.useState(true);
  const append = (s: string) => setExpr((e) => e + s);
  const wrapTrig = (fn: string) => deg ? `Math.${fn}((Math.PI/180)*` : `Math.${fn}(`;
  const compute = () => {
    try {
      let safe = expr
        .replace(/π/g, "Math.PI")
        .replace(/e(?![x])/g, "Math.E")
        .replace(/ln\(/g, "Math.log(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/√/g, "Math.sqrt")
        .replace(/\^/g, "**");
      if (deg) {
        safe = safe.replace(/sin\(/g, wrapTrig("sin")).replace(/cos\(/g, wrapTrig("cos")).replace(/tan\(/g, wrapTrig("tan"));
      } else {
        safe = safe.replace(/(sin|cos|tan|sqrt|abs|exp)\(/g, "Math.$1(");
      }
      safe = safe.replace(/(sqrt|abs|exp)\(/g, "Math.$1(");
      if (/[^0-9+\-*/.()MathPIeElncositagqrbxplog ^*]/.test(safe)) throw new Error();
      // eslint-disable-next-line no-new-func
      const val = String(Function(`"use strict";return (${safe})`)());
      setRes(val);
      setHist((h) => [`${expr} = ${val}`, ...h].slice(0, 8));
    } catch { setRes("Error"); }
  };
  const btns = ["7", "8", "9", "/", "(", "4", "5", "6", "*", ")", "1", "2", "3", "-", "sin(", "0", ".", "π", "+", "cos(", "e", "^", "sqrt(", "ln(", "tan("];
  return (
    <div className="space-y-3">
      <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono text-lg" placeholder="2 * (3 + 4)" />
      {res && <Notice tone={res === "Error" ? "error" : "success"}>= {res}</Notice>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={deg} onChange={(e) => setDeg(e.target.checked)} /> Degrees (uncheck for radians)</label>
      <div className="grid grid-cols-5 gap-2">
        {btns.map((bt) => <Button key={bt} variant="secondary" onClick={() => append(bt)}>{bt}</Button>)}
      </div>
      <div className="flex gap-2">
        <Button onClick={compute} className="flex-1">=</Button>
        <Button variant="outline" onClick={() => setExpr((e) => e.slice(0, -1))}>⌫</Button>
        <Button variant="outline" onClick={() => { setExpr(""); setRes(""); }}>Clear</Button>
      </div>
      {hist.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs space-y-1">
          {hist.map((h, i) => <div key={i}>{h}</div>)}
        </div>
      )}
      {res && res !== "Error" && <CopyResult filename="calc.txt" rows={[["Expression", expr], ["Result", res]]} />}
    </div>
  );
}

/* ------------------------------ Date / time -------------------------------- */
export function DateCalculator() {
  const [d1, setD1] = React.useState("2026-01-01");
  const [d2, setD2] = React.useState("2026-12-31");
  const [add, setAdd] = React.useState("30");
  const diff = Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
  const added = new Date(new Date(d1).getTime() + n(add) * 86400000);
  const workdays = (() => {
    let c = 0;
    const a = new Date(d1), b = new Date(d2);
    const dir = a <= b ? 1 : -1;
    const cur = new Date(a);
    while ((dir === 1 && cur <= b) || (dir === -1 && cur >= b)) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) c++;
      cur.setDate(cur.getDate() + dir);
    }
    return c * dir;
  })();
  return (
    <div className="space-y-4">
      <Row>
        <Field label="From"><Input type="date" value={d1} onChange={(e) => setD1(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={d2} onChange={(e) => setD2(e.target.value)} /></Field>
      </Row>
      <Field label="Add days to From"><Input type="number" value={add} onChange={(e) => setAdd(e.target.value)} className="max-w-40" /></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Days" value={fmt(diff, 0)} />
        <Stat label="Weeks" value={fmt(diff / 7, 1)} />
        <Stat label="Workdays" value={fmt(workdays, 0)} />
        <Stat label="From + days" value={added.toISOString().slice(0, 10)} />
      </div>
      <CopyResult rows={[["Days", fmt(diff, 0)], ["Workdays", fmt(workdays, 0)], ["From + days", added.toISOString().slice(0, 10)]]} />
    </div>
  );
}
export function HoursCalculator() {
  const [start, setStart] = React.useState("09:00");
  const [end, setEnd] = React.useState("17:30");
  const [brk, setBrk] = React.useState("30");
  const [s, e] = [start.split(":"), end.split(":")];
  let mins = (n(e[0]) * 60 + n(e[1])) - (n(s[0]) * 60 + n(s[1]));
  if (mins < 0) mins += 1440;
  mins = Math.max(0, mins - n(brk));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Start time"><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End time"><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        <Field label="Break (min)"><Input type="number" value={brk} onChange={(e) => setBrk(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Duration" value={`${Math.floor(mins / 60)}h ${mins % 60}m`} /><Stat label="Decimal hours" value={fmt(mins / 60, 2)} /><Stat label="Minutes" value={mins} /></div>
      <CopyResult rows={[["Duration", `${Math.floor(mins / 60)}h ${mins % 60}m`], ["Decimal", fmt(mins / 60, 2)]]} />
    </div>
  );
}
export function CountdownCalculator() {
  const [target, setTarget] = React.useState("2027-01-01T00:00");
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => { const t = setInterval(force, 1000); return () => clearInterval(t); }, []);
  const diff = new Date(target).getTime() - Date.now();
  const past = diff < 0;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  return (
    <div className="space-y-4">
      <Field label="Target date & time"><Input type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      <Notice tone={past ? "error" : "info"}>{past ? "This moment has passed." : "Counting down…"}</Notice>
      <div className="grid grid-cols-4 gap-3"><Stat label="Days" value={d} /><Stat label="Hours" value={h} /><Stat label="Minutes" value={m} /><Stat label="Seconds" value={s} /></div>
      <CopyResult filename="countdown.txt" rows={[["Target", target], ["Remaining", `${d}d ${h}h ${m}m ${s}s`]]} />
    </div>
  );
}

/* ------------------------------ Salary / sleep ----------------------------- */
export function SalaryCalculator() {
  const [hourly, setHourly] = React.useState("25");
  const [hrs, setHrs] = React.useState("40");
  const [ot, setOt] = React.useState("0");
  const weekly = n(hourly) * n(hrs) + n(hourly) * 1.5 * n(ot);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Hourly rate"><Input type="number" value={hourly} onChange={(e) => setHourly(e.target.value)} /></Field>
        <Field label="Hours/week"><Input type="number" value={hrs} onChange={(e) => setHrs(e.target.value)} /></Field>
        <Field label="Overtime hours (1.5×)"><Input type="number" value={ot} onChange={(e) => setOt(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Weekly" value={fmt(weekly)} /><Stat label="Biweekly" value={fmt(weekly * 2)} /><Stat label="Monthly" value={fmt(weekly * 52 / 12)} /><Stat label="Yearly" value={fmt(weekly * 52)} />
      </div>
      <CopyResult rows={[["Weekly", fmt(weekly)], ["Monthly", fmt(weekly * 52 / 12)], ["Yearly", fmt(weekly * 52)]]} />
    </div>
  );
}
export function PaycheckCalculator() {
  const [gross, setGross] = React.useState("5000");
  const [tax, setTax] = React.useState("22");
  const [freq, setFreq] = React.useState("12");
  const net = n(gross) * (1 - n(tax) / 100);
  const periods = n(freq) || 12;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Gross pay (per period)"><Input type="number" value={gross} onChange={(e) => setGross(e.target.value)} /></Field>
        <Field label="Tax + deductions %"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
        <Field label="Periods / year">
          <Select value={freq} onChange={(e) => setFreq(e.target.value)}>
            <option value="52">Weekly (52)</option>
            <option value="26">Biweekly (26)</option>
            <option value="24">Semimonthly (24)</option>
            <option value="12">Monthly (12)</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Take-home" value={fmt(net)} />
        <Stat label="Deducted" value={fmt(n(gross) - net)} />
        <Stat label="Annual net" value={fmt(net * periods)} />
        <Stat label="Annual gross" value={fmt(n(gross) * periods)} />
      </div>
      <CopyResult filename="paycheck.txt" rows={[["Net", fmt(net)], ["Deducted", fmt(n(gross) - net)], ["Annual net", fmt(net * periods)]]} />
    </div>
  );
}
export function SleepCalculator() {
  const [wake, setWake] = React.useState("07:00");
  const [mode, setMode] = React.useState<"wake" | "bed">("wake");
  const parts = (mode === "wake" ? wake : wake).split(":");
  const base = n(parts[0]) * 60 + n(parts[1]);
  const times = [6, 5, 4, 3].map((cycles) => {
    let t = mode === "wake" ? base - cycles * 90 - 15 : base + cycles * 90 + 15;
    t = ((t % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  });
  return (
    <div className="space-y-4">
      <Select value={mode} onChange={(e) => setMode(e.target.value as "wake")} className="max-w-56">
        <option value="wake">I want to wake up at</option>
        <option value="bed">I am going to bed at</option>
      </Select>
      <Field label={mode === "wake" ? "Wake time" : "Bedtime"}><Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></Field>
      <Notice tone="info">{mode === "wake" ? "Go to bed at one of these times (90-min cycles + 15 min to fall asleep):" : "Wake up at one of these times:"}</Notice>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {times.map((t, i) => <Stat key={`${t}-${i}`} label={`${6 - i} cycles`} value={t} />)}
      </div>
      <CopyResult filename="sleep.txt" rows={times.map((t, i) => [`${6 - i} cycles`, t])} />
    </div>
  );
}

/* ------------------------------ Std deviation ------------------------------ */
export function StdDeviation() {
  const [input, setInput] = React.useState("10, 12, 23, 23, 16, 23, 21, 16");
  const [sample, setSample] = React.useState(true);
  const nums = input.split(/[\s,]+/).map(parseFloat).filter((x) => !isNaN(x)).sort((a, b) => a - b);
  const mean = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  const denom = Math.max(1, sample ? nums.length - 1 : nums.length);
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / denom;
  const mid = nums.length ? (nums.length % 2 ? nums[(nums.length - 1) / 2] : (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2) : 0;
  return (
    <div className="space-y-4">
      <Field label="Numbers (comma or space separated)"><Input value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} /> Sample (n−1) — uncheck for population</label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Count" value={nums.length} />
        <Stat label="Mean" value={fmt(mean)} />
        <Stat label="Median" value={fmt(mid)} />
        <Stat label="Std Dev" value={fmt(Math.sqrt(variance))} />
        <Stat label="Variance" value={fmt(variance)} />
        <Stat label="Min" value={nums.length ? fmt(nums[0]) : "—"} />
        <Stat label="Max" value={nums.length ? fmt(nums[nums.length - 1]) : "—"} />
        <Stat label="Range" value={nums.length ? fmt(nums[nums.length - 1] - nums[0]) : "—"} />
      </div>
      <CopyResult filename="stats.txt" rows={[["Mean", fmt(mean)], ["Median", fmt(mid)], ["Std Dev", fmt(Math.sqrt(variance))], ["Variance", fmt(variance)]]} />
    </div>
  );
}
