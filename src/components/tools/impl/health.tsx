"use client";

import * as React from "react";
import { Input, Select } from "@/components/ui/primitives";
import { Field, Stat, Notice } from "@/components/tools/shared";
import { Icon } from "@/components/ui/Icon";

/* --------------------------------- helpers --------------------------------- */
const n = (s: string) => {
  const v = parseFloat(s);
  return isFinite(v) ? v : 0;
};
const toKg = (v: number, unit: string) => (unit === "lb" ? v / 2.20462 : v);
const r1 = (v: number) => Math.round(v * 10) / 10;

function Disclaimer({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs text-muted">
      <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        {children ??
          "This is an estimate for general information only and is not medical advice. Consult a healthcare professional for personal guidance."}
      </span>
    </p>
  );
}

function WeightInputs({
  weight,
  setWeight,
  unit,
  setUnit,
  label = "Body weight",
}: {
  weight: string;
  setWeight: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  label?: string;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="font-mono"
        />
        <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-24">
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </Select>
      </div>
    </Field>
  );
}

/* ============================= Water Intake =============================== */
export function WaterIntake() {
  const [weight, setWeight] = React.useState("70");
  const [unit, setUnit] = React.useState("kg");
  const [exercise, setExercise] = React.useState("30");
  const [climate, setClimate] = React.useState("normal");

  const ml = React.useMemo(() => {
    const kg = toKg(n(weight), unit);
    let total = kg * 35 + (n(exercise) / 30) * 350;
    if (climate === "hot") total *= 1.1;
    return Math.max(0, total);
  }, [weight, unit, exercise, climate]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <WeightInputs weight={weight} setWeight={setWeight} unit={unit} setUnit={setUnit} />
        <Field label="Exercise per day (minutes)">
          <Input type="number" value={exercise} onChange={(e) => setExercise(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Climate">
          <Select value={climate} onChange={(e) => setClimate(e.target.value)}>
            <option value="normal">Temperate</option>
            <option value="hot">Hot / humid</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Litres / day" value={r1(ml / 1000)} />
        <Stat label="Cups (240 ml)" value={Math.round(ml / 240)} />
        <Stat label="Bottles (500 ml)" value={r1(ml / 500)} />
      </div>
      <Disclaimer>Needs vary with health, pregnancy and medication — this is a general guide, not medical advice.</Disclaimer>
    </div>
  );
}

/* ================================ Macros ================================== */
const MACRO_STYLES: Record<string, { p: number; c: number; f: number; label: string }> = {
  balanced: { p: 30, c: 40, f: 30, label: "Balanced (30/40/30)" },
  "high-protein": { p: 40, c: 30, f: 30, label: "High protein (40/30/30)" },
  "low-carb": { p: 40, c: 20, f: 40, label: "Low carb (40/20/40)" },
  keto: { p: 25, c: 5, f: 70, label: "Keto (25/5/70)" },
};

export function MacroCalculator() {
  const [calories, setCalories] = React.useState("2000");
  const [style, setStyle] = React.useState("balanced");
  const [meals, setMeals] = React.useState("3");

  const rows = React.useMemo(() => {
    const cal = n(calories);
    const s = MACRO_STYLES[style];
    const m = Math.max(1, n(meals));
    const macro = (pct: number, calPerG: number) => {
      const grams = (cal * (pct / 100)) / calPerG;
      return { grams: Math.round(grams), perMeal: Math.round(grams / m), pct };
    };
    return {
      Protein: macro(s.p, 4),
      Carbs: macro(s.c, 4),
      Fat: macro(s.f, 9),
    };
  }, [calories, style, meals]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Daily calories">
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Diet style">
          <Select value={style} onChange={(e) => setStyle(e.target.value)}>
            {Object.entries(MACRO_STYLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Meals per day">
          <Select value={meals} onChange={(e) => setMeals(e.target.value)}>
            {[3, 4, 5, 6].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Macro</th>
              <th className="px-4 py-2 text-right font-medium">% cals</th>
              <th className="px-4 py-2 text-right font-medium">Grams / day</th>
              <th className="px-4 py-2 text-right font-medium">Per meal</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rows).map(([k, v]) => (
              <tr key={k} className="border-t border-border">
                <td className="px-4 py-2.5 font-medium">{k}</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted">{v.pct}%</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-brand">{v.grams} g</td>
                <td className="px-4 py-2.5 text-right font-mono">{v.perMeal} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Disclaimer />
    </div>
  );
}

/* =========================== Heart Rate Zones ============================= */
const HR_ZONES = [
  { name: "Zone 1 — Recovery", lo: 0.5, hi: 0.6 },
  { name: "Zone 2 — Fat burn", lo: 0.6, hi: 0.7 },
  { name: "Zone 3 — Aerobic", lo: 0.7, hi: 0.8 },
  { name: "Zone 4 — Anaerobic", lo: 0.8, hi: 0.9 },
  { name: "Zone 5 — VO₂ max", lo: 0.9, hi: 1.0 },
];

export function HeartRateZones() {
  const [age, setAge] = React.useState("30");
  const [resting, setResting] = React.useState("60");

  const { maxHR, tanaka, useKarvonen, zones } = React.useMemo(() => {
    const a = n(age);
    const max = 220 - a;
    const rest = n(resting);
    const karvonen = rest > 0 && rest < max;
    const hrr = max - rest;
    const zones = HR_ZONES.map((z) => ({
      name: z.name,
      lo: Math.round(karvonen ? rest + hrr * z.lo : max * z.lo),
      hi: Math.round(karvonen ? rest + hrr * z.hi : max * z.hi),
    }));
    return { maxHR: max, tanaka: Math.round(208 - 0.7 * a), useKarvonen: karvonen, zones };
  }, [age, resting]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Age">
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Resting heart rate (bpm, optional)" hint="Enables the more accurate Karvonen method">
          <Input type="number" value={resting} onChange={(e) => setResting(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Max HR (220 − age)" value={`${maxHR} bpm`} />
        <Stat label="Max HR (Tanaka)" value={`${tanaka} bpm`} />
      </div>
      <div className="space-y-2">
        {zones.map((z) => (
          <div
            key={z.name}
            className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2.5"
          >
            <span className="text-sm font-medium">{z.name}</span>
            <span className="font-mono text-sm font-semibold text-brand">
              {z.lo}–{z.hi} bpm
            </span>
          </div>
        ))}
      </div>
      <Disclaimer>
        {useKarvonen
          ? "Using the Karvonen (heart-rate-reserve) method with your resting HR."
          : "Enter your resting heart rate for more accurate, personalised zones."}
      </Disclaimer>
    </div>
  );
}

/* ============================ Calories Burned ============================= */
const ACTIVITIES: { name: string; met: number }[] = [
  { name: "Walking (3 mph)", met: 3.5 },
  { name: "Walking, brisk (4 mph)", met: 5.0 },
  { name: "Running (6 mph)", met: 9.8 },
  { name: "Running (8 mph)", met: 11.8 },
  { name: "Cycling, moderate", met: 8.0 },
  { name: "Cycling, vigorous", met: 10.0 },
  { name: "Swimming, laps", met: 8.3 },
  { name: "Jump rope", met: 12.3 },
  { name: "Weight training", met: 5.0 },
  { name: "Yoga", met: 2.5 },
  { name: "HIIT", met: 8.0 },
  { name: "Hiking", met: 6.0 },
  { name: "Rowing machine", met: 7.0 },
  { name: "Elliptical", met: 5.0 },
  { name: "Dancing", met: 5.5 },
  { name: "Soccer", met: 7.0 },
  { name: "Basketball", met: 6.5 },
  { name: "Tennis", met: 7.3 },
];

export function CaloriesBurned() {
  const [activity, setActivity] = React.useState(ACTIVITIES[2].name);
  const [weight, setWeight] = React.useState("70");
  const [unit, setUnit] = React.useState("kg");
  const [minutes, setMinutes] = React.useState("30");

  const { kcal, perHour } = React.useMemo(() => {
    const met = ACTIVITIES.find((a) => a.name === activity)?.met ?? 5;
    const kg = toKg(n(weight), unit);
    const perMin = (met * 3.5 * kg) / 200;
    return { kcal: Math.round(perMin * n(minutes)), perHour: Math.round(perMin * 60) };
  }, [activity, weight, unit, minutes]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Activity">
          <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
            {ACTIVITIES.map((a) => (
              <option key={a.name}>{a.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Duration (minutes)">
          <Input type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="font-mono" />
        </Field>
        <WeightInputs weight={weight} setWeight={setWeight} unit={unit} setUnit={setUnit} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Calories burned" value={`${kcal} kcal`} />
        <Stat label="Rate" value={`${perHour} kcal/hr`} />
      </div>
      <Disclaimer>Based on MET values; actual burn varies with intensity, fitness and body composition.</Disclaimer>
    </div>
  );
}

/* ============================== One Rep Max =============================== */
const RM_TABLE = [
  [1, 100], [2, 97], [3, 94], [4, 92], [5, 89], [6, 86],
  [7, 83], [8, 81], [9, 78], [10, 75], [12, 71], [15, 65],
];

export function OneRepMax() {
  const [weight, setWeight] = React.useState("100");
  const [reps, setReps] = React.useState("5");
  const [unit, setUnit] = React.useState("kg");

  const { oneRM, epley, brzycki } = React.useMemo(() => {
    const w = n(weight);
    const rp = n(reps);
    if (w <= 0 || rp <= 0 || rp >= 37) return { oneRM: 0, epley: 0, brzycki: 0 };
    const ep = w * (1 + rp / 30);
    const br = (w * 36) / (37 - rp);
    return { oneRM: Math.round((ep + br) / 2), epley: Math.round(ep), brzycki: Math.round(br) };
  }, [weight, reps]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <WeightInputs weight={weight} setWeight={setWeight} unit={unit} setUnit={setUnit} label="Weight lifted" />
        <Field label="Reps performed" hint="Best results with 1–10 reps">
          <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Estimated 1RM" value={`${oneRM} ${unit}`} />
        <Stat label="Epley" value={`${epley} ${unit}`} />
        <Stat label="Brzycki" value={`${brzycki} ${unit}`} />
      </div>
      <Field label="Training percentages">
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Reps</th>
                <th className="px-4 py-2 text-right font-medium">% of 1RM</th>
                <th className="px-4 py-2 text-right font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {RM_TABLE.map(([rp, pct]) => (
                <tr key={rp} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{rp}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted">{pct}%</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {oneRM ? Math.round((oneRM * pct) / 100) : 0} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Field>
      <Disclaimer>Estimates only — warm up properly and use a spotter for near-maximal lifts.</Disclaimer>
    </div>
  );
}

/* ============================== Pace Calc ================================= */
function parseTime(s: string): number | null {
  const parts = s.trim().split(":").map((p) => p.trim());
  if (parts.some((p) => p !== "" && !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 1) return nums[0] * 60;
  return null;
}
function fmtDur(sec: number): string {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function PaceCalculator() {
  const [distance, setDistance] = React.useState("5");
  const [unit, setUnit] = React.useState("km");
  const [time, setTime] = React.useState("25:00");

  const res = React.useMemo(() => {
    const dist = n(distance);
    const sec = parseTime(time);
    if (!dist || sec === null || sec <= 0) return null;
    const distKm = unit === "mi" ? dist * 1.60934 : dist;
    const distMi = distKm / 1.60934;
    const paceKm = sec / distKm;
    const paceMi = sec / distMi;
    const speedKmh = distKm / (sec / 3600);
    const races = [
      ["5K", 5],
      ["10K", 10],
      ["Half marathon", 21.0975],
      ["Marathon", 42.195],
    ] as const;
    return {
      paceKm: fmtDur(paceKm),
      paceMi: fmtDur(paceMi),
      speedKmh: r1(speedKmh),
      speedMph: r1(speedKmh / 1.60934),
      projections: races.map(([name, km]) => [name, fmtDur(paceKm * km)] as const),
    };
  }, [distance, unit, time]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Distance">
          <div className="flex gap-2">
            <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="font-mono" />
            <Select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-24">
              <option value="km">km</option>
              <option value="mi">mi</option>
            </Select>
          </div>
        </Field>
        <Field label="Time" hint="hh:mm:ss or mm:ss">
          <Input value={time} onChange={(e) => setTime(e.target.value)} className="font-mono" />
        </Field>
      </div>
      {!res ? (
        <Notice tone="error">Enter a distance and a time like 25:00.</Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pace / km" value={res.paceKm} />
            <Stat label="Pace / mile" value={res.paceMi} />
            <Stat label="Speed" value={`${res.speedKmh} km/h`} />
            <Stat label="Speed" value={`${res.speedMph} mph`} />
          </div>
          <Field label="Projected race times at this pace">
            <div className="grid gap-2 sm:grid-cols-2">
              {res.projections.map(([name, t]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2.5"
                >
                  <span className="text-sm text-muted">{name}</span>
                  <span className="font-mono text-sm font-semibold text-brand">{t}</span>
                </div>
              ))}
            </div>
          </Field>
        </>
      )}
    </div>
  );
}

/* ================================= BAC ==================================== */
export function BacCalculator() {
  const [weight, setWeight] = React.useState("75");
  const [unit, setUnit] = React.useState("kg");
  const [sex, setSex] = React.useState("male");
  const [drinks, setDrinks] = React.useState("2");
  const [hours, setHours] = React.useState("1");

  const { bac, sober, status, tone } = React.useMemo(() => {
    const kg = toKg(n(weight), unit);
    const grams = n(drinks) * 14; // one US standard drink ≈ 14 g alcohol
    const r = sex === "female" ? 0.55 : 0.68;
    const massG = kg * 1000;
    let b = massG > 0 ? (grams / (massG * r)) * 100 - 0.015 * n(hours) : 0;
    b = Math.max(0, b);
    const sober = b > 0 ? b / 0.015 : 0;
    let status = "Minimal impairment";
    let tone: "success" | "error" = "success";
    if (b >= 0.08) {
      status = "Over the 0.08% legal driving limit (most US states)";
      tone = "error";
    } else if (b >= 0.05) {
      status = "Impaired — over the limit in many countries (0.05%)";
      tone = "error";
    } else if (b >= 0.02) {
      status = "Mild impairment — do not drive";
      tone = "error";
    }
    return { bac: b, sober, status, tone };
  }, [weight, unit, sex, drinks, hours]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <WeightInputs weight={weight} setWeight={setWeight} unit={unit} setUnit={setUnit} />
        <Field label="Sex">
          <Select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
        <Field label="Standard drinks" hint="1 drink ≈ 14 g alcohol (12 oz beer, 5 oz wine, 1.5 oz spirits)">
          <Input type="number" value={drinks} onChange={(e) => setDrinks(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Hours since first drink">
          <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Estimated BAC" value={`${bac.toFixed(3)}%`} />
        <Stat label="Time to sober (0.00%)" value={sober > 0 ? `~${r1(sober)} hr` : "—"} />
      </div>
      <Notice tone={tone}>{status}</Notice>
      <Disclaimer>
        A rough Widmark estimate only. Many factors affect real BAC. Never use this to decide whether to drive — if you
        have been drinking, do not drive.
      </Disclaimer>
    </div>
  );
}

/* =========================== Protein Intake ============================== */
const PROTEIN_GOALS: Record<string, { lo: number; hi: number; label: string }> = {
  sedentary: { lo: 0.8, hi: 1.0, label: "Sedentary / general health" },
  active: { lo: 1.2, hi: 1.4, label: "Active / endurance" },
  build: { lo: 1.6, hi: 2.2, label: "Build muscle" },
  cut: { lo: 2.0, hi: 2.4, label: "Cutting (preserve muscle)" },
};

export function ProteinIntake() {
  const [weight, setWeight] = React.useState("70");
  const [unit, setUnit] = React.useState("kg");
  const [goal, setGoal] = React.useState("build");

  const { lo, hi } = React.useMemo(() => {
    const kg = toKg(n(weight), unit);
    const g = PROTEIN_GOALS[goal];
    return { lo: Math.round(kg * g.lo), hi: Math.round(kg * g.hi) };
  }, [weight, unit, goal]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <WeightInputs weight={weight} setWeight={setWeight} unit={unit} setUnit={setUnit} />
        <Field label="Goal">
          <Select value={goal} onChange={(e) => setGoal(e.target.value)}>
            {Object.entries(PROTEIN_GOALS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Stat label="Recommended protein" value={`${lo}–${hi} g / day`} />
      <Disclaimer />
    </div>
  );
}

/* ========================== Waist-to-Hip Ratio =========================== */
export function WaistToHip() {
  const [waist, setWaist] = React.useState("80");
  const [hip, setHip] = React.useState("100");
  const [sex, setSex] = React.useState("male");

  const { ratio, category, tone } = React.useMemo(() => {
    const w = n(waist);
    const h = n(hip);
    if (h <= 0) return { ratio: 0, category: "Enter your hip measurement", tone: "success" as const };
    const ratio = w / h;
    const [mod, high] = sex === "female" ? [0.8, 0.85] : [0.9, 1.0];
    let category = "Low health risk";
    let tone: "success" | "error" = "success";
    if (ratio >= high) {
      category = "High health risk";
      tone = "error";
    } else if (ratio >= mod) {
      category = "Moderate health risk";
      tone = "error";
    }
    return { ratio, category, tone };
  }, [waist, hip, sex]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Waist" hint="Same unit as hip">
          <Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Hip">
          <Input type="number" value={hip} onChange={(e) => setHip(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Sex">
          <Select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </Field>
      </div>
      <Stat label="Waist-to-hip ratio" value={ratio ? ratio.toFixed(2) : "—"} />
      <Notice tone={tone}>{category}</Notice>
      <Disclaimer />
    </div>
  );
}

/* =========================== Body Surface Area =========================== */
export function BodySurfaceArea() {
  const [height, setHeight] = React.useState("175");
  const [weight, setWeight] = React.useState("70");

  const rows = React.useMemo(() => {
    const h = n(height);
    const w = n(weight);
    if (h <= 0 || w <= 0) return null;
    return {
      Mosteller: Math.sqrt((h * w) / 3600),
      "Du Bois": 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425),
      Haycock: 0.024265 * Math.pow(h, 0.3964) * Math.pow(w, 0.5378),
    };
  }, [height, weight]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Height (cm)">
          <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="font-mono" />
        </Field>
        <Field label="Weight (kg)">
          <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="font-mono" />
        </Field>
      </div>
      {!rows ? (
        <Notice tone="error">Enter a valid height and weight.</Notice>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(rows).map(([k, v]) => (
            <Stat key={k} label={`${k} (m²)`} value={v.toFixed(2)} />
          ))}
        </div>
      )}
      <Disclaimer />
    </div>
  );
}
