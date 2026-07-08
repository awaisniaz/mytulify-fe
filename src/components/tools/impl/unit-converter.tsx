"use client";

import * as React from "react";
import { Input, Select } from "@/components/ui/primitives";
import { CopyButton, Field, Notice } from "@/components/tools/shared";

/* ============================ Factor-based engine =========================== */
type Units = Record<string, number>; // unit label -> factor relative to base

function round(n: number): string {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9 || abs < 1e-6) return n.toExponential(6).replace(/\.?0+e/, "e");
  return parseFloat(n.toPrecision(8)).toString();
}

export function FactorConverter({
  units,
  from,
  to,
  defaultValue = 1,
}: {
  units: Units;
  from: string;
  to: string;
  defaultValue?: number;
}) {
  const keys = Object.keys(units);
  const [value, setValue] = React.useState(String(defaultValue));
  const [u1, setU1] = React.useState(from);
  const [u2, setU2] = React.useState(to);

  const num = parseFloat(value);
  const base = num * units[u1];
  const result = base / units[u2];

  return (
    <div className="space-y-5">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Field label="From">
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          <Select className="mt-2" value={u1} onChange={(e) => setU1(e.target.value)}>
            {keys.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
        <button
          onClick={() => {
            setU1(u2);
            setU2(u1);
          }}
          className="mb-1 hidden h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 hover:bg-border sm:grid"
          title="Swap"
        >
          ⇄
        </button>
        <Field label="To">
          <Input readOnly value={isNaN(num) ? "" : round(result)} className="font-mono" />
          <Select className="mt-2" value={u2} onChange={(e) => setU2(e.target.value)}>
            {keys.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Field>
      </div>
      {!isNaN(num) && (
        <Notice tone="info">
          {round(num)} {u1} = <strong>{round(result)} {u2}</strong>
        </Notice>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map((k) => (
          <div key={k} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <span className="text-muted">{k}</span>
            <span className="font-mono">{isNaN(num) ? "—" : round(base / units[k])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Configs ---------------------------------- */
export const LENGTH: Units = {
  Meter: 1, Kilometer: 1000, Centimeter: 0.01, Millimeter: 0.001, Micrometer: 1e-6,
  Mile: 1609.344, Yard: 0.9144, Foot: 0.3048, Inch: 0.0254, "Nautical Mile": 1852,
};
export const WEIGHT: Units = {
  Gram: 1, Kilogram: 1000, Milligram: 0.001, "Metric Tonne": 1e6,
  Pound: 453.59237, Ounce: 28.349523, Stone: 6350.29,
};
export const VOLUME: Units = {
  Liter: 1, Milliliter: 0.001, "Cubic Meter": 1000, "Gallon (US)": 3.785411784,
  "Gallon (UK)": 4.54609, Quart: 0.946352946, Pint: 0.473176473, Cup: 0.2365882365,
  "Fluid Ounce": 0.0295735296, Tablespoon: 0.0147867648, Teaspoon: 0.0049289216,
};
export const AREA: Units = {
  "Square Meter": 1, "Square Kilometer": 1e6, "Square Centimeter": 1e-4,
  Hectare: 1e4, Acre: 4046.8564224, "Square Mile": 2589988.11, "Square Foot": 0.09290304,
  "Square Yard": 0.83612736, "Square Inch": 0.00064516,
};
export const SPEED: Units = {
  "Meter/second": 1, "Kilometer/hour": 0.277777778, "Mile/hour": 0.44704,
  "Foot/second": 0.3048, Knot: 0.514444444, Mach: 343,
};
export const TIME: Units = {
  Second: 1, Millisecond: 0.001, Minute: 60, Hour: 3600, Day: 86400,
  Week: 604800, Month: 2629800, Year: 31557600,
};
export const PRESSURE: Units = {
  Pascal: 1, Kilopascal: 1000, Bar: 1e5, PSI: 6894.757293, Atmosphere: 101325, "mmHg": 133.322,
};
export const ENERGY: Units = {
  Joule: 1, Kilojoule: 1000, Calorie: 4.184, Kilocalorie: 4184,
  "Watt-hour": 3600, "Kilowatt-hour": 3.6e6, BTU: 1055.06, Electronvolt: 1.602e-19,
};
export const POWER: Units = {
  Watt: 1, Kilowatt: 1000, Megawatt: 1e6, Horsepower: 745.699872, "BTU/hour": 0.29307107,
};
export const FORCE: Units = { Newton: 1, Kilonewton: 1000, "Pound-force": 4.4482216, "Kilogram-force": 9.80665, Dyne: 1e-5 };
export const ANGLE: Units = { Degree: 1, Radian: 57.29577951, Gradian: 0.9, Arcminute: 1 / 60, Arcsecond: 1 / 3600 };
export const DATA: Units = {
  Byte: 1, Kilobyte: 1024, Megabyte: 1024 ** 2, Gigabyte: 1024 ** 3, Terabyte: 1024 ** 4,
  Petabyte: 1024 ** 5, Bit: 1 / 8, Kilobit: 128, Megabit: 131072,
};
export const DATARATE: Units = {
  "Bit/s": 1, "Kbit/s": 1000, "Mbit/s": 1e6, "Gbit/s": 1e9,
  "Byte/s": 8, "KB/s": 8000, "MB/s": 8e6,
};
export const DENSITY: Units = { "kg/m³": 1, "g/cm³": 1000, "g/mL": 1000, "lb/ft³": 16.0185, "lb/in³": 27679.9 };
export const FREQUENCY: Units = { Hertz: 1, Kilohertz: 1000, Megahertz: 1e6, Gigahertz: 1e9, RPM: 1 / 60 };
export const COOKING: Units = {
  Cup: 236.588, Tablespoon: 14.7868, Teaspoon: 4.92892, Milliliter: 1,
  "Fluid Ounce": 29.5735, "Gram (water)": 1, Pint: 473.176,
};

/* ------------------------------ Temperature -------------------------------- */
export function TemperatureConverter() {
  const [val, setVal] = React.useState("100");
  const [unit, setUnit] = React.useState<"C" | "F" | "K">("C");
  const n = parseFloat(val);
  let c = NaN;
  if (!isNaN(n)) c = unit === "C" ? n : unit === "F" ? (n - 32) * (5 / 9) : n - 273.15;
  const out = { Celsius: c, Fahrenheit: c * (9 / 5) + 32, Kelvin: c + 273.15 };
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Value">
          <Input type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        </Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as "C")}>
            <option value="C">Celsius (°C)</option>
            <option value="F">Fahrenheit (°F)</option>
            <option value="K">Kelvin (K)</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(out).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface-2 p-4 text-center">
            <div className="text-2xl font-bold text-brand">{isNaN(v) ? "—" : round(v)}</div>
            <div className="mt-1 text-xs text-muted">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Fuel consumption ------------------------------ */
export function FuelConverter() {
  const [val, setVal] = React.useState("8");
  const [unit, setUnit] = React.useState<"l100" | "mpgUS" | "mpgUK" | "kml">("l100");
  const n = parseFloat(val);
  // convert everything via L/100km
  let l100 = NaN;
  if (!isNaN(n) && n > 0) {
    if (unit === "l100") l100 = n;
    else if (unit === "kml") l100 = 100 / n;
    else if (unit === "mpgUS") l100 = 235.215 / n;
    else l100 = 282.481 / n;
  }
  const out = {
    "L/100km": l100,
    "km/L": 100 / l100,
    "MPG (US)": 235.215 / l100,
    "MPG (UK)": 282.481 / l100,
  };
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Value">
          <Input type="number" value={val} onChange={(e) => setVal(e.target.value)} />
        </Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as "l100")}>
            <option value="l100">L/100km</option>
            <option value="kml">km/L</option>
            <option value="mpgUS">MPG (US)</option>
            <option value="mpgUK">MPG (UK)</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(out).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-surface-2 p-4 text-center">
            <div className="text-xl font-bold text-brand">{isNaN(v) ? "—" : round(v)}</div>
            <div className="mt-1 text-xs text-muted">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Roman numerals ------------------------------- */
const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
function toRoman(n: number): string {
  if (n <= 0 || n >= 4000) return "—";
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) (out += s), (n -= v);
  return out;
}
function fromRoman(s: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const cur = map[up[i]] ?? 0;
    const next = map[up[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}
export function RomanConverter() {
  const [num, setNum] = React.useState("2024");
  const [rom, setRom] = React.useState("MMXXIV");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Number → Roman" hint="1 to 3999">
        <Input
          value={num}
          onChange={(e) => {
            setNum(e.target.value);
            setRom(toRoman(parseInt(e.target.value || "0", 10)));
          }}
        />
        <div className="mt-2 flex items-center gap-2">
          <Input readOnly value={toRoman(parseInt(num || "0", 10))} className="font-mono text-lg" />
          <CopyButton value={toRoman(parseInt(num || "0", 10))} />
        </div>
      </Field>
      <Field label="Roman → Number">
        <Input value={rom} onChange={(e) => setRom(e.target.value)} className="font-mono" />
        <div className="mt-2 flex items-center gap-2">
          <Input readOnly value={String(fromRoman(rom))} className="font-mono text-lg" />
          <CopyButton value={String(fromRoman(rom))} />
        </div>
      </Field>
    </div>
  );
}

/* --------------------------- Number to words ------------------------------- */
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALE = ["", "thousand", "million", "billion", "trillion"];
function threeToWords(n: number): string {
  let s = "";
  if (n >= 100) {
    s += ONES[Math.floor(n / 100)] + " hundred";
    n %= 100;
    if (n) s += " ";
  }
  if (n >= 20) {
    s += TENS[Math.floor(n / 10)];
    if (n % 10) s += "-" + ONES[n % 10];
  } else if (n > 0) s += ONES[n];
  return s;
}
export function numberToWords(n: number): string {
  if (n === 0) return "zero";
  if (n < 0) return "negative " + numberToWords(-n);
  const groups: number[] = [];
  let x = Math.floor(n);
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i]) parts.push(threeToWords(groups[i]) + (SCALE[i] ? " " + SCALE[i] : ""));
  }
  return parts.join(" ");
}
export function NumberToWords() {
  const [val, setVal] = React.useState("12345");
  const n = parseInt(val.replace(/[^0-9-]/g, ""), 10);
  const words = isNaN(n) ? "" : numberToWords(n);
  const cap = words ? words[0].toUpperCase() + words.slice(1) : "";
  return (
    <div className="space-y-4">
      <Field label="Number">
        <Input value={val} onChange={(e) => setVal(e.target.value)} />
      </Field>
      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-lg capitalize">{cap || <span className="text-muted">…</span>}</p>
      </div>
      <CopyButton value={cap} />
    </div>
  );
}

/* ----------------------------- Base converter ------------------------------ */
export function BaseConverter() {
  const [dec, setDec] = React.useState("42");
  const n = parseInt(dec, 10);
  const ok = !isNaN(n);
  const rows: [string, string][] = [
    ["Binary", ok ? (n >>> 0).toString(2) : ""],
    ["Octal", ok ? n.toString(8) : ""],
    ["Decimal", ok ? n.toString(10) : ""],
    ["Hexadecimal", ok ? n.toString(16).toUpperCase() : ""],
  ];
  return (
    <div className="space-y-4">
      <Field label="Decimal number" hint="Or paste binary/hex and read the rest">
        <Input value={dec} onChange={(e) => setDec(e.target.value)} />
      </Field>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
            <span className="w-28 text-sm text-muted">{k}</span>
            <span className="min-w-0 flex-1 break-all font-mono">{v || "—"}</span>
            <CopyButton value={v} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Time zone ----------------------------------- */
const ZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Africa/Cairo", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka",
  "Asia/Bangkok", "Asia/Shanghai", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney",
  "Pacific/Auckland",
];
export function TimeZoneConverter() {
  const [time, setTime] = React.useState("12:00");
  const [date, setDate] = React.useState("2026-06-07");
  const [from, setFrom] = React.useState("Asia/Karachi");
  const base = React.useMemo(() => {
    try {
      // interpret the entered wall-clock time as being in `from` zone
      const naive = new Date(`${date}T${time}:00`);
      const asUTC = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
      const asZone = new Date(naive.toLocaleString("en-US", { timeZone: from }));
      const diff = asUTC.getTime() - asZone.getTime();
      return new Date(naive.getTime() + diff);
    } catch {
      return null;
    }
  }, [time, date, from]);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="From zone">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ZONES.map((z) => (
          <div key={z} className="rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm">
            <div className="text-xs text-muted">{z.replace(/_/g, " ")}</div>
            <div className="font-mono">
              {base
                ? base.toLocaleString("en-US", {
                    timeZone: z,
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Generic size chart ---------------------------- */
export function SizeChart({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-muted">
          <tr>{headers.map((h) => <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-4 py-2 font-mono">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export const RingSizeConverter = () => (
  <SizeChart headers={["US", "UK", "EU", "Diameter (mm)"]} rows={[
    [5, "J½", 49, 15.7], [6, "L½", 52, 16.5], [7, "N½", 54, 17.3], [8, "P½", 57, 18.1],
    [9, "R½", 59, 18.9], [10, "T½", 62, 19.8], [11, "V½", 64, 20.6], [12, "X½", 67, 21.4],
  ]} />
);
export const BraSizeConverter = () => (
  <SizeChart headers={["US", "UK", "EU", "FR"]} rows={[
    ["32A", "32A", "70A", "85A"], ["34B", "34B", "75B", "90B"], ["36C", "36C", "80C", "95C"],
    ["38D", "38D", "85D", "100D"], ["40DD", "40DD", "90E", "105E"],
  ]} />
);
export const ClothingSizeConverter = () => (
  <SizeChart headers={["US", "UK", "EU", "Intl"]} rows={[
    [4, 8, 36, "XS"], [6, 10, 38, "S"], [8, 12, 40, "M"], [10, 14, 42, "L"], [12, 16, 44, "XL"], [14, 18, 46, "XXL"],
  ]} />
);

/* --------------------------- Shoe size chart ------------------------------- */
export function ShoeSizeConverter() {
  // Men's approximate chart
  const rows = [
    [6, 5.5, 39, 24], [6.5, 6, 39, 24.5], [7, 6.5, 40, 25], [7.5, 7, 40.5, 25.5],
    [8, 7.5, 41, 26], [8.5, 8, 42, 26.5], [9, 8.5, 42.5, 27], [9.5, 9, 43, 27.5],
    [10, 9.5, 44, 28], [10.5, 10, 44.5, 28.5], [11, 10.5, 45, 29], [12, 11.5, 46, 30],
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-muted">
          <tr>
            {["US", "UK", "EU", "CM"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2 font-mono">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
