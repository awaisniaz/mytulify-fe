"use client";

import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Field, Stat, Notice } from "@/components/tools/shared";

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
  let bmi = NaN;
  if (unit === "metric") bmi = n(w) / Math.pow(n(h) / 100, 2);
  else bmi = (n(w) * 703) / Math.pow(n(h), 2);
  const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
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
      <div className="grid grid-cols-2 gap-3"><Stat label="BMI" value={fmt(bmi, 1)} /><Stat label="Category" value={cat} /></div>
    </div>
  );
}

/* ------------------------------ Percentage --------------------------------- */
export function PercentageCalculator() {
  const [a, setA] = React.useState("15");
  const [b, setB] = React.useState("200");
  return (
    <div className="space-y-4">
      <Row>
        <Field label="X"><Input type="number" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label="Y"><Input type="number" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={`${a}% of ${b}`} value={fmt((n(a) / 100) * n(b))} />
        <Stat label={`${a} is what % of ${b}`} value={`${fmt((n(a) / n(b)) * 100)}%`} />
        <Stat label={`% change ${a}→${b}`} value={`${fmt(((n(b) - n(a)) / n(a)) * 100)}%`} />
      </div>
    </div>
  );
}

/* ------------------------------ Age ---------------------------------------- */
export function AgeCalculator() {
  const [dob, setDob] = React.useState("2000-01-01");
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  return (
    <div className="space-y-4">
      <Field label="Date of birth"><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3"><Stat label="Years" value={years} /><Stat label="Months" value={months} /><Stat label="Days" value={days} /></div>
      <div className="grid grid-cols-2 gap-3"><Stat label="Total days" value={fmt(totalDays, 0)} /><Stat label="Total weeks" value={fmt(totalDays / 7, 0)} /></div>
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
  const { pay, total, interest } = amortize(n(amt), n(rate), n(yrs));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={mortgage ? "Loan amount" : "Amount"}><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
        <Field label="Interest rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Term (years)"><Input type="number" value={yrs} onChange={(e) => setYrs(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Monthly payment" value={fmt(pay)} />
        <Stat label="Total interest" value={fmt(interest)} />
        <Stat label="Total paid" value={fmt(total)} />
      </div>
    </div>
  );
}

/* ------------------------------ Compound interest -------------------------- */
export function CompoundInterest() {
  const [p, setP] = React.useState("1000");
  const [r, setR] = React.useState("7");
  const [t, setT] = React.useState("10");
  const [c, setC] = React.useState("12");
  const [m, setM] = React.useState("100");
  const rate = n(r) / 100, cmp = n(c);
  const base = n(p) * Math.pow(1 + rate / cmp, cmp * n(t));
  const contrib = n(m) * cmp > 0 && rate > 0
    ? n(m) * ((Math.pow(1 + rate / cmp, cmp * n(t)) - 1) / (rate / cmp))
    : n(m) * cmp * n(t);
  const total = base + contrib;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Initial amount"><Input type="number" value={p} onChange={(e) => setP(e.target.value)} /></Field>
        <Field label="Annual rate %"><Input type="number" value={r} onChange={(e) => setR(e.target.value)} /></Field>
        <Field label="Years"><Input type="number" value={t} onChange={(e) => setT(e.target.value)} /></Field>
        <Field label="Compounds/year"><Input type="number" value={c} onChange={(e) => setC(e.target.value)} /></Field>
        <Field label="Monthly add"><Input type="number" value={m} onChange={(e) => setM(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Future value" value={fmt(total)} /><Stat label="Total interest" value={fmt(total - n(p) - n(m) * cmp * n(t))} /></div>
    </div>
  );
}

/* ------------------------------ Tip / Discount / Tax ----------------------- */
export function TipCalculator() {
  const [bill, setBill] = React.useState("50");
  const [pct, setPct] = React.useState("18");
  const [people, setPeople] = React.useState("2");
  const tip = n(bill) * (n(pct) / 100);
  const total = n(bill) + tip;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Bill amount"><Input type="number" value={bill} onChange={(e) => setBill(e.target.value)} /></Field>
        <Field label="Tip %"><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        <Field label="Split between"><Input type="number" value={people} onChange={(e) => setPeople(e.target.value)} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Tip" value={fmt(tip)} /><Stat label="Total" value={fmt(total)} /><Stat label="Per person" value={fmt(total / Math.max(1, n(people)))} /></div>
    </div>
  );
}
export function DiscountCalculator() {
  const [price, setPrice] = React.useState("80");
  const [pct, setPct] = React.useState("25");
  const save = n(price) * (n(pct) / 100);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Original price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Discount %"><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="You save" value={fmt(save)} /><Stat label="Final price" value={fmt(n(price) - save)} /></div>
    </div>
  );
}
export function SalesTaxCalculator() {
  const [price, setPrice] = React.useState("100");
  const [rate, setRate] = React.useState("8.5");
  const tax = n(price) * (n(rate) / 100);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Price (pre-tax)"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Tax rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Tax" value={fmt(tax)} /><Stat label="Total" value={fmt(n(price) + tax)} /></div>
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
  return <div className="space-y-4"><BodyInputs b={b} /><Stat label="BMR (calories/day)" value={fmt(b.bmr, 0)} /></div>;
}
export function TdeeCalculator() {
  const b = useBody();
  const [act, setAct] = React.useState("1.55");
  return (
    <div className="space-y-4">
      <BodyInputs b={b} />
      <Field label="Activity level"><Select value={act} onChange={(e) => setAct(e.target.value)}>
        <option value="1.2">Sedentary</option><option value="1.375">Light</option><option value="1.55">Moderate</option><option value="1.725">Active</option><option value="1.9">Very active</option>
      </Select></Field>
      <Stat label="TDEE (calories/day)" value={fmt(b.bmr * n(act), 0)} />
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
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Lose weight" value={fmt(tdee - 500, 0)} /><Stat label="Maintain" value={fmt(tdee, 0)} /><Stat label="Gain weight" value={fmt(tdee + 500, 0)} /></div>
    </div>
  );
}
export function IdealWeight() {
  const [g, setG] = React.useState<"male" | "female">("male");
  const [h, setH] = React.useState("175");
  const inches = n(h) / 2.54;
  const over5ft = Math.max(0, inches - 60);
  const devine = (g === "male" ? 50 : 45.5) + 2.3 * over5ft;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Gender"><Select value={g} onChange={(e) => setG(e.target.value as "male")}><option value="male">Male</option><option value="female">Female</option></Select></Field>
        <Field label="Height (cm)"><Input type="number" value={h} onChange={(e) => setH(e.target.value)} /></Field>
      </Row>
      <Stat label="Ideal weight (Devine)" value={`${fmt(devine, 1)} kg`} />
    </div>
  );
}
export function BodyFat() {
  const [g, setG] = React.useState<"male" | "female">("male");
  const [waist, setWaist] = React.useState("85");
  const [neck, setNeck] = React.useState("38");
  const [h, setH] = React.useState("175");
  const [hip, setHip] = React.useState("95");
  const bf = g === "male"
    ? 495 / (1.0324 - 0.19077 * Math.log10(n(waist) - n(neck)) + 0.15456 * Math.log10(n(h))) - 450
    : 495 / (1.29579 - 0.35004 * Math.log10(n(waist) + n(hip) - n(neck)) + 0.221 * Math.log10(n(h))) - 450;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Gender"><Select value={g} onChange={(e) => setG(e.target.value as "male")}><option value="male">Male</option><option value="female">Female</option></Select></Field>
        <Field label="Waist (cm)"><Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} /></Field>
        <Field label="Neck (cm)"><Input type="number" value={neck} onChange={(e) => setNeck(e.target.value)} /></Field>
        <Field label="Height (cm)"><Input type="number" value={h} onChange={(e) => setH(e.target.value)} /></Field>
        {g === "female" && <Field label="Hip (cm)"><Input type="number" value={hip} onChange={(e) => setHip(e.target.value)} /></Field>}
      </div>
      <Stat label="Body fat (US Navy)" value={`${fmt(bf, 1)}%`} />
    </div>
  );
}

/* ------------------------------ Pregnancy ---------------------------------- */
export function DueDate({ mode = "due" }: { mode?: "due" | "ovulation" | "pregnancy" }) {
  const [lmp, setLmp] = React.useState("2026-01-01");
  const start = new Date(lmp);
  const due = new Date(start.getTime() + 280 * 86400000);
  const ovu = new Date(start.getTime() + 14 * 86400000);
  const weeks = Math.floor((Date.now() - start.getTime()) / (7 * 86400000));
  return (
    <div className="space-y-4">
      <Field label="First day of last period"><Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} /></Field>
      {mode === "ovulation" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Estimated ovulation" value={ovu.toLocaleDateString()} />
          <Stat label="Fertile window" value={`${new Date(ovu.getTime() - 5 * 86400000).toLocaleDateString()} +`} />
        </div>
      ) : mode === "pregnancy" ? (
        <div className="grid gap-3 sm:grid-cols-2"><Stat label="Weeks pregnant" value={Math.max(0, weeks)} /><Stat label="Due date" value={due.toLocaleDateString()} /></div>
      ) : (
        <Stat label="Estimated due date" value={due.toLocaleDateString()} />
      )}
    </div>
  );
}

/* ------------------------------ GPA / Grade -------------------------------- */
export function GpaCalculator() {
  const [rows, setRows] = React.useState([{ grade: "A", credits: "3" }, { grade: "B+", credits: "4" }]);
  const map: Record<string, number> = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, D: 1, F: 0 };
  let pts = 0, cr = 0;
  for (const r of rows) { pts += (map[r.grade.toUpperCase()] ?? 0) * n(r.credits || 0); cr += n(r.credits || 0); }
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3">
          <Input value={r.grade} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, grade: e.target.value } : x))} placeholder="Grade (A, B+)" />
          <Input type="number" value={r.credits} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, credits: e.target.value } : x))} placeholder="Credits" />
          <Button variant="secondary" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setRows([...rows, { grade: "A", credits: "3" }])}>+ Add course</Button>
      <Stat label="GPA" value={fmt(cr ? pts / cr : 0, 2)} />
    </div>
  );
}
export function GradeCalculator() {
  const [score, setScore] = React.useState("85");
  const [total, setTotal] = React.useState("100");
  const pct = (n(score) / n(total)) * 100;
  const letter = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Your score"><Input type="number" value={score} onChange={(e) => setScore(e.target.value)} /></Field>
        <Field label="Total points"><Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Percentage" value={`${fmt(pct, 1)}%`} /><Stat label="Letter grade" value={letter} /></div>
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
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="a/b"><div className="flex items-center gap-1"><Input type="number" value={a} onChange={(e) => setA(e.target.value)} className="w-20" />/<Input type="number" value={b} onChange={(e) => setB(e.target.value)} className="w-20" /></div></Field>
        <Select value={op} onChange={(e) => setOp(e.target.value)} className="w-20"><option>+</option><option>-</option><option>×</option><option>÷</option></Select>
        <Field label="c/d"><div className="flex items-center gap-1"><Input type="number" value={c} onChange={(e) => setC(e.target.value)} className="w-20" />/<Input type="number" value={d} onChange={(e) => setD(e.target.value)} className="w-20" /></div></Field>
      </div>
      <Stat label="Result" value={`${num / g} / ${den / g} = ${fmt(num / den, 4)}`} />
    </div>
  );
}

/* ------------------------------ Scientific --------------------------------- */
export function ScientificCalculator() {
  const [expr, setExpr] = React.useState("");
  const [res, setRes] = React.useState("");
  const append = (s: string) => setExpr((e) => e + s);
  const compute = () => {
    try {
      const safe = expr.replace(/π/g, "Math.PI").replace(/(sin|cos|tan|log|sqrt|abs|exp)\(/g, "Math.$1(").replace(/\^/g, "**").replace(/√/g, "Math.sqrt");
      if (/[^0-9+\-*/.()MathPIeEsincotaglqrbxp ^*]/.test(safe)) throw new Error();
      // eslint-disable-next-line no-new-func
      setRes(String(Function(`"use strict";return (${safe})`)()));
    } catch { setRes("Error"); }
  };
  const btns = ["7", "8", "9", "/", "sin(", "4", "5", "6", "*", "cos(", "1", "2", "3", "-", "tan(", "0", ".", "π", "+", "sqrt("];
  return (
    <div className="space-y-3">
      <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono text-lg" placeholder="2 * (3 + 4)" />
      {res && <Notice tone="success">= {res}</Notice>}
      <div className="grid grid-cols-5 gap-2">
        {btns.map((bt) => <Button key={bt} variant="secondary" onClick={() => append(bt)}>{bt}</Button>)}
      </div>
      <div className="flex gap-2"><Button onClick={compute} className="flex-1">=</Button><Button variant="outline" onClick={() => { setExpr(""); setRes(""); }}>Clear</Button></div>
    </div>
  );
}

/* ------------------------------ Date / time -------------------------------- */
export function DateCalculator() {
  const [d1, setD1] = React.useState("2026-01-01");
  const [d2, setD2] = React.useState("2026-12-31");
  const diff = Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="From"><Input type="date" value={d1} onChange={(e) => setD1(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={d2} onChange={(e) => setD2(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3"><Stat label="Days" value={fmt(diff, 0)} /><Stat label="Weeks" value={fmt(diff / 7, 1)} /><Stat label="Months" value={fmt(diff / 30.44, 1)} /></div>
    </div>
  );
}
export function HoursCalculator() {
  const [start, setStart] = React.useState("09:00");
  const [end, setEnd] = React.useState("17:30");
  const [s, e] = [start.split(":"), end.split(":")];
  let mins = (n(e[0]) * 60 + n(e[1])) - (n(s[0]) * 60 + n(s[1]));
  if (mins < 0) mins += 1440;
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Start time"><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End time"><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Duration" value={`${Math.floor(mins / 60)}h ${mins % 60}m`} /><Stat label="Decimal hours" value={fmt(mins / 60, 2)} /></div>
    </div>
  );
}
export function CountdownCalculator() {
  const [target, setTarget] = React.useState("2027-01-01");
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => { const t = setInterval(force, 1000); return () => clearInterval(t); }, []);
  const diff = new Date(target).getTime() - Date.now();
  const d = Math.max(0, Math.floor(diff / 86400000));
  const h = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const s = Math.max(0, Math.floor((diff % 60000) / 1000));
  return (
    <div className="space-y-4">
      <Field label="Target date"><Input type="date" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      <div className="grid grid-cols-4 gap-3"><Stat label="Days" value={d} /><Stat label="Hours" value={h} /><Stat label="Minutes" value={m} /><Stat label="Seconds" value={s} /></div>
    </div>
  );
}

/* ------------------------------ Salary / sleep ----------------------------- */
export function SalaryCalculator() {
  const [hourly, setHourly] = React.useState("25");
  const [hrs, setHrs] = React.useState("40");
  const weekly = n(hourly) * n(hrs);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Hourly rate"><Input type="number" value={hourly} onChange={(e) => setHourly(e.target.value)} /></Field>
        <Field label="Hours/week"><Input type="number" value={hrs} onChange={(e) => setHrs(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Weekly" value={fmt(weekly)} /><Stat label="Monthly" value={fmt(weekly * 52 / 12)} /><Stat label="Yearly" value={fmt(weekly * 52)} /><Stat label="Daily" value={fmt(weekly / 5)} />
      </div>
    </div>
  );
}
export function PaycheckCalculator() {
  const [gross, setGross] = React.useState("5000");
  const [tax, setTax] = React.useState("22");
  const net = n(gross) * (1 - n(tax) / 100);
  return (
    <div className="space-y-4">
      <Row>
        <Field label="Gross pay"><Input type="number" value={gross} onChange={(e) => setGross(e.target.value)} /></Field>
        <Field label="Tax + deductions %"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2"><Stat label="Take-home" value={fmt(net)} /><Stat label="Deducted" value={fmt(n(gross) - net)} /></div>
    </div>
  );
}
export function SleepCalculator() {
  const [wake, setWake] = React.useState("07:00");
  const [w] = wake.split(":");
  const wakeMin = n(w) * 60 + n(wake.split(":")[1]);
  const times = [6, 5, 4, 3].map((cycles) => {
    let t = wakeMin - cycles * 90 - 15;
    t = ((t % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  });
  return (
    <div className="space-y-4">
      <Field label="I want to wake up at"><Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></Field>
      <Notice tone="info">Go to bed at one of these times (90-min cycles):</Notice>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {times.map((t, i) => <Stat key={t} label={`${6 - i} cycles`} value={t} />)}
      </div>
    </div>
  );
}

/* ------------------------------ Std deviation ------------------------------ */
export function StdDeviation() {
  const [input, setInput] = React.useState("10, 12, 23, 23, 16, 23, 21, 16");
  const nums = input.split(/[\s,]+/).map(parseFloat).filter((x) => !isNaN(x));
  const mean = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length || 1);
  return (
    <div className="space-y-4">
      <Field label="Numbers (comma or space separated)"><Input value={input} onChange={(e) => setInput(e.target.value)} /></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Count" value={nums.length} /><Stat label="Mean" value={fmt(mean)} /><Stat label="Variance" value={fmt(variance)} /><Stat label="Std Dev" value={fmt(Math.sqrt(variance))} />
      </div>
    </div>
  );
}
