"use client";

/**
 * Upgraded finance calculators (chunk 1 + chunk 2):
 * EMI, SIP, CAGR, Compound Interest, Inflation,
 * FD, PPF, SWP, RD, Lumpsum
 */
import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Field, Stat, Notice, CopyButton } from "@/components/tools/shared";
import { download } from "@/lib/utils";

const n = (v: string) => parseFloat(v);
const fmt = (x: number, d = 2) =>
  Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";
const money = (x: number, d = 0) =>
  Number.isFinite(x)
    ? x.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function PresetChips({
  label,
  options,
  onPick,
}: {
  label: string;
  options: { label: string; value: string }[];
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="rounded-lg border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium hover:border-brand/40"
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DonutChart({
  slices,
  center,
}: {
  slices: { label: string; value: number; color: string }[];
  center?: string;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {slices.map((s) => {
            const len = (Math.max(0, s.value) / total) * c;
            const el = (
              <circle
                key={s.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        {center && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-xs font-semibold leading-tight">
            {center}
          </div>
        )}
      </div>
      <ul className="w-full space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-muted">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">{money(s.value)}</span>
            <span className="w-12 text-right text-xs text-muted tabular-nums">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineChart({ points, height = 120 }: { points: { x: number; y: number }[]; height?: number }) {
  if (points.length < 2) return null;
  const maxY = Math.max(...points.map((p) => p.y), 1);
  const w = 320;
  const pad = 8;
  const path = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2);
      const y = height - pad - (p.y / maxY) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L${w - pad},${height - pad} L${pad},${height - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full rounded-xl border border-border bg-surface-2/40">
      <path d={area} fill="var(--brand)" fillOpacity="0.12" />
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function ScheduleTable({
  headers,
  rows,
  csvName,
}: {
  headers: string[];
  rows: (string | number)[][];
  csvName: string;
}) {
  if (!rows.length) return null;
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join(
    "\n",
  );
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Breakdown</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => download(csv, csvName, "text/csv")}>
          Download CSV
        </Button>
      </div>
      <div className="max-h-64 overflow-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="sticky top-0 bg-surface-2 text-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-1.5 tabular-nums">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultsCopy({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-sm">
      <span className="min-w-0 flex-1 break-all font-mono text-xs text-muted">{text}</span>
      <CopyButton value={text} label="Copy results" />
    </div>
  );
}

function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-border bg-surface-2/40 p-3 text-sm">
      <summary className="cursor-pointer font-medium">Show formula</summary>
      <div className="mt-2 space-y-1 text-muted">{children}</div>
    </details>
  );
}

/* ============================== EMI ============================== */

type AmortRow = { month: number; emi: number; principal: number; interest: number; balance: number };

function buildAmortization(
  principal: number,
  annualRate: number,
  months: number,
  extra = 0,
  extraMode: "tenure" | "emi" = "tenure",
): { emi: number; schedule: AmortRow[]; totalInterest: number; totalPaid: number; monthsUsed: number } {
  const r = annualRate / 100 / 12;
  const baseEmi =
    months <= 0 || principal <= 0
      ? 0
      : r === 0
        ? principal / months
        : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

  const schedule: AmortRow[] = [];
  let bal = principal;
  let totalInterest = 0;
  const limit = extraMode === "tenure" && extra > 0 ? 600 : months;
  const pay = baseEmi + (extraMode === "emi" ? extra : 0);

  for (let m = 1; m <= limit && bal > 0.01; m++) {
    const interest = r === 0 ? 0 : bal * r;
    let principalPart = pay - interest + (extraMode === "tenure" ? extra : 0);
    if (principalPart > bal) principalPart = bal;
    const emiPaid = interest + principalPart;
    bal = Math.max(0, bal - principalPart);
    totalInterest += interest;
    schedule.push({ month: m, emi: emiPaid, principal: principalPart, interest, balance: bal });
    if (extraMode === "emi" && m >= months) break;
  }
  return {
    emi: baseEmi,
    schedule,
    totalInterest,
    totalPaid: schedule.reduce((s, row) => s + row.emi, 0),
    monthsUsed: schedule.length,
  };
}

export function EmiCalculator() {
  const [principal, setPrincipal] = React.useState("500000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("5");
  const [monthsExtra, setMonthsExtra] = React.useState("0");
  const [extra, setExtra] = React.useState("0");
  const [extraMode, setExtraMode] = React.useState<"tenure" | "emi">("tenure");
  const [rateType, setRateType] = React.useState<"reducing" | "flat">("reducing");

  const p = Math.max(0, n(principal) || 0);
  const annual = Math.max(0, n(rate) || 0);
  const months = Math.max(1, Math.round((n(years) || 0) * 12) + Math.max(0, Math.round(n(monthsExtra) || 0)));
  const extraPay = Math.max(0, n(extra) || 0);

  const result = React.useMemo(() => {
    if (rateType === "flat") {
      const totalInterest = (p * annual * (months / 12)) / 100;
      const total = p + totalInterest;
      const emi = total / months;
      const schedule: AmortRow[] = [];
      let bal = p;
      const prinPer = p / months;
      const intPer = totalInterest / months;
      for (let m = 1; m <= months; m++) {
        bal = Math.max(0, bal - prinPer);
        schedule.push({ month: m, emi, principal: prinPer, interest: intPer, balance: bal });
      }
      return { emi, schedule, totalInterest, totalPaid: total, monthsUsed: months };
    }
    return buildAmortization(p, annual, months, extraPay, extraMode);
  }, [p, annual, months, extraPay, extraMode, rateType]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Reducing-balance EMI is standard for most bank loans. Flat rate is simpler but usually costs more.
      </Notice>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["Home", "5000000", "8.5", "20"],
            ["Car", "800000", "10", "5"],
            ["Personal", "300000", "14", "3"],
          ] as const
        ).map(([label, a, r, t]) => (
          <Button
            key={label}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setPrincipal(a);
              setRate(r);
              setYears(t);
              setMonthsExtra("0");
            }}
          >
            {label} loan
          </Button>
        ))}
      </div>
      <Row>
        <Field label="Loan amount">
          <Input type="number" min={0} value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input type="number" min={0} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure (years)">
          <Input type="number" min={0} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <Field label="+ Extra months">
          <Input type="number" min={0} value={monthsExtra} onChange={(e) => setMonthsExtra(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Interest type">
          <Select value={rateType} onChange={(e) => setRateType(e.target.value as "reducing" | "flat")}>
            <option value="reducing">Reducing balance (standard)</option>
            <option value="flat">Flat rate</option>
          </Select>
        </Field>
        <Field label="Prepayment / month">
          <Input type="number" min={0} value={extra} disabled={rateType === "flat"} onChange={(e) => setExtra(e.target.value)} />
        </Field>
      </Row>
      {rateType === "reducing" && extraPay > 0 && (
        <Field label="Apply extra toward">
          <Select value={extraMode} onChange={(e) => setExtraMode(e.target.value as "tenure" | "emi")}>
            <option value="tenure">Reduce tenure</option>
            <option value="emi">Keep tenure, higher monthly outgo</option>
          </Select>
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Monthly EMI" value={money(result.emi)} />
        <Stat label="Total interest" value={money(result.totalInterest)} />
        <Stat label="Total payment" value={money(result.totalPaid)} />
        <Stat label="Months" value={result.monthsUsed} />
      </div>
      <DonutChart
        center="Split"
        slices={[
          { label: "Principal", value: p, color: "var(--brand)" },
          { label: "Interest", value: result.totalInterest, color: "#f59e0b" },
        ]}
      />
      <ResultsCopy
        text={`EMI ${money(result.emi)} · Interest ${money(result.totalInterest)} · Total ${money(result.totalPaid)} · ${result.monthsUsed} mo`}
      />
      <ScheduleTable
        headers={["Month", "EMI", "Principal", "Interest", "Balance"]}
        rows={result.schedule.map((row) => [row.month, money(row.emi), money(row.principal), money(row.interest), money(row.balance)])}
        csvName="emi-amortization.csv"
      />
      <FormulaBox>
        <p>Reducing EMI = [P × r × (1+r)^n] / [(1+r)^n − 1]</p>
        <p>Flat: interest = P × rate% × years; EMI = (P + interest) ÷ months</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== SIP ============================== */

function sipSchedule(monthly: number, annualRate: number, years: number, stepPct: number, lumpsum: number) {
  const monthsTotal = Math.max(0, Math.round(years * 12));
  const r = annualRate / 100 / 12;
  const step = stepPct / 100;
  let invested = Math.max(0, lumpsum);
  let value = Math.max(0, lumpsum);
  const yearRows: { year: number; invested: number; value: number; gains: number }[] = [];
  let yearInvested = invested;

  for (let m = 0; m < monthsTotal; m++) {
    if (r !== 0) value *= 1 + r;
    const payment = monthly * Math.pow(1 + step, Math.floor(m / 12));
    value += payment;
    invested += payment;
    yearInvested += payment;
    if ((m + 1) % 12 === 0 || m === monthsTotal - 1) {
      yearRows.push({ year: Math.ceil((m + 1) / 12), invested: yearInvested, value, gains: value - yearInvested });
    }
  }
  return { invested, maturity: value, years: yearRows };
}

function requiredSipForGoal(goal: number, annualRate: number, years: number, lumpsum: number) {
  const months = Math.max(1, Math.round(years * 12));
  const r = annualRate / 100 / 12;
  const fvLump = r === 0 ? lumpsum : lumpsum * Math.pow(1 + r, months);
  const need = Math.max(0, goal - fvLump);
  if (need <= 0) return 0;
  if (r === 0) return need / months;
  return need / (((Math.pow(1 + r, months) - 1) / r) * (1 + r));
}

export function SipCalculator() {
  const [mode, setMode] = React.useState<"project" | "goal">("project");
  const [monthly, setMonthly] = React.useState("10000");
  const [goal, setGoal] = React.useState("5000000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("10");
  const [stepUp, setStepUp] = React.useState("0");
  const [lumpsum, setLumpsum] = React.useState("0");
  const [inflation, setInflation] = React.useState("0");

  const annual = Math.max(0, n(rate) || 0);
  const y = Math.max(0, n(years) || 0);
  const step = Math.max(0, n(stepUp) || 0);
  const lump = Math.max(0, n(lumpsum) || 0);
  const infl = Math.max(0, n(inflation) || 0);
  const monthlyAmt =
    mode === "goal" ? requiredSipForGoal(Math.max(0, n(goal) || 0), annual, y, lump) : Math.max(0, n(monthly) || 0);
  const result = React.useMemo(
    () => sipSchedule(monthlyAmt, annual, y, mode === "goal" ? 0 : step, lump),
    [monthlyAmt, annual, y, step, lump, mode],
  );
  const gains = result.maturity - result.invested;
  const realMaturity = infl > 0 && y > 0 ? result.maturity / Math.pow(1 + infl / 100, y) : result.maturity;

  return (
    <div className="space-y-4">
      <Notice tone="info">Planning estimates only. Goal mode finds the monthly SIP for a target corpus.</Notice>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "project" | "goal")}>
          <option value="project">Project maturity</option>
          <option value="goal">Goal — required SIP</option>
        </Select>
      </Field>
      {mode === "project" ? (
        <>
          <PresetChips
            label="SIP"
            options={[
              { label: "₹5k", value: "5000" },
              { label: "₹10k", value: "10000" },
              { label: "₹25k", value: "25000" },
              { label: "₹50k", value: "50000" },
            ]}
            onPick={setMonthly}
          />
          <Field label="Monthly SIP">
            <Input type="number" min={0} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
          </Field>
        </>
      ) : (
        <Field label="Target corpus">
          <Input type="number" min={0} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </Field>
      )}
      <Row>
        <Field label="Expected annual return (%)">
          <Input type="number" min={0} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Tenure (years)">
          <Input type="number" min={0} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </Row>
      <PresetChips
        label="Return"
        options={[
          { label: "8%", value: "8" },
          { label: "10%", value: "10" },
          { label: "12%", value: "12" },
          { label: "15%", value: "15" },
        ]}
        onPick={setRate}
      />
      <Row>
        <Field label="Initial lumpsum (optional)">
          <Input type="number" min={0} value={lumpsum} onChange={(e) => setLumpsum(e.target.value)} />
        </Field>
        {mode === "project" ? (
          <Field label="Annual step-up (%)">
            <Input type="number" min={0} value={stepUp} onChange={(e) => setStepUp(e.target.value)} />
          </Field>
        ) : (
          <Field label="Inflation % (optional)">
            <Input type="number" min={0} step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} />
          </Field>
        )}
      </Row>
      {mode === "project" && (
        <Field label="Inflation % (optional)">
          <Input type="number" min={0} step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} />
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {mode === "goal" && <Stat label="Required monthly SIP" value={money(monthlyAmt)} />}
        <Stat label="Total invested" value={money(result.invested)} />
        <Stat label="Estimated returns" value={money(gains)} />
        <Stat label="Maturity value" value={money(result.maturity)} />
      </div>
      {infl > 0 && <Stat label="Inflation-adjusted maturity" value={money(realMaturity)} />}
      <DonutChart
        center="Corpus"
        slices={[
          { label: "Invested", value: result.invested, color: "var(--brand)" },
          { label: "Returns", value: Math.max(0, gains), color: "#10b981" },
        ]}
      />
      <LineChart points={result.years.map((row) => ({ x: row.year, y: row.value }))} />
      <ResultsCopy
        text={
          mode === "goal"
            ? `Required SIP ${money(monthlyAmt)}/mo · Goal ${money(n(goal) || 0)} · ${y}y @ ${annual}%`
            : `SIP ${money(monthlyAmt)}/mo · Invested ${money(result.invested)} · Maturity ${money(result.maturity)}`
        }
      />
      <ScheduleTable
        headers={["Year", "Invested", "Value", "Gains"]}
        rows={result.years.map((row) => [row.year, money(row.invested), money(row.value), money(row.gains)])}
        csvName="sip-yearly.csv"
      />
      <FormulaBox>
        <p>FV = P × [((1+r)^n − 1) / r] × (1+r)</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== CAGR ============================== */

export function CagrCalculator() {
  const [solve, setSolve] = React.useState<"cagr" | "end" | "begin" | "years">("cagr");
  const [begin, setBegin] = React.useState("100000");
  const [end, setEnd] = React.useState("250000");
  const [years, setYears] = React.useState("5");
  const [cagrPct, setCagrPct] = React.useState("12");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const dateYears = React.useMemo(() => {
    if (!startDate || !endDate) return null;
    const a = new Date(startDate).getTime();
    const b = new Date(endDate).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
    return (b - a) / (365.25 * 86400000);
  }, [startDate, endDate]);

  const yInput = dateYears ?? Math.max(0, n(years) || 0);

  const computed = React.useMemo(() => {
    const b0 = Math.max(0, n(begin) || 0);
    const e0 = Math.max(0, n(end) || 0);
    const c0 = n(cagrPct) / 100;
    const y = yInput;
    if (solve === "cagr") {
      const ok = b0 > 0 && e0 > 0 && y > 0;
      const cagr = ok ? Math.pow(e0 / b0, 1 / y) - 1 : NaN;
      return { begin: b0, end: e0, years: y, cagr, ok: ok && Number.isFinite(cagr) };
    }
    if (solve === "end") {
      const ok = b0 > 0 && y > 0 && Number.isFinite(c0);
      return { begin: b0, end: ok ? b0 * Math.pow(1 + c0, y) : NaN, years: y, cagr: c0, ok };
    }
    if (solve === "begin") {
      const ok = e0 > 0 && y > 0 && Number.isFinite(c0) && 1 + c0 !== 0;
      return { begin: ok ? e0 / Math.pow(1 + c0, y) : NaN, end: e0, years: y, cagr: c0, ok };
    }
    const ok = b0 > 0 && e0 > 0 && c0 > -1 && c0 !== 0;
    const yrs = ok ? Math.log(e0 / b0) / Math.log(1 + c0) : NaN;
    return { begin: b0, end: e0, years: yrs, cagr: c0, ok: ok && Number.isFinite(yrs) && yrs > 0 };
  }, [solve, begin, end, years, cagrPct, yInput]);

  const path = React.useMemo(() => {
    if (!computed.ok || !computed.begin || !Number.isFinite(computed.cagr)) return [];
    const yMax = Math.min(50, Math.max(1, Math.ceil(computed.years)));
    const rows = [{ year: 0, value: computed.begin }];
    for (let i = 1; i <= yMax; i++) rows.push({ year: i, value: computed.begin * Math.pow(1 + computed.cagr, i) });
    return rows;
  }, [computed]);

  const totalGain = computed.ok ? computed.end - computed.begin : NaN;
  const absReturn = computed.ok && computed.begin ? (totalGain / computed.begin) * 100 : NaN;
  const monthlyEq = computed.ok && Number.isFinite(computed.cagr) ? Math.pow(1 + computed.cagr, 1 / 12) - 1 : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">CAGR ignores interim cashflows. For SIPs use the SIP calculator or XIRR.</Notice>
      <Field label="Solve for">
        <Select value={solve} onChange={(e) => setSolve(e.target.value as typeof solve)}>
          <option value="cagr">CAGR</option>
          <option value="end">Ending value</option>
          <option value="begin">Beginning value</option>
          <option value="years">Years needed</option>
        </Select>
      </Field>
      <Row>
        {(solve === "cagr" || solve === "end" || solve === "years") && (
          <Field label="Beginning value">
            <Input type="number" min={0} value={begin} onChange={(e) => setBegin(e.target.value)} />
          </Field>
        )}
        {(solve === "cagr" || solve === "begin" || solve === "years") && (
          <Field label="Ending value">
            <Input type="number" min={0} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        )}
      </Row>
      <Row>
        {(solve === "end" || solve === "begin" || solve === "years") && (
          <Field label="CAGR (%)">
            <Input type="number" step="0.1" value={cagrPct} onChange={(e) => setCagrPct(e.target.value)} />
          </Field>
        )}
        {(solve === "cagr" || solve === "end" || solve === "begin") && (
          <Field label="Years" hint={dateYears != null ? `From dates: ${dateYears.toFixed(2)}y` : undefined}>
            <Input type="number" min={0.01} step="0.1" value={years} disabled={dateYears != null} onChange={(e) => setYears(e.target.value)} />
          </Field>
        )}
      </Row>
      <Row>
        <Field label="Start date (optional)">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date (optional)">
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </Row>
      {computed.ok && computed.end < computed.begin && (
        <Notice tone="error">Ending value is below beginning — CAGR is negative.</Notice>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="CAGR" value={Number.isFinite(computed.cagr) ? `${fmt(computed.cagr * 100, 2)}%` : "—"} />
        <Stat label="Total gain" value={money(totalGain)} />
        <Stat label="Absolute return" value={Number.isFinite(absReturn) ? `${fmt(absReturn, 2)}%` : "—"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Beginning" value={money(computed.begin)} />
        <Stat label="Ending" value={money(computed.end)} />
        <Stat label="Years" value={Number.isFinite(computed.years) ? fmt(computed.years, 2) : "—"} />
      </div>
      <Stat label="Monthly equivalent rate" value={Number.isFinite(monthlyEq) ? `${fmt(monthlyEq * 100, 3)}%` : "—"} />
      <LineChart points={path.map((p) => ({ x: p.year, y: p.value }))} />
      <ResultsCopy
        text={`CAGR ${fmt((computed.cagr || 0) * 100, 2)}% · ${money(computed.begin)} → ${money(computed.end)} over ${fmt(computed.years || 0, 2)}y`}
      />
      <ScheduleTable headers={["Year", "Value"]} rows={path.map((p) => [p.year, money(p.value)])} csvName="cagr-path.csv" />
      <FormulaBox>
        <p>CAGR = (End ÷ Begin)^(1 ÷ years) − 1</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== Compound Interest ============================== */

export function CompoundInterest() {
  const [principal, setPrincipal] = React.useState("10000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("10");
  const [compoundFreq, setCompoundFreq] = React.useState("12");
  const [contrib, setContrib] = React.useState("100");
  const [contribFreq, setContribFreq] = React.useState("12");
  const [contribWhen, setContribWhen] = React.useState<"end" | "begin">("end");
  const [inflation, setInflation] = React.useState("0");
  const [mode, setMode] = React.useState<"project" | "goal">("project");
  const [goal, setGoal] = React.useState("100000");

  const p0 = Math.max(0, n(principal) || 0);
  const annual = Math.max(0, n(rate) || 0);
  const y = Math.max(0, n(years) || 0);
  const nCmp = Math.max(1, Math.round(n(compoundFreq) || 12));
  const cAmt = Math.max(0, n(contrib) || 0);
  const cFreq = Math.max(1, Math.round(n(contribFreq) || 12));
  const infl = Math.max(0, n(inflation) || 0);

  const schedule = React.useMemo(() => {
    const periods = Math.round(y * nCmp);
    const r = annual / 100 / nCmp;
    const contribPer = cAmt * (cFreq / nCmp);
    let bal = p0;
    let contributed = p0;
    const rows: { year: number; balance: number; contributed: number; interest: number }[] = [];
    for (let i = 1; i <= periods; i++) {
      if (contribWhen === "begin") {
        bal += contribPer;
        contributed += contribPer;
      }
      bal *= 1 + r;
      if (contribWhen === "end") {
        bal += contribPer;
        contributed += contribPer;
      }
      if (i % nCmp === 0 || i === periods) {
        rows.push({ year: Math.ceil(i / nCmp), balance: bal, contributed, interest: bal - contributed });
      }
    }
    return { fv: bal, contributed, interest: bal - contributed, rows };
  }, [p0, annual, y, nCmp, cAmt, cFreq, contribWhen]);

  const requiredPrincipal = React.useMemo(() => {
    if (mode !== "goal") return NaN;
    const target = Math.max(0, n(goal) || 0);
    const periods = Math.round(y * nCmp);
    const r = annual / 100 / nCmp;
    const contribPer = cAmt * (cFreq / nCmp);
    const growth = Math.pow(1 + r, periods);
    let annuity = 0;
    if (r === 0) annuity = contribPer * periods;
    else if (contribWhen === "end") annuity = contribPer * ((growth - 1) / r);
    else annuity = contribPer * ((growth - 1) / r) * (1 + r);
    return growth ? (target - annuity) / growth : NaN;
  }, [mode, goal, y, nCmp, annual, cAmt, cFreq, contribWhen]);

  const apy = Math.pow(1 + annual / 100 / nCmp, nCmp) - 1;
  const realFv = infl > 0 && y > 0 ? schedule.fv / Math.pow(1 + infl / 100, y) : schedule.fv;

  return (
    <div className="space-y-4">
      <Notice tone="info">Compounding frequency and contribution frequency are separate controls.</Notice>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "project" | "goal")}>
          <option value="project">Project future value</option>
          <option value="goal">Goal — required principal</option>
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={mode === "goal" ? "Target FV" : "Initial amount"}>
          {mode === "goal" ? (
            <Input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} />
          ) : (
            <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          )}
        </Field>
        <Field label="Annual rate %">
          <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Years">
          <Input type="number" step="0.5" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </div>
      <Row>
        <Field label="Compounds per year">
          <Select value={compoundFreq} onChange={(e) => setCompoundFreq(e.target.value)}>
            <option value="365">Daily</option>
            <option value="12">Monthly</option>
            <option value="4">Quarterly</option>
            <option value="2">Semi-annual</option>
            <option value="1">Annual</option>
          </Select>
        </Field>
        <Field label="Contribution amount">
          <Input type="number" min={0} value={contrib} onChange={(e) => setContrib(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Contribution frequency">
          <Select value={contribFreq} onChange={(e) => setContribFreq(e.target.value)}>
            <option value="52">Weekly</option>
            <option value="12">Monthly</option>
            <option value="4">Quarterly</option>
            <option value="1">Yearly</option>
          </Select>
        </Field>
        <Field label="Contribute at">
          <Select value={contribWhen} onChange={(e) => setContribWhen(e.target.value as "end" | "begin")}>
            <option value="end">End of period</option>
            <option value="begin">Beginning of period</option>
          </Select>
        </Field>
      </Row>
      <Field label="Inflation % (optional)">
        <Input type="number" min={0} step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        {mode === "goal" ? (
          <Stat label="Required principal" value={money(requiredPrincipal)} />
        ) : (
          <Stat label="Future value" value={money(schedule.fv)} />
        )}
        <Stat label="Total contributed" value={money(mode === "goal" ? NaN : schedule.contributed)} />
        <Stat label="Total interest" value={money(mode === "goal" ? NaN : schedule.interest)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="APY" value={`${fmt(apy * 100, 3)}%`} />
        {infl > 0 && <Stat label="Real FV" value={money(realFv)} />}
      </div>
      {mode === "project" && (
        <>
          <DonutChart
            center="FV"
            slices={[
              { label: "Contributed", value: schedule.contributed, color: "var(--brand)" },
              { label: "Interest", value: Math.max(0, schedule.interest), color: "#10b981" },
            ]}
          />
          <LineChart points={schedule.rows.map((r) => ({ x: r.year, y: r.balance }))} />
          <ResultsCopy
            text={`FV ${money(schedule.fv)} · Contributed ${money(schedule.contributed)} · Interest ${money(schedule.interest)}`}
          />
          <ScheduleTable
            headers={["Year", "Balance", "Contributed", "Interest"]}
            rows={schedule.rows.map((r) => [r.year, money(r.balance), money(r.contributed), money(r.interest)])}
            csvName="compound-interest.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>A = P(1 + r/n)^(n·t) + contributions · APY = (1 + r/n)^n − 1</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== Inflation ============================== */

const CPI_PRESETS = [
  { label: "India ~5.5%", value: "5.5" },
  { label: "US ~2.5%", value: "2.5" },
  { label: "Euro ~2%", value: "2" },
  { label: "UK ~2.5%", value: "2.5" },
  { label: "PK ~12%", value: "12" },
];

export function InflationCalculator() {
  const [mode, setMode] = React.useState<"future" | "past" | "salary" | "real">("future");
  const [amount, setAmount] = React.useState("1000");
  const [rate, setRate] = React.useState("3.2");
  const [years, setYears] = React.useState("10");
  const [nominal, setNominal] = React.useState("12");

  const a = Math.max(0, n(amount) || 0);
  const r = n(rate) || 0;
  const y = Math.max(0, n(years) || 0);
  const nom = n(nominal) || 0;
  const factor = Math.pow(1 + r / 100, y);
  const future = a * factor;
  const past = factor ? a / factor : 0;
  const realReturn = (1 + nom / 100) / (1 + r / 100) - 1;

  const yearRows = React.useMemo(() => {
    const rows: { year: number; value: number; power: number }[] = [];
    for (let i = 0; i <= Math.min(50, Math.ceil(y)); i++) {
      const f = Math.pow(1 + r / 100, i);
      if (mode === "past") rows.push({ year: i, value: f ? a / f : a, power: f ? 100 / f : 100 });
      else rows.push({ year: i, value: a * f, power: f ? 100 / f : 100 });
    }
    return rows;
  }, [a, r, y, mode]);

  return (
    <div className="space-y-4">
      <Notice tone="info">Pick a CPI-style average for your country, then edit freely.</Notice>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="future">Future purchasing power</option>
          <option value="past">Past purchasing power</option>
          <option value="salary">Salary to keep real income</option>
          <option value="real">Real return (nominal vs inflation)</option>
        </Select>
      </Field>
      <PresetChips label="CPI preset" options={CPI_PRESETS} onPick={setRate} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={mode === "salary" ? "Current income" : "Amount"}>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Avg inflation % / year">
          <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Years">
          <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </div>
      {mode === "real" && (
        <Field label="Nominal return % / year">
          <Input type="number" step="0.1" value={nominal} onChange={(e) => setNominal(e.target.value)} />
        </Field>
      )}
      {mode === "future" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Future equivalent" value={money(future, 2)} />
          <Stat label="Extra needed" value={money(future - a, 2)} />
          <Stat label="Multiplier" value={`${factor.toFixed(3)}×`} />
        </div>
      )}
      {mode === "past" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Past equivalent" value={money(past, 2)} />
          <Stat label="Lost PP" value={money(a - past, 2)} />
          <Stat label="Multiplier" value={`${factor.toFixed(3)}×`} />
        </div>
      )}
      {mode === "salary" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Salary needed later" value={money(future, 2)} />
          <Stat label="Raise needed" value={money(future - a, 2)} />
          <Stat label="Cumulative inflation" value={`${fmt((factor - 1) * 100, 1)}%`} />
        </div>
      )}
      {mode === "real" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Real annual return" value={`${fmt(realReturn * 100, 2)}%`} />
          <Stat label="Nominal" value={`${fmt(nom, 2)}%`} />
          <Stat label="Inflation" value={`${fmt(r, 2)}%`} />
        </div>
      )}
      {mode !== "real" && (
        <>
          <LineChart points={yearRows.map((row) => ({ x: row.year, y: mode === "past" ? row.power : row.value }))} />
          <ResultsCopy
            text={
              mode === "past"
                ? `Past ${money(past)} · ${r}% · ${y}y`
                : `Future ${money(future)} · ${r}% · ${y}y`
            }
          />
          <ScheduleTable
            headers={["Year", "Value", "PP index"]}
            rows={yearRows.map((row) => [row.year, money(row.value, 2), fmt(row.power, 1)])}
            csvName="inflation-yearly.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>Future = A × (1+i)^n · Real ≈ (1+nominal)/(1+inflation) − 1</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== FD ============================== */

type FdCompounding = "monthly" | "quarterly" | "half-yearly" | "yearly" | "simple";

const FD_COMPOUNDING: { value: FdCompounding; label: string; n: number }[] = [
  { value: "monthly", label: "Monthly", n: 12 },
  { value: "quarterly", label: "Quarterly (common for bank FDs)", n: 4 },
  { value: "half-yearly", label: "Half-yearly", n: 2 },
  { value: "yearly", label: "Yearly", n: 1 },
  { value: "simple", label: "Simple interest", n: 0 },
];

export function fdMaturity(principal: number, annualRatePct: number, years: number, compounding: FdCompounding) {
  if (!(principal > 0) || !(years > 0) || !(annualRatePct >= 0)) return { maturity: NaN, interest: NaN };
  const r = annualRatePct / 100;
  if (compounding === "simple" || r === 0) {
    const maturity = principal * (1 + r * years);
    return { maturity, interest: maturity - principal };
  }
  const freq = FD_COMPOUNDING.find((c) => c.value === compounding)?.n ?? 4;
  const maturity = principal * Math.pow(1 + r / freq, freq * years);
  return { maturity, interest: maturity - principal };
}

export function FdCalculator() {
  const [principal, setPrincipal] = React.useState("100000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("3");
  const [months, setMonths] = React.useState("0");
  const [compounding, setCompounding] = React.useState<FdCompounding>("quarterly");
  const [mode, setMode] = React.useState<"project" | "goal">("project");
  const [goal, setGoal] = React.useState("150000");
  const [payout, setPayout] = React.useState<"cumulative" | "monthly" | "quarterly">("cumulative");

  const p = n(principal);
  const annual = n(rate);
  const tenureYears = Math.max(0, n(years) || 0) + Math.max(0, Math.min(11, Math.round(n(months) || 0))) / 12;
  const valid = Number.isFinite(p) && p > 0 && Number.isFinite(annual) && annual >= 0 && tenureYears > 0;

  const { maturity, interest } = valid ? fdMaturity(p, annual, tenureYears, compounding) : { maturity: NaN, interest: NaN };
  const effectiveYield = valid && Number.isFinite(maturity) ? ((maturity / p - 1) / tenureYears) * 100 : NaN;

  const requiredPrincipal = React.useMemo(() => {
    if (mode !== "goal" || !(tenureYears > 0) || !(annual >= 0)) return NaN;
    const target = Math.max(0, n(goal) || 0);
    const r = annual / 100;
    if (compounding === "simple" || r === 0) return target / (1 + r * tenureYears);
    const freq = FD_COMPOUNDING.find((c) => c.value === compounding)?.n ?? 4;
    return target / Math.pow(1 + r / freq, freq * tenureYears);
  }, [mode, goal, tenureYears, annual, compounding]);

  const yearRows = React.useMemo(() => {
    if (!valid) return [];
    const rows: { year: number; value: number; interest: number }[] = [];
    const steps = Math.max(1, Math.ceil(tenureYears));
    for (let i = 1; i <= steps; i++) {
      const t = Math.min(i, tenureYears);
      const { maturity: m, interest: int } = fdMaturity(p, annual, t, compounding);
      rows.push({ year: i, value: m, interest: int });
    }
    return rows;
  }, [valid, p, annual, tenureYears, compounding]);

  const monthlyInterest = payout !== "cumulative" && valid ? interest / (tenureYears * (payout === "monthly" ? 12 : 4)) : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">Bank FD rates and payout rules vary — confirm final maturity with your bank.</Notice>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "project" | "goal")}>
          <option value="project">Project maturity</option>
          <option value="goal">Goal — required deposit</option>
        </Select>
      </Field>
      <PresetChips
        label="Amount"
        options={[
          { label: "₹50k", value: "50000" },
          { label: "₹1L", value: "100000" },
          { label: "₹5L", value: "500000" },
          { label: "₹10L", value: "1000000" },
        ]}
        onPick={mode === "goal" ? setGoal : setPrincipal}
      />
      <Row>
        <Field label={mode === "goal" ? "Target maturity" : "Deposit amount"}>
          {mode === "goal" ? (
            <Input type="number" min={0} value={goal} onChange={(e) => setGoal(e.target.value)} />
          ) : (
            <Input type="number" min={0} value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          )}
        </Field>
        <Field label="Annual interest rate (%)">
          <Input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure — years">
          <Input type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <Field label="Extra months (0–11)">
          <Input type="number" min={0} max={11} value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Compounding">
          <Select value={compounding} onChange={(e) => setCompounding(e.target.value as FdCompounding)}>
            {FD_COMPOUNDING.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Interest payout">
          <Select value={payout} onChange={(e) => setPayout(e.target.value as typeof payout)}>
            <option value="cumulative">Cumulative (at maturity)</option>
            <option value="monthly">Monthly payout (approx)</option>
            <option value="quarterly">Quarterly payout (approx)</option>
          </Select>
        </Field>
      </Row>
      {!valid ? (
        <Notice tone="error">Enter a positive deposit, non-negative rate, and tenure ≥ 1 month.</Notice>
      ) : mode === "goal" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Required deposit" value={money(requiredPrincipal)} />
          <Stat label="Target maturity" value={money(n(goal) || 0)} />
          <Stat label="Tenure" value={`${fmt(tenureYears, 2)} years`} />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Maturity amount" value={money(maturity)} />
            <Stat label="Interest earned" value={money(interest)} />
            <Stat label="Effective annual yield" value={Number.isFinite(effectiveYield) ? `${fmt(effectiveYield, 2)}%` : "—"} />
          </div>
          {payout !== "cumulative" && (
            <Stat label={`${payout === "monthly" ? "Monthly" : "Quarterly"} interest (approx)`} value={money(monthlyInterest)} />
          )}
          <DonutChart
            center="FD"
            slices={[
              { label: "Principal", value: p, color: "var(--brand)" },
              { label: "Interest", value: Math.max(0, interest), color: "#10b981" },
            ]}
          />
          <LineChart points={yearRows.map((row) => ({ x: row.year, y: row.value }))} />
          <ResultsCopy text={`FD maturity ${money(maturity)} · Interest ${money(interest)} · ${fmt(tenureYears, 2)}y @ ${annual}%`} />
          <ScheduleTable
            headers={["Year", "Value", "Interest"]}
            rows={yearRows.map((row) => [row.year, money(row.value), money(row.interest)])}
            csvName="fd-yearly.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>Compound: A = P(1 + r/n)^(n·t) · Simple: A = P(1 + r·t)</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== RD ============================== */

type RdInterestMode = "quarterly" | "simple";

export function rdMaturity(monthlyDeposit: number, annualRatePct: number, tenureMonths: number, mode: RdInterestMode) {
  const invested = monthlyDeposit * tenureMonths;
  if (!(monthlyDeposit > 0) || !(tenureMonths > 0) || !(annualRatePct >= 0)) {
    return { maturity: NaN, interest: NaN, invested: NaN };
  }
  if (mode === "simple" || annualRatePct === 0) {
    const interest = monthlyDeposit * ((tenureMonths * (tenureMonths + 1)) / 2) * (annualRatePct / (12 * 100));
    return { maturity: invested + interest, interest, invested };
  }
  if (tenureMonths % 3 !== 0) return { maturity: NaN, interest: NaN, invested };
  const quarters = tenureMonths / 3;
  const i = annualRatePct / 400;
  const factor = (Math.pow(1 + i, quarters) - 1) / (1 - Math.pow(1 + i, -1 / 3));
  const maturity = monthlyDeposit * factor;
  return { maturity, interest: maturity - invested, invested };
}

export function RdCalculator() {
  const [monthly, setMonthly] = React.useState("5000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("3");
  const [months, setMonths] = React.useState("0");
  const [mode, setMode] = React.useState<RdInterestMode>("quarterly");

  const p = n(monthly);
  const annual = n(rate);
  const tenureMonths = Math.round(Math.max(0, n(years) || 0) * 12 + Math.max(0, Math.min(11, Math.round(n(months) || 0))));
  const quarterlyAligned = mode !== "quarterly" || tenureMonths % 3 === 0;
  const valid = Number.isFinite(p) && p > 0 && Number.isFinite(annual) && annual >= 0 && tenureMonths > 0 && quarterlyAligned;
  const { maturity, interest, invested } = valid
    ? rdMaturity(p, annual, tenureMonths, mode)
    : { maturity: NaN, interest: NaN, invested: NaN };

  const yearRows = React.useMemo(() => {
    if (!valid) return [];
    const rows: { year: number; invested: number; value: number }[] = [];
    const maxY = Math.ceil(tenureMonths / 12);
    for (let y = 1; y <= maxY; y++) {
      let m = y * 12;
      if (mode === "quarterly") m = Math.min(tenureMonths, Math.floor(m / 3) * 3);
      else m = Math.min(tenureMonths, m);
      if (m < 1) continue;
      const res = rdMaturity(p, annual, m, mode);
      rows.push({ year: y, invested: res.invested, value: res.maturity });
    }
    return rows;
  }, [valid, p, annual, tenureMonths, mode]);

  let error = "";
  if (!Number.isFinite(p) || p <= 0) error = "Monthly deposit must be positive.";
  else if (!Number.isFinite(annual) || annual < 0) error = "Rate cannot be negative.";
  else if (tenureMonths <= 0) error = "Set tenure to at least 1 month.";
  else if (mode === "quarterly" && tenureMonths % 3 !== 0) {
    error = "Quarterly compounding needs tenure in whole quarters (multiples of 3 months).";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">Quarterly compounding uses the common bank RD closed-form formula for planning.</Notice>
      <PresetChips
        label="Deposit"
        options={[
          { label: "₹1k", value: "1000" },
          { label: "₹5k", value: "5000" },
          { label: "₹10k", value: "10000" },
          { label: "₹25k", value: "25000" },
        ]}
        onPick={setMonthly}
      />
      <Row>
        <Field label="Monthly deposit">
          <Input type="number" min={0} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure — years">
          <Input type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <Field label="Extra months (0–11)">
          <Input type="number" min={0} max={11} value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
      </Row>
      <Field label="Interest method">
        <Select value={mode} onChange={(e) => setMode(e.target.value as RdInterestMode)}>
          <option value="quarterly">Quarterly compounding</option>
          <option value="simple">Simple interest</option>
        </Select>
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Maturity amount" value={money(maturity)} />
            <Stat label="Interest earned" value={money(interest)} />
            <Stat label="Total deposited" value={money(invested)} />
          </div>
          <Stat label="Installments" value={tenureMonths} />
          <DonutChart
            center="RD"
            slices={[
              { label: "Deposited", value: invested, color: "var(--brand)" },
              { label: "Interest", value: Math.max(0, interest), color: "#10b981" },
            ]}
          />
          <LineChart points={yearRows.map((row) => ({ x: row.year, y: row.value }))} />
          <ResultsCopy text={`RD maturity ${money(maturity)} · Interest ${money(interest)} · Deposited ${money(invested)}`} />
          <ScheduleTable
            headers={["Year", "Invested", "Value"]}
            rows={yearRows.map((row) => [row.year, money(row.invested), money(row.value)])}
            csvName="rd-yearly.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>Quarterly RD: M = P × [((1+i)^n − 1) / (1 − (1+i)^(-1/3))], i = rate/400, n = months/3</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== PPF ============================== */

export function ppfMaturity(yearlyContribution: number, annualRatePct: number, years: number, openingBalance = 0) {
  if (!(yearlyContribution >= 0) || !(annualRatePct >= 0) || !(years > 0) || openingBalance < 0) {
    return { invested: NaN, maturity: NaN, interest: NaN, rows: [] as { year: number; deposit: number; balance: number }[] };
  }
  const r = annualRatePct / 100;
  const nYears = Math.max(1, Math.round(years));
  let balance = openingBalance;
  let contributions = 0;
  const rows: { year: number; deposit: number; balance: number }[] = [];
  for (let y = 0; y < nYears; y++) {
    balance += yearlyContribution;
    contributions += yearlyContribution;
    balance *= 1 + r;
    rows.push({ year: y + 1, deposit: yearlyContribution, balance });
  }
  const invested = openingBalance + contributions;
  return { invested, maturity: balance, interest: balance - invested, rows };
}

export function PpfCalculator() {
  const [yearly, setYearly] = React.useState("150000");
  const [rate, setRate] = React.useState("7.1");
  const [years, setYears] = React.useState("15");
  const [opening, setOpening] = React.useState("0");
  const [extend, setExtend] = React.useState(false);

  const contribution = n(yearly);
  const annual = n(rate);
  const tenure = Math.round(n(years) || 0) + (extend ? 5 : 0);
  const openBal = n(opening) || 0;
  const valid =
    Number.isFinite(contribution) &&
    contribution >= 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    tenure > 0 &&
    openBal >= 0 &&
    (contribution > 0 || openBal > 0);

  const result = valid
    ? ppfMaturity(contribution, annual, tenure, openBal)
    : { invested: NaN, maturity: NaN, interest: NaN, rows: [] as { year: number; deposit: number; balance: number }[] };

  const overLimit = contribution > 150000;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        PPF rules (limits, lock-in, notified rate) can change. Yearly compounding model for planning only.
      </Notice>
      <PresetChips
        label="Yearly"
        options={[
          { label: "₹50k", value: "50000" },
          { label: "₹1L", value: "100000" },
          { label: "₹1.5L max", value: "150000" },
        ]}
        onPick={setYearly}
      />
      <PresetChips
        label="Tenure"
        options={[
          { label: "15y", value: "15" },
          { label: "20y", value: "20" },
          { label: "25y", value: "25" },
        ]}
        onPick={setYears}
      />
      <Row>
        <Field label="Yearly contribution" hint="Common planning max ₹1,50,000">
          <Input type="number" min={0} value={yearly} onChange={(e) => setYearly(e.target.value)} />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input type="number" min={0} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure (years)" hint="Standard block 15 years">
          <Input type="number" min={1} value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <Field label="Opening balance (optional)">
          <Input type="number" min={0} value={opening} onChange={(e) => setOpening(e.target.value)} />
        </Field>
      </Row>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={extend} onChange={(e) => setExtend(e.target.checked)} />
        Add one 5-year extension block
      </label>
      {overLimit && <Notice tone="error">Contribution exceeds the common ₹1.5L annual PPF limit — reduce for realistic planning.</Notice>}
      {!valid ? (
        <Notice tone="error">Enter contribution or opening balance, plus rate and tenure ≥ 1 year.</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total invested" value={money(result.invested)} />
            <Stat label="Interest earned" value={money(result.interest)} />
            <Stat label="Maturity value" value={money(result.maturity)} />
          </div>
          <Stat label="Tenure used" value={`${tenure} years @ ${fmt(annual, 2)}%`} />
          <DonutChart
            center="PPF"
            slices={[
              { label: "Invested", value: result.invested, color: "var(--brand)" },
              { label: "Interest", value: Math.max(0, result.interest), color: "#10b981" },
            ]}
          />
          <LineChart points={result.rows.map((row) => ({ x: row.year, y: row.balance }))} />
          <ResultsCopy
            text={`PPF maturity ${money(result.maturity)} · Invested ${money(result.invested)} · Interest ${money(result.interest)}`}
          />
          <ScheduleTable
            headers={["Year", "Deposit", "Balance"]}
            rows={result.rows.map((row) => [row.year, money(row.deposit), money(row.balance)])}
            csvName="ppf-yearly.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>Each year: balance += contribution, then balance × (1 + rate). Opening balance compounds from year 1.</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== SWP ============================== */

export function swpProjection(corpus: number, monthlyWithdrawal: number, annualRatePct: number, years: number) {
  if (!(corpus > 0) || !(monthlyWithdrawal > 0) || !(annualRatePct >= 0) || !(years > 0)) {
    return {
      totalWithdrawn: NaN,
      finalCorpus: NaN,
      returnsEarned: NaN,
      monthsLasted: 0,
      depleted: false,
      yearRows: [] as { year: number; withdrawn: number; balance: number }[],
    };
  }
  const months = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 100 / 12;
  let balance = corpus;
  let totalWithdrawn = 0;
  let monthsLasted = 0;
  let depleted = false;
  const yearRows: { year: number; withdrawn: number; balance: number }[] = [];
  let yearWithdrawn = 0;

  for (let m = 0; m < months; m++) {
    balance *= 1 + r;
    if (balance <= 0) {
      depleted = true;
      break;
    }
    if (balance < monthlyWithdrawal) {
      totalWithdrawn += balance;
      yearWithdrawn += balance;
      balance = 0;
      monthsLasted = m + 1;
      depleted = true;
      yearRows.push({ year: Math.ceil(monthsLasted / 12), withdrawn: yearWithdrawn, balance: 0 });
      break;
    }
    balance -= monthlyWithdrawal;
    totalWithdrawn += monthlyWithdrawal;
    yearWithdrawn += monthlyWithdrawal;
    monthsLasted = m + 1;
    if ((m + 1) % 12 === 0 || m === months - 1) {
      yearRows.push({ year: Math.ceil((m + 1) / 12), withdrawn: yearWithdrawn, balance });
      yearWithdrawn = 0;
    }
  }

  return {
    totalWithdrawn,
    finalCorpus: balance,
    returnsEarned: totalWithdrawn + balance - corpus,
    monthsLasted,
    depleted,
    yearRows,
  };
}

function maxSustainableWithdrawal(corpus: number, annualRatePct: number, years: number) {
  const months = Math.max(1, Math.round(years * 12));
  let lo = 0;
  let hi = corpus;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const res = swpProjection(corpus, mid, annualRatePct, years);
    if (res.depleted) hi = mid;
    else lo = mid;
  }
  return lo;
}

export function SwpCalculator() {
  const [mode, setMode] = React.useState<"project" | "sustain">("project");
  const [corpus, setCorpus] = React.useState("1000000");
  const [withdrawal, setWithdrawal] = React.useState("10000");
  const [rate, setRate] = React.useState("10");
  const [years, setYears] = React.useState("10");
  const [stepUp, setStepUp] = React.useState("0");

  const c = n(corpus);
  const w = n(withdrawal);
  const annual = n(rate);
  const y = n(years);
  const monthsPlanned = Math.max(0, Math.round((Number.isFinite(y) ? y : 0) * 12));
  const step = Math.max(0, n(stepUp) || 0);

  let error = "";
  if (!Number.isFinite(c) || c <= 0) error = "Initial corpus must be positive.";
  else if (mode === "project" && (!Number.isFinite(w) || w <= 0)) error = "Monthly withdrawal must be positive.";
  else if (!Number.isFinite(annual) || annual < 0) error = "Expected return cannot be negative.";
  else if (!Number.isFinite(y) || y <= 0) error = "Tenure must be greater than zero.";

  const sustainable = !error && mode === "sustain" ? maxSustainableWithdrawal(c, annual, y) : NaN;

  const result = React.useMemo(() => {
    if (error) {
      return {
        totalWithdrawn: NaN,
        finalCorpus: NaN,
        returnsEarned: NaN,
        monthsLasted: 0,
        depleted: false,
        yearRows: [] as { year: number; withdrawn: number; balance: number }[],
      };
    }
    const monthly = mode === "sustain" ? sustainable : w;
    if (!(monthly > 0)) {
      return {
        totalWithdrawn: NaN,
        finalCorpus: NaN,
        returnsEarned: NaN,
        monthsLasted: 0,
        depleted: false,
        yearRows: [] as { year: number; withdrawn: number; balance: number }[],
      };
    }
    if (step <= 0) return swpProjection(c, monthly, annual, y);

    // step-up withdrawals
    const months = Math.max(1, Math.round(y * 12));
    const r = annual / 100 / 12;
    let balance = c;
    let totalWithdrawn = 0;
    let monthsLasted = 0;
    let depleted = false;
    const yearRows: { year: number; withdrawn: number; balance: number }[] = [];
    let yearWithdrawn = 0;
    for (let m = 0; m < months; m++) {
      balance *= 1 + r;
      const pay = monthly * Math.pow(1 + step / 100, Math.floor(m / 12));
      if (balance < pay) {
        totalWithdrawn += Math.max(0, balance);
        yearWithdrawn += Math.max(0, balance);
        balance = 0;
        monthsLasted = m + 1;
        depleted = true;
        yearRows.push({ year: Math.ceil(monthsLasted / 12), withdrawn: yearWithdrawn, balance: 0 });
        break;
      }
      balance -= pay;
      totalWithdrawn += pay;
      yearWithdrawn += pay;
      monthsLasted = m + 1;
      if ((m + 1) % 12 === 0 || m === months - 1) {
        yearRows.push({ year: Math.ceil((m + 1) / 12), withdrawn: yearWithdrawn, balance });
        yearWithdrawn = 0;
      }
    }
    return {
      totalWithdrawn,
      finalCorpus: balance,
      returnsEarned: totalWithdrawn + balance - c,
      monthsLasted,
      depleted,
      yearRows,
    };
  }, [error, mode, sustainable, w, c, annual, y, step]);

  return (
    <div className="space-y-4">
      <Notice tone="info">Assumes constant monthly return before each withdrawal — planning only, not advice.</Notice>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "project" | "sustain")}>
          <option value="project">Project withdrawals</option>
          <option value="sustain">Max sustainable withdrawal</option>
        </Select>
      </Field>
      <Row>
        <Field label="Initial corpus">
          <Input type="number" min={0} value={corpus} onChange={(e) => setCorpus(e.target.value)} />
        </Field>
        {mode === "project" ? (
          <Field label="Monthly withdrawal">
            <Input type="number" min={0} value={withdrawal} onChange={(e) => setWithdrawal(e.target.value)} />
          </Field>
        ) : (
          <Field label="Sustainable monthly (computed)">
            <Input type="number" value={Number.isFinite(sustainable) ? String(Math.round(sustainable)) : ""} readOnly />
          </Field>
        )}
      </Row>
      <Row>
        <Field label="Expected annual return (%)">
          <Input type="number" min={0} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label="Tenure (years)">
          <Input type="number" min={0} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </Row>
      {mode === "project" && (
        <Field label="Annual withdrawal step-up (%)" hint="Optional — raise withdrawals each year">
          <Input type="number" min={0} value={stepUp} onChange={(e) => setStepUp(e.target.value)} />
        </Field>
      )}
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          {result.depleted && (
            <Notice tone="error">
              Corpus would run out after {result.monthsLasted} month{result.monthsLasted === 1 ? "" : "s"}
              {monthsPlanned > result.monthsLasted ? ` (before planned ${monthsPlanned} months).` : "."}
            </Notice>
          )}
          {mode === "sustain" && (
            <Stat label="Max sustainable monthly withdrawal" value={money(sustainable)} />
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total withdrawn" value={money(result.totalWithdrawn)} />
            <Stat label="Estimated returns" value={money(result.returnsEarned)} />
            <Stat label="Final corpus" value={money(result.finalCorpus)} />
          </div>
          <LineChart points={result.yearRows.map((row) => ({ x: row.year, y: row.balance }))} />
          <ResultsCopy
            text={`SWP withdrawn ${money(result.totalWithdrawn)} · Final ${money(result.finalCorpus)} · Returns ${money(result.returnsEarned)}`}
          />
          <ScheduleTable
            headers={["Year", "Withdrawn (that year)", "Ending balance"]}
            rows={result.yearRows.map((row) => [row.year, money(row.withdrawn), money(row.balance)])}
            csvName="swp-yearly.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>Each month: balance × (1 + r/12), then subtract withdrawal. Sustainable mode binary-searches max withdrawal that lasts the full tenure.</p>
      </FormulaBox>
    </div>
  );
}

/* ============================== Lumpsum ============================== */

type LumpsumCompounding = "yearly" | "monthly";

export function lumpsumMaturity(
  principal: number,
  annualRatePct: number,
  years: number,
  compounding: LumpsumCompounding = "yearly",
) {
  if (!(principal > 0) || !(years > 0) || !(annualRatePct >= 0)) return { maturity: NaN, gains: NaN };
  const r = annualRatePct / 100;
  if (r === 0) return { maturity: principal, gains: 0 };
  const maturity =
    compounding === "monthly" ? principal * Math.pow(1 + r / 12, 12 * years) : principal * Math.pow(1 + r, years);
  return { maturity, gains: maturity - principal };
}

export function LumpsumCalculator() {
  const [mode, setMode] = React.useState<"project" | "goal">("project");
  const [principal, setPrincipal] = React.useState("100000");
  const [goal, setGoal] = React.useState("500000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("10");
  const [months, setMonths] = React.useState("0");
  const [compounding, setCompounding] = React.useState<LumpsumCompounding>("yearly");
  const [inflation, setInflation] = React.useState("0");

  const p = n(principal);
  const annual = n(rate);
  const tenureYears = Math.max(0, n(years) || 0) + Math.max(0, Math.min(11, Math.round(n(months) || 0))) / 12;
  const infl = Math.max(0, n(inflation) || 0);
  const valid = Number.isFinite(p) && p > 0 && Number.isFinite(annual) && annual >= 0 && tenureYears > 0;

  const result = React.useMemo(
    () => (valid ? lumpsumMaturity(p, annual, tenureYears, compounding) : { maturity: NaN, gains: NaN }),
    [valid, p, annual, tenureYears, compounding],
  );

  const requiredPrincipal = React.useMemo(() => {
    if (mode !== "goal" || !(tenureYears > 0) || !(annual >= 0)) return NaN;
    const target = Math.max(0, n(goal) || 0);
    const r = annual / 100;
    if (r === 0) return target;
    return compounding === "monthly"
      ? target / Math.pow(1 + r / 12, 12 * tenureYears)
      : target / Math.pow(1 + r, tenureYears);
  }, [mode, goal, tenureYears, annual, compounding]);

  const realMaturity =
    mode === "project" && infl > 0 && tenureYears > 0 && Number.isFinite(result.maturity)
      ? result.maturity / Math.pow(1 + infl / 100, tenureYears)
      : result.maturity;

  const yearRows = React.useMemo(() => {
    if (!valid && mode === "project") return [];
    const base = mode === "goal" ? requiredPrincipal : p;
    if (!(base > 0)) return [];
    const steps = Math.max(1, Math.ceil(tenureYears));
    const rows: { year: number; value: number }[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = Math.min(i, tenureYears);
      rows.push({ year: i, value: lumpsumMaturity(base, annual, t, compounding).maturity });
    }
    return rows;
  }, [valid, mode, p, requiredPrincipal, annual, tenureYears, compounding]);

  return (
    <div className="space-y-4">
      <Notice tone="info">Compound growth at your assumed annual return — markets vary; planning only.</Notice>
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "project" | "goal")}>
          <option value="project">Project maturity</option>
          <option value="goal">Goal — required lumpsum</option>
        </Select>
      </Field>
      <PresetChips
        label="Amount"
        options={[
          { label: "₹1L", value: "100000" },
          { label: "₹5L", value: "500000" },
          { label: "₹10L", value: "1000000" },
          { label: "₹25L", value: "2500000" },
        ]}
        onPick={mode === "goal" ? setGoal : setPrincipal}
      />
      <Row>
        <Field label={mode === "goal" ? "Target corpus" : "Lumpsum investment"}>
          {mode === "goal" ? (
            <Input type="number" min={0} value={goal} onChange={(e) => setGoal(e.target.value)} />
          ) : (
            <Input type="number" min={0} value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          )}
        </Field>
        <Field label="Expected annual return (%)">
          <Input type="number" min={0} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure (years)">
          <Input type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <Field label="Extra months (0–11)">
          <Input type="number" min={0} max={11} value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Compounding">
          <Select value={compounding} onChange={(e) => setCompounding(e.target.value as LumpsumCompounding)}>
            <option value="yearly">Yearly (common for MF planners)</option>
            <option value="monthly">Monthly</option>
          </Select>
        </Field>
        <Field label="Inflation % (optional)">
          <Input type="number" min={0} step="0.1" value={inflation} onChange={(e) => setInflation(e.target.value)} />
        </Field>
      </Row>
      {mode === "goal" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Required lumpsum" value={money(requiredPrincipal)} />
          <Stat label="Target" value={money(n(goal) || 0)} />
          <Stat label="Tenure" value={`${fmt(tenureYears, 2)} years`} />
        </div>
      ) : !valid ? (
        <Notice tone="error">Enter positive investment, non-negative return, and tenure &gt; 0.</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total invested" value={money(p)} />
            <Stat label="Estimated returns" value={money(result.gains)} />
            <Stat label="Maturity value" value={money(result.maturity)} />
          </div>
          {infl > 0 && <Stat label="Inflation-adjusted maturity" value={money(realMaturity)} />}
          <DonutChart
            center="Lumpsum"
            slices={[
              { label: "Invested", value: p, color: "var(--brand)" },
              { label: "Returns", value: Math.max(0, result.gains), color: "#10b981" },
            ]}
          />
        </>
      )}
      {(mode === "goal" || valid) && (
        <>
          <LineChart points={yearRows.map((row) => ({ x: row.year, y: row.value }))} />
          <ResultsCopy
            text={
              mode === "goal"
                ? `Required lumpsum ${money(requiredPrincipal)} → ${money(n(goal) || 0)} in ${fmt(tenureYears, 2)}y @ ${annual}%`
                : `Lumpsum ${money(p)} → ${money(result.maturity)} · Gains ${money(result.gains)}`
            }
          />
          <ScheduleTable
            headers={["Year", "Value"]}
            rows={yearRows.map((row) => [row.year, money(row.value)])}
            csvName="lumpsum-yearly.csv"
          />
        </>
      )}
      <FormulaBox>
        <p>Yearly: A = P(1+r)^t · Monthly: A = P(1+r/12)^(12t)</p>
      </FormulaBox>
    </div>
  );
}
