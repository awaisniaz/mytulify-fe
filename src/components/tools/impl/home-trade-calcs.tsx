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
  if (months <= 0 || principal <= 0) return 0;
  const r = annualPct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

function futureValue(present: number, payment: number, annualPct: number, years: number) {
  const r = annualPct / 100 / 12;
  const n = Math.max(0, years * 12);
  if (r === 0) return present + payment * n;
  return present * Math.pow(1 + r, n) + payment * ((Math.pow(1 + r, n) - 1) / r);
}

const WIRES = [
  { awg: "14", cm: 4110, amp: 15 },
  { awg: "12", cm: 6530, amp: 20 },
  { awg: "10", cm: 10380, amp: 30 },
  { awg: "8", cm: 16510, amp: 40 },
  { awg: "6", cm: 26240, amp: 55 },
  { awg: "4", cm: 41740, amp: 70 },
  { awg: "2", cm: 66360, amp: 95 },
  { awg: "1/0", cm: 105600, amp: 125 },
  { awg: "2/0", cm: 133100, amp: 145 },
  { awg: "4/0", cm: 211600, amp: 195 },
];

function voltageDrop(amps: number, feet: number, cm: number, metal: "copper" | "aluminum", phase: "1" | "3") {
  const k = metal === "copper" ? 12.9 : 21.2;
  const factor = phase === "1" ? 2 : 1.732;
  if (cm <= 0) return 0;
  return (factor * k * amps * feet) / cm;
}

function Stats({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <Stat key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/* --------------------------------- BTU ------------------------------------ */
export function BtuCalculator() {
  const [length, setLength] = React.useState("20");
  const [width, setWidth] = React.useState("15");
  const [height, setHeight] = React.useState("8");
  const [sun, setSun] = React.useState("25");
  const [people, setPeople] = React.useState("2");
  const [windows, setWindows] = React.useState("2");
  const [kitchen, setKitchen] = React.useState("no");
  const sq = num(length) * num(width);
  const base = sq * (num(height) / 8) * num(sun);
  const btu = base + Math.max(0, num(people) - 2) * 600 + num(windows) * 1000 + (kitchen === "yes" ? 4000 : 0);
  const tons = btu / 12000;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Room length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Room width (ft)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Ceiling height (ft)"><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        <Field label="Sun exposure">
          <Select value={sun} onChange={(e) => setSun(e.target.value)}>
            <option value="20">Shaded (20 BTU/sq ft)</option>
            <option value="25">Average (25 BTU/sq ft)</option>
            <option value="30">Sunny (30 BTU/sq ft)</option>
          </Select>
        </Field>
        <Field label="People in the room"><Input type="number" value={people} onChange={(e) => setPeople(e.target.value)} /></Field>
        <Field label="Large windows"><Input type="number" value={windows} onChange={(e) => setWindows(e.target.value)} /></Field>
        <Field label="Kitchen in this space">
          <Select value={kitchen} onChange={(e) => setKitchen(e.target.value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["Cooling BTU", fmt(btu, 0)], ["AC tons", fmt(tons, 2)], ["Floor area", `${fmt(sq, 0)} sq ft`], ["BTU per sq ft", sq > 0 ? fmt(btu / sq, 1) : "—"]]} />
      <Notice tone="info">Rule-of-thumb cooling load: area × (ceiling ÷ 8) × sun factor, plus 600 BTU per person after the second, 1,000 per large window, and 4,000 for a kitchen. This is not a Manual J load calculation.</Notice>
      <CopyResult filename="btu.txt" rows={[["BTU", fmt(btu, 0)], ["Tons", fmt(tons, 2)]]} />
    </Box>
  );
}

/* ------------------------------ AC tonnage -------------------------------- */
export function AcTonnageCalculator() {
  const [sqft, setSqft] = React.useState("1800");
  const [insulation, setInsulation] = React.useState("25");
  const [climate, setClimate] = React.useState("1");
  const btu = num(sqft) * num(insulation) * num(climate);
  const tons = btu / 12000;
  const rounded = Math.ceil(tons * 2) / 2;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Home or zone size (sq ft)"><Input type="number" value={sqft} onChange={(e) => setSqft(e.target.value)} /></Field>
        <Field label="Insulation">
          <Select value={insulation} onChange={(e) => setInsulation(e.target.value)}>
            <option value="20">Good (20 BTU/sq ft)</option>
            <option value="25">Average (25 BTU/sq ft)</option>
            <option value="30">Poor (30 BTU/sq ft)</option>
            <option value="35">Very poor (35 BTU/sq ft)</option>
          </Select>
        </Field>
        <Field label="Climate">
          <Select value={climate} onChange={(e) => setClimate(e.target.value)}>
            <option value="0.9">Mild</option>
            <option value="1">Moderate</option>
            <option value="1.15">Hot</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["Exact tons", fmt(tons, 2)], ["Size to ask for", `${fmt(rounded, 1)} ton`], ["Cooling BTU", fmt(btu, 0)], ["BTU per sq ft", fmt(num(insulation) * num(climate), 1)]]} />
      <Notice tone="info">One ton of cooling is 12,000 BTU/hour. The suggested size rounds up to the next half ton. Confirm with a load calculation before you buy equipment.</Notice>
      <CopyResult filename="ac-tonnage.txt" rows={[["Tons", fmt(tons, 2)], ["Rounded", fmt(rounded, 1)], ["BTU", fmt(btu, 0)]]} />
    </Box>
  );
}

/* --------------------------------- CFM ------------------------------------ */
export function CfmCalculator() {
  const [length, setLength] = React.useState("20");
  const [width, setWidth] = React.useState("15");
  const [height, setHeight] = React.useState("8");
  const [ach, setAch] = React.useState("6");
  const volume = num(length) * num(width) * num(height);
  const cfm = (volume * num(ach)) / 60;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Width (ft)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Height (ft)"><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        <Field label="Air changes per hour" hint="Homes often 4–6, workshops higher"><Input type="number" value={ach} onChange={(e) => setAch(e.target.value)} /></Field>
      </div>
      <Stats items={[["Required CFM", fmt(cfm, 1)], ["Room volume", `${fmt(volume, 0)} cu ft`], ["Air changes", fmt(num(ach), 1)], ["CFM per sq ft", num(length) * num(width) > 0 ? fmt(cfm / (num(length) * num(width)), 2) : "—"]]} />
      <Notice tone="info">CFM = room cubic feet × air changes per hour ÷ 60.</Notice>
      <CopyResult filename="cfm.txt" rows={[["CFM", fmt(cfm, 1)], ["Volume", fmt(volume, 0)]]} />
    </Box>
  );
}

export function AirChangesCalculator() {
  const [volume, setVolume] = React.useState("2400");
  const [cfm, setCfm] = React.useState("200");
  const ach = num(volume) > 0 ? (num(cfm) * 60) / num(volume) : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Room volume (cu ft)"><Input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} /></Field>
        <Field label="Fan or hood CFM"><Input type="number" value={cfm} onChange={(e) => setCfm(e.target.value)} /></Field>
      </div>
      <Stats items={[["Air changes / hour", fmt(ach, 2)], ["Minutes per change", ach > 0 ? fmt(60 / ach, 1) : "—"], ["CFM", fmt(num(cfm), 0)], ["Volume", fmt(num(volume), 0)]]} />
      <Notice tone="info">ACH = CFM × 60 ÷ cubic feet. A higher number means the air in the room is replaced faster.</Notice>
      <CopyResult filename="air-changes.txt" rows={[["ACH", fmt(ach, 2)]]} />
    </Box>
  );
}

/* -------------------------------- Lumber ---------------------------------- */
export function LumberCalculator() {
  const [thick, setThick] = React.useState("1.5");
  const [width, setWidth] = React.useState("3.5");
  const [length, setLength] = React.useState("8");
  const [count, setCount] = React.useState("10");
  const [price, setPrice] = React.useState("8");
  const one = (num(thick) * num(width) * num(length)) / 12;
  const total = one * num(count);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Thickness (in)" hint="A 2x4 is 1.5 × 3.5"><Input type="number" value={thick} onChange={(e) => setThick(e.target.value)} /></Field>
        <Field label="Width (in)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Number of boards"><Input type="number" value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <Field label="Price per board"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      </div>
      <Stats items={[["Board feet each", fmt(one, 2)], ["Total board feet", fmt(total, 2)], ["Linear feet", fmt(num(length) * num(count), 1)], ["Lumber cost", money(num(count) * num(price))]]} />
      <Notice tone="info">Board feet = thickness (in) × width (in) × length (ft) ÷ 12. Use the actual dressed size, not the nominal 2×4 name.</Notice>
      <CopyResult filename="lumber.txt" rows={[["Board feet", fmt(total, 2)], ["Cost", money(num(count) * num(price))]]} />
    </Box>
  );
}

export function DeckCalculator() {
  const [length, setLength] = React.useState("16");
  const [width, setWidth] = React.useState("12");
  const [board, setBoard] = React.useState("5.5");
  const [gap, setGap] = React.useState("0.125");
  const [spacing, setSpacing] = React.useState("16");
  const span = (num(board) + num(gap)) / 12;
  const boards = span > 0 ? Math.ceil(num(width) / span) : 0;
  const joists = Math.ceil((num(length) * 12) / num(spacing)) + 1;
  const area = num(length) * num(width);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Deck length (ft)" hint="Joists run this way"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Deck width (ft)" hint="Decking runs this way"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Board face width (in)"><Input type="number" value={board} onChange={(e) => setBoard(e.target.value)} /></Field>
        <Field label="Gap between boards (in)"><Input type="number" value={gap} onChange={(e) => setGap(e.target.value)} /></Field>
        <Field label="Joist spacing (in)"><Input type="number" value={spacing} onChange={(e) => setSpacing(e.target.value)} /></Field>
      </div>
      <Stats items={[["Deck boards", fmt(boards, 0)], ["Board length", `${fmt(num(length), 1)} ft`], ["Joists", fmt(joists, 0)], ["Deck area", `${fmt(area, 0)} sq ft`]]} />
      <Notice tone="info">Board count covers the width including gaps. Joists are spaced along the length, plus one at the end. Add posts, beams, and fasteners from your local span tables.</Notice>
      <CopyResult filename="deck.txt" rows={[["Boards", String(boards)], ["Joists", String(joists)], ["Area", fmt(area, 0)]]} />
    </Box>
  );
}

export function SprayFoamCalculator() {
  const [area, setArea] = React.useState("400");
  const [thick, setThick] = React.useState("2");
  const [kit, setKit] = React.useState("600");
  const [price, setPrice] = React.useState("450");
  const boardFeet = num(area) * num(thick);
  const kits = num(kit) > 0 ? Math.ceil(boardFeet / num(kit)) : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Wall or roof area (sq ft)"><Input type="number" value={area} onChange={(e) => setArea(e.target.value)} /></Field>
        <Field label="Foam thickness (in)"><Input type="number" value={thick} onChange={(e) => setThick(e.target.value)} /></Field>
        <Field label="Kit yield (board feet)"><Input type="number" value={kit} onChange={(e) => setKit(e.target.value)} /></Field>
        <Field label="Price per kit"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      </div>
      <Stats items={[["Board feet", fmt(boardFeet, 0)], ["Kits", fmt(kits, 0)], ["Material cost", money(kits * num(price))], ["Coverage / kit", `${fmt(num(thick) > 0 ? num(kit) / num(thick) : 0, 0)} sq ft`]]} />
      <Notice tone="info">Spray foam board feet = square feet × inches of thickness. A kit rated 600 board feet covers 300 sq ft at 2 inches.</Notice>
      <CopyResult filename="spray-foam.txt" rows={[["Board feet", fmt(boardFeet, 0)], ["Kits", String(kits)]]} />
    </Box>
  );
}

export function MiterAngleCalculator() {
  const [sides, setSides] = React.useState("4");
  const n = Math.max(3, num(sides));
  const miter = 180 / n;
  const interior = ((n - 2) * 180) / n;
  return (
    <Box>
      <Field label="Number of equal sides"><Input type="number" value={sides} onChange={(e) => setSides(e.target.value)} /></Field>
      <Stats items={[["Miter saw angle", `${fmt(miter, 2)}°`], ["Interior corner", `${fmt(interior, 2)}°`], ["Sides", fmt(n, 0)], ["Supplement", `${fmt(90 - miter, 2)}°`]]} />
      <Notice tone="info">For a regular frame, each miter is 180° ÷ number of sides. A square picture frame is 45°. A hexagon is 30°.</Notice>
      <CopyResult filename="miter.txt" rows={[["Miter", fmt(miter, 2)], ["Interior", fmt(interior, 2)]]} />
    </Box>
  );
}

export function KerfCalculator() {
  const [stock, setStock] = React.useState("96");
  const [piece, setPiece] = React.useState("16");
  const [kerf, setKerf] = React.useState("0.125");
  const [count, setCount] = React.useState("1");
  const each = num(piece) + num(kerf);
  const perBoard = each > 0 ? Math.floor((num(stock) + num(kerf)) / each) : 0;
  const boards = perBoard > 0 ? Math.ceil(num(count) / perBoard) : 0;
  const waste = boards * num(stock) - num(count) * num(piece);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Board length (in)"><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
        <Field label="Finished piece (in)"><Input type="number" value={piece} onChange={(e) => setPiece(e.target.value)} /></Field>
        <Field label="Saw kerf (in)"><Input type="number" value={kerf} onChange={(e) => setKerf(e.target.value)} /></Field>
        <Field label="Pieces needed"><Input type="number" value={count} onChange={(e) => setCount(e.target.value)} /></Field>
      </div>
      <Stats items={[["Pieces per board", fmt(perBoard, 0)], ["Boards to buy", fmt(boards, 0)], ["Kerf lost / cut", `${fmt(num(kerf), 3)} in`], ["Leftover stock", `${fmt(Math.max(0, waste), 1)} in`]]} />
      <Notice tone="info">Each cut consumes the kerf. Piece count per board is (board + kerf) ÷ (piece + kerf), rounded down.</Notice>
      <CopyResult filename="kerf.txt" rows={[["Per board", String(perBoard)], ["Boards", String(boards)]]} />
    </Box>
  );
}

/* ------------------------------ Electrical -------------------------------- */
export function OhmsLawCalculator() {
  const [known, setKnown] = React.useState("vi");
  const [a, setA] = React.useState("120");
  const [b, setB] = React.useState("10");
  let volts = 0, amps = 0, ohms = 0;
  if (known === "vi") { volts = num(a); amps = num(b); ohms = amps !== 0 ? volts / amps : 0; }
  else if (known === "vr") { volts = num(a); ohms = num(b); amps = ohms !== 0 ? volts / ohms : 0; }
  else { amps = num(a); ohms = num(b); volts = amps * ohms; }
  const watts = volts * amps;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Known values">
          <Select value={known} onChange={(e) => setKnown(e.target.value)}>
            <option value="vi">Voltage and current</option>
            <option value="vr">Voltage and resistance</option>
            <option value="ir">Current and resistance</option>
          </Select>
        </Field>
        <Field label={known === "ir" ? "Current (amps)" : "Voltage (volts)"}><Input type="number" value={a} onChange={(e) => setA(e.target.value)} /></Field>
        <Field label={known === "vi" ? "Current (amps)" : "Resistance (ohms)"}><Input type="number" value={b} onChange={(e) => setB(e.target.value)} /></Field>
      </div>
      <Stats items={[["Voltage", `${fmt(volts, 2)} V`], ["Current", `${fmt(amps, 3)} A`], ["Resistance", `${fmt(ohms, 2)} Ω`], ["Power", `${fmt(watts, 1)} W`]]} />
      <Notice tone="info">Ohm’s law: voltage = current × resistance. Power = voltage × current.</Notice>
      <CopyResult filename="ohms-law.txt" rows={[["Volts", fmt(volts, 2)], ["Amps", fmt(amps, 3)], ["Ohms", fmt(ohms, 2)], ["Watts", fmt(watts, 1)]]} />
    </Box>
  );
}

export function VoltageDropCalculator() {
  const [amps, setAmps] = React.useState("20");
  const [feet, setFeet] = React.useState("80");
  const [awg, setAwg] = React.useState("12");
  const [metal, setMetal] = React.useState<"copper" | "aluminum">("copper");
  const [phase, setPhase] = React.useState<"1" | "3">("1");
  const [voltage, setVoltage] = React.useState("120");
  const wire = WIRES.find((w) => w.awg === awg) ?? WIRES[1];
  const drop = voltageDrop(num(amps), num(feet), wire.cm, metal, phase);
  const pct = num(voltage) > 0 ? (drop / num(voltage)) * 100 : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Load (amps)"><Input type="number" value={amps} onChange={(e) => setAmps(e.target.value)} /></Field>
        <Field label="One-way distance (ft)"><Input type="number" value={feet} onChange={(e) => setFeet(e.target.value)} /></Field>
        <Field label="Wire size">
          <Select value={awg} onChange={(e) => setAwg(e.target.value)}>{WIRES.map((w) => <option key={w.awg} value={w.awg}>{w.awg} AWG</option>)}</Select>
        </Field>
        <Field label="Conductor">
          <Select value={metal} onChange={(e) => setMetal(e.target.value as "copper" | "aluminum")}>
            <option value="copper">Copper</option>
            <option value="aluminum">Aluminum</option>
          </Select>
        </Field>
        <Field label="Phase">
          <Select value={phase} onChange={(e) => setPhase(e.target.value as "1" | "3")}>
            <option value="1">Single phase</option>
            <option value="3">Three phase</option>
          </Select>
        </Field>
        <Field label="Source voltage"><Input type="number" value={voltage} onChange={(e) => setVoltage(e.target.value)} /></Field>
      </div>
      <Stats items={[["Voltage drop", `${fmt(drop, 2)} V`], ["Drop percent", `${fmt(pct, 2)}%`], ["Voltage at load", `${fmt(num(voltage) - drop, 1)} V`], ["Circular mils", fmt(wire.cm, 0)]]} />
      <Notice tone="info">Uses VD = factor × K × amps × feet ÷ circular mils. K is 12.9 for copper and 21.2 for aluminum. Factor is 2 for single phase and 1.732 for three phase. Branch circuits are often kept near 3% drop. This is a planning estimate, not an installation design.</Notice>
      <CopyResult filename="voltage-drop.txt" rows={[["Drop V", fmt(drop, 2)], ["Drop %", fmt(pct, 2)]]} />
    </Box>
  );
}

export function WireSizeCalculator() {
  const [amps, setAmps] = React.useState("24");
  const [feet, setFeet] = React.useState("100");
  const [voltage, setVoltage] = React.useState("240");
  const [maxDrop, setMax] = React.useState("3");
  const [metal, setMetal] = React.useState<"copper" | "aluminum">("copper");
  const [phase, setPhase] = React.useState<"1" | "3">("1");
  const rows = WIRES.map((w) => {
    const drop = voltageDrop(num(amps), num(feet), w.cm, metal, phase);
    const pct = num(voltage) > 0 ? (drop / num(voltage)) * 100 : 100;
    const ampOk = num(amps) <= w.amp;
    return { ...w, drop, pct, ok: ampOk && pct <= num(maxDrop) };
  });
  const pick = rows.find((r) => r.ok);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Continuous load (amps)"><Input type="number" value={amps} onChange={(e) => setAmps(e.target.value)} /></Field>
        <Field label="One-way run (ft)"><Input type="number" value={feet} onChange={(e) => setFeet(e.target.value)} /></Field>
        <Field label="Voltage"><Input type="number" value={voltage} onChange={(e) => setVoltage(e.target.value)} /></Field>
        <Field label="Max voltage drop %"><Input type="number" value={maxDrop} onChange={(e) => setMax(e.target.value)} /></Field>
        <Field label="Metal">
          <Select value={metal} onChange={(e) => setMetal(e.target.value as "copper" | "aluminum")}>
            <option value="copper">Copper</option>
            <option value="aluminum">Aluminum</option>
          </Select>
        </Field>
        <Field label="Phase">
          <Select value={phase} onChange={(e) => setPhase(e.target.value as "1" | "3")}>
            <option value="1">Single phase</option>
            <option value="3">Three phase</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["Suggested AWG", pick ? pick.awg : "Larger than 4/0"], ["Drop at that size", pick ? `${fmt(pick.pct, 2)}%` : "—"], ["Ampacity used", pick ? `${pick.amp} A` : "—"], ["Load", `${fmt(num(amps), 1)} A`]]} />
      <div className="max-h-64 overflow-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-3 py-2 text-left">AWG</th><th className="px-3 py-2 text-right">Ampacity</th><th className="px-3 py-2 text-right">Drop</th><th className="px-3 py-2 text-right">Fits</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.awg} className="border-t border-border">
                <td className="px-3 py-1.5">{r.awg}</td>
                <td className="px-3 py-1.5 text-right">{r.amp} A</td>
                <td className="px-3 py-1.5 text-right">{fmt(r.pct, 2)}%</td>
                <td className="px-3 py-1.5 text-right">{r.ok ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice tone="info">Picks the smallest listed gauge whose rough 60°C copper ampacity covers the load and whose voltage drop stays inside your limit. Aluminum ampacity is lower in the field. Follow the NEC and a qualified electrician for a real circuit.</Notice>
      <CopyResult filename="wire-size.txt" rows={[["AWG", pick?.awg ?? "none"], ["Drop %", pick ? fmt(pick.pct, 2) : "—"]]} />
    </Box>
  );
}

export function KwKvaCalculator() {
  const [kw, setKw] = React.useState("15");
  const [pf, setPf] = React.useState("0.8");
  const [volts, setVolts] = React.useState("240");
  const [phase, setPhase] = React.useState("1");
  const kva = num(pf) > 0 ? num(kw) / num(pf) : 0;
  const amps = phase === "1"
    ? (kva * 1000) / Math.max(1, num(volts))
    : (kva * 1000) / (Math.max(1, num(volts)) * 1.732);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Real power (kW)"><Input type="number" value={kw} onChange={(e) => setKw(e.target.value)} /></Field>
        <Field label="Power factor" hint="Motors often 0.8"><Input type="number" value={pf} onChange={(e) => setPf(e.target.value)} /></Field>
        <Field label="Voltage"><Input type="number" value={volts} onChange={(e) => setVolts(e.target.value)} /></Field>
        <Field label="Phase">
          <Select value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="1">Single phase</option>
            <option value="3">Three phase</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["Apparent power", `${fmt(kva, 2)} kVA`], ["Current", `${fmt(amps, 1)} A`], ["kW", fmt(num(kw), 2)], ["Power factor", fmt(num(pf), 2)]]} />
      <Notice tone="info">kVA = kW ÷ power factor. Single-phase amps = kVA × 1000 ÷ volts. Three-phase amps divide by volts × 1.732.</Notice>
      <CopyResult filename="kw-kva.txt" rows={[["kVA", fmt(kva, 2)], ["Amps", fmt(amps, 1)]]} />
    </Box>
  );
}

export function ElectricityCostCalculator() {
  const [watts, setWatts] = React.useState("1500");
  const [hours, setHours] = React.useState("4");
  const [days, setDays] = React.useState("30");
  const [rate, setRate] = React.useState("0.16");
  const kwh = (num(watts) / 1000) * num(hours) * num(days);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Device watts"><Input type="number" value={watts} onChange={(e) => setWatts(e.target.value)} /></Field>
        <Field label="Hours per day"><Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
        <Field label="Days"><Input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
        <Field label="Price per kWh"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
      </div>
      <Stats items={[["Energy", `${fmt(kwh, 2)} kWh`], ["Cost", money(kwh * num(rate))], ["Cost per day", money(num(days) > 0 ? (kwh * num(rate)) / num(days) : 0)], ["kW", fmt(num(watts) / 1000, 2)]]} />
      <CopyResult filename="electricity-cost.txt" rows={[["kWh", fmt(kwh, 2)], ["Cost", money(kwh * num(rate))]]} />
    </Box>
  );
}

export function EvChargingCostCalculator() {
  const [miles, setMiles] = React.useState("300");
  const [efficiency, setEff] = React.useState("3.5");
  const [rate, setRate] = React.useState("0.16");
  const [charger, setCharger] = React.useState("7.2");
  const [battery, setBattery] = React.useState("75");
  const kwh = num(efficiency) > 0 ? num(miles) / num(efficiency) : 0;
  const hours = num(charger) > 0 ? kwh / num(charger) : 0;
  const fullHours = num(charger) > 0 ? num(battery) / num(charger) : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Miles to add"><Input type="number" value={miles} onChange={(e) => setMiles(e.target.value)} /></Field>
        <Field label="Miles per kWh"><Input type="number" value={efficiency} onChange={(e) => setEff(e.target.value)} /></Field>
        <Field label="Price per kWh"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Charger power (kW)"><Input type="number" value={charger} onChange={(e) => setCharger(e.target.value)} /></Field>
        <Field label="Battery size (kWh)" hint="Used for a full-charge time"><Input type="number" value={battery} onChange={(e) => setBattery(e.target.value)} /></Field>
      </div>
      <Stats items={[["Energy for those miles", `${fmt(kwh, 2)} kWh`], ["Charging cost", money(kwh * num(rate))], ["Hours for those miles", fmt(hours, 2)], ["Hours for a full battery", fmt(fullHours, 2)]]} />
      <Notice tone="info">Cost = miles ÷ miles-per-kWh × your electricity price. Charge time ignores tapering near 100%.</Notice>
      <CopyResult filename="ev-charging.txt" rows={[["kWh", fmt(kwh, 2)], ["Cost", money(kwh * num(rate))], ["Hours", fmt(hours, 2)]]} />
    </Box>
  );
}

/* ------------------------------- Property --------------------------------- */
export function ClosingCostCalculator() {
  const [price, setPrice] = React.useState("400000");
  const [lenderPct, setLender] = React.useState("1");
  const [title, setTitle] = React.useState("1800");
  const [inspection, setInspection] = React.useState("500");
  const [appraisal, setAppraisal] = React.useState("550");
  const [tax, setTax] = React.useState("4800");
  const [taxMonths, setTaxMonths] = React.useState("3");
  const [ins, setIns] = React.useState("1800");
  const [insMonths, setInsMonths] = React.useState("12");
  const lender = num(price) * (num(lenderPct) / 100);
  const prepaid = (num(tax) / 12) * num(taxMonths) + (num(ins) / 12) * num(insMonths);
  const total = lender + num(title) + num(inspection) + num(appraisal) + prepaid;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Purchase price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Lender fees % of price"><Input type="number" value={lenderPct} onChange={(e) => setLender(e.target.value)} /></Field>
        <Field label="Title and escrow"><Input type="number" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Inspection"><Input type="number" value={inspection} onChange={(e) => setInspection(e.target.value)} /></Field>
        <Field label="Appraisal"><Input type="number" value={appraisal} onChange={(e) => setAppraisal(e.target.value)} /></Field>
        <Field label="Property tax / year"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
        <Field label="Months of tax prepaid"><Input type="number" value={taxMonths} onChange={(e) => setTaxMonths(e.target.value)} /></Field>
        <Field label="Insurance / year"><Input type="number" value={ins} onChange={(e) => setIns(e.target.value)} /></Field>
        <Field label="Months of insurance prepaid"><Input type="number" value={insMonths} onChange={(e) => setInsMonths(e.target.value)} /></Field>
      </div>
      <Stats items={[["Estimated closing costs", money(total)], ["Percent of price", num(price) > 0 ? `${fmt((total / num(price)) * 100, 2)}%` : "—"], ["Lender fees", money(lender)], ["Prepaid tax and insurance", money(prepaid)]]} />
      <Notice tone="info">A buyer cash-to-close estimate. It leaves out discount points, HOA transfer fees, and seller credits. Your loan estimate is the document that counts.</Notice>
      <CopyResult filename="closing-costs.txt" rows={[["Total", money(total)], ["Lender", money(lender)], ["Prepaid", money(prepaid)]]} />
    </Box>
  );
}

export function DownPaymentCalculator() {
  const [price, setPrice] = React.useState("400000");
  const [custom, setCustom] = React.useState("15");
  const rows = [3, 5, 10, 20, num(custom)].map((pct) => ({
    pct,
    down: num(price) * (pct / 100),
    loan: num(price) * (1 - pct / 100),
  }));
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Home price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Your down payment %"><Input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} /></Field>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-3 py-2 text-left">Down %</th><th className="px-3 py-2 text-right">Cash down</th><th className="px-3 py-2 text-right">Loan</th><th className="px-3 py-2 text-right">PMI likely</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pct} className="border-t border-border">
                <td className="px-3 py-1.5">{fmt(r.pct, 1)}%</td>
                <td className="px-3 py-1.5 text-right">{money(r.down)}</td>
                <td className="px-3 py-1.5 text-right">{money(r.loan)}</td>
                <td className="px-3 py-1.5 text-right">{r.pct + 0.001 < 20 ? "Often yes" : "Usually no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice tone="info">Under 20% down, many loans add mortgage insurance. The 20% row is the usual point where that charge drops off.</Notice>
      <CopyResult filename="down-payment.txt" rows={rows.map((r) => [`${fmt(r.pct, 1)}%`, money(r.down)])} />
    </Box>
  );
}

export function RefinanceCalculator() {
  const [balance, setBalance] = React.useState("280000");
  const [oldRate, setOld] = React.useState("7.25");
  const [oldYears, setOldYears] = React.useState("26");
  const [newRate, setNew] = React.useState("6.25");
  const [newYears, setNewYears] = React.useState("30");
  const [costs, setCosts] = React.useState("6000");
  const [roll, setRoll] = React.useState("no");
  const oldPmt = monthlyPayment(num(balance), num(oldRate), num(oldYears) * 12);
  const newPrincipal = num(balance) + (roll === "yes" ? num(costs) : 0);
  const newPmt = monthlyPayment(newPrincipal, num(newRate), num(newYears) * 12);
  const save = oldPmt - newPmt;
  const even = save > 0 ? num(costs) / save : Infinity;
  const oldInterest = oldPmt * num(oldYears) * 12 - num(balance);
  const newInterest = newPmt * num(newYears) * 12 - newPrincipal;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Current balance"><Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></Field>
        <Field label="Current rate %"><Input type="number" value={oldRate} onChange={(e) => setOld(e.target.value)} /></Field>
        <Field label="Years left"><Input type="number" value={oldYears} onChange={(e) => setOldYears(e.target.value)} /></Field>
        <Field label="New rate %"><Input type="number" value={newRate} onChange={(e) => setNew(e.target.value)} /></Field>
        <Field label="New term (years)"><Input type="number" value={newYears} onChange={(e) => setNewYears(e.target.value)} /></Field>
        <Field label="Closing costs"><Input type="number" value={costs} onChange={(e) => setCosts(e.target.value)} /></Field>
        <Field label="Roll costs into the loan">
          <Select value={roll} onChange={(e) => setRoll(e.target.value)}>
            <option value="no">Pay costs in cash</option>
            <option value="yes">Add costs to the balance</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["Current payment", money(oldPmt)], ["New payment", money(newPmt)], ["Monthly difference", money(save)], ["Break-even", even === Infinity ? "Payment is higher" : `${fmt(even, 1)} mo`]]} />
      <Stats items={[["Interest if you stay", money(oldInterest)], ["Interest on the new loan", money(newInterest)], ["Interest difference", money(oldInterest - newInterest)], ["New loan amount", money(newPrincipal)]]} />
      <Notice tone="info">Break-even is closing costs divided by the monthly payment drop. A longer new term can lower the payment and still raise total interest.</Notice>
      <CopyResult filename="refinance.txt" rows={[["Old payment", money(oldPmt)], ["New payment", money(newPmt)], ["Break-even months", even === Infinity ? "n/a" : fmt(even, 1)]]} />
    </Box>
  );
}

export function RentalPropertyCalculator() {
  const [price, setPrice] = React.useState("350000");
  const [down, setDown] = React.useState("70000");
  const [rate, setRate] = React.useState("6.75");
  const [years, setYears] = React.useState("30");
  const [rent, setRent] = React.useState("2400");
  const [vacancy, setVacancy] = React.useState("5");
  const [expenses, setExpenses] = React.useState("400");
  const [tax, setTax] = React.useState("350");
  const [ins, setIns] = React.useState("150");
  const loan = Math.max(0, num(price) - num(down));
  const debt = monthlyPayment(loan, num(rate), num(years) * 12);
  const collected = num(rent) * (1 - num(vacancy) / 100);
  const noiMonth = collected - num(expenses) - num(tax) - num(ins);
  const cash = noiMonth - debt;
  const cap = num(price) > 0 ? ((noiMonth * 12) / num(price)) * 100 : 0;
  const coc = num(down) > 0 ? ((cash * 12) / num(down)) * 100 : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Purchase price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Down payment"><Input type="number" value={down} onChange={(e) => setDown(e.target.value)} /></Field>
        <Field label="Interest rate %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Loan term (years)"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
        <Field label="Monthly rent"><Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} /></Field>
        <Field label="Vacancy %"><Input type="number" value={vacancy} onChange={(e) => setVacancy(e.target.value)} /></Field>
        <Field label="Other monthly expenses"><Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} /></Field>
        <Field label="Tax / month"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
        <Field label="Insurance / month"><Input type="number" value={ins} onChange={(e) => setIns(e.target.value)} /></Field>
      </div>
      <Stats items={[["Cap rate", `${fmt(cap, 2)}%`], ["Monthly cash flow", money(cash)], ["Cash-on-cash", `${fmt(coc, 2)}%`], ["Mortgage payment", money(debt)]]} />
      <Notice tone="info">Cap rate uses net operating income before the mortgage. Cash flow subtracts principal and interest. Vacancy reduces collected rent.</Notice>
      <CopyResult filename="rental-property.txt" rows={[["Cap rate", fmt(cap, 2)], ["Cash flow", money(cash)], ["Cash on cash", fmt(coc, 2)]]} />
    </Box>
  );
}

export function SellerNetCalculator() {
  const [price, setPrice] = React.useState("450000");
  const [commission, setCommission] = React.useState("5.5");
  const [payoff, setPayoff] = React.useState("210000");
  const [costs, setCosts] = React.useState("4000");
  const [repairs, setRepairs] = React.useState("2000");
  const fee = num(price) * (num(commission) / 100);
  const net = num(price) - fee - num(payoff) - num(costs) - num(repairs);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Sale price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Commission %"><Input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} /></Field>
        <Field label="Mortgage payoff"><Input type="number" value={payoff} onChange={(e) => setPayoff(e.target.value)} /></Field>
        <Field label="Seller closing costs"><Input type="number" value={costs} onChange={(e) => setCosts(e.target.value)} /></Field>
        <Field label="Repairs and credits"><Input type="number" value={repairs} onChange={(e) => setRepairs(e.target.value)} /></Field>
      </div>
      <Stats items={[["Estimated net", money(net)], ["Commission", money(fee)], ["Payoff", money(num(payoff))], ["Costs and repairs", money(num(costs) + num(repairs))]]} />
      <CopyResult filename="seller-net.txt" rows={[["Net", money(net)], ["Commission", money(fee)]]} />
    </Box>
  );
}

export function LoanComparisonCalculator() {
  const [a1, setA1] = React.useState("25000");
  const [r1, setR1] = React.useState("8.9");
  const [y1, setY1] = React.useState("5");
  const [a2, setA2] = React.useState("25000");
  const [r2, setR2] = React.useState("6.5");
  const [y2, setY2] = React.useState("6");
  const p1 = monthlyPayment(num(a1), num(r1), num(y1) * 12);
  const p2 = monthlyPayment(num(a2), num(r2), num(y2) * 12);
  const i1 = p1 * num(y1) * 12 - num(a1);
  const i2 = p2 * num(y2) * 12 - num(a2);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-3">
          <Field label="Loan A amount"><Input type="number" value={a1} onChange={(e) => setA1(e.target.value)} /></Field>
          <Field label="Loan A rate %"><Input type="number" value={r1} onChange={(e) => setR1(e.target.value)} /></Field>
          <Field label="Loan A years"><Input type="number" value={y1} onChange={(e) => setY1(e.target.value)} /></Field>
        </div>
        <div className="grid gap-3">
          <Field label="Loan B amount"><Input type="number" value={a2} onChange={(e) => setA2(e.target.value)} /></Field>
          <Field label="Loan B rate %"><Input type="number" value={r2} onChange={(e) => setR2(e.target.value)} /></Field>
          <Field label="Loan B years"><Input type="number" value={y2} onChange={(e) => setY2(e.target.value)} /></Field>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-3 py-2 text-left" /><th className="px-3 py-2 text-right">Loan A</th><th className="px-3 py-2 text-right">Loan B</th></tr></thead>
          <tbody>
            <tr className="border-t border-border"><td className="px-3 py-1.5">Monthly payment</td><td className="px-3 py-1.5 text-right">{money(p1)}</td><td className="px-3 py-1.5 text-right">{money(p2)}</td></tr>
            <tr className="border-t border-border"><td className="px-3 py-1.5">Total interest</td><td className="px-3 py-1.5 text-right">{money(i1)}</td><td className="px-3 py-1.5 text-right">{money(i2)}</td></tr>
            <tr className="border-t border-border"><td className="px-3 py-1.5">Total paid</td><td className="px-3 py-1.5 text-right">{money(p1 * num(y1) * 12)}</td><td className="px-3 py-1.5 text-right">{money(p2 * num(y2) * 12)}</td></tr>
          </tbody>
        </table>
      </div>
      <CopyResult filename="loan-comparison.txt" rows={[["A payment", money(p1)], ["B payment", money(p2)], ["A interest", money(i1)], ["B interest", money(i2)]]} />
    </Box>
  );
}

export function BudgetCalculator() {
  const [income, setIncome] = React.useState("5500");
  const [housing, setHousing] = React.useState("1800");
  const [food, setFood] = React.useState("600");
  const [transport, setTransport] = React.useState("400");
  const [debt, setDebt] = React.useState("350");
  const [other, setOther] = React.useState("700");
  const spent = num(housing) + num(food) + num(transport) + num(debt) + num(other);
  const left = num(income) - spent;
  const rate = num(income) > 0 ? (left / num(income)) * 100 : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Monthly take-home"><Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} /></Field>
        <Field label="Housing"><Input type="number" value={housing} onChange={(e) => setHousing(e.target.value)} /></Field>
        <Field label="Food"><Input type="number" value={food} onChange={(e) => setFood(e.target.value)} /></Field>
        <Field label="Transport"><Input type="number" value={transport} onChange={(e) => setTransport(e.target.value)} /></Field>
        <Field label="Debt payments"><Input type="number" value={debt} onChange={(e) => setDebt(e.target.value)} /></Field>
        <Field label="Everything else"><Input type="number" value={other} onChange={(e) => setOther(e.target.value)} /></Field>
      </div>
      <Stats items={[["Left over", money(left)], ["Savings rate", `${fmt(rate, 1)}%`], ["Spent", money(spent)], ["Housing share", num(income) > 0 ? `${fmt((num(housing) / num(income)) * 100, 1)}%` : "—"]]} />
      <CopyResult filename="budget.txt" rows={[["Left", money(left)], ["Spent", money(spent)], ["Savings rate", fmt(rate, 1)]]} />
    </Box>
  );
}

export function VehicleDepreciationCalculator() {
  const [price, setPrice] = React.useState("32000");
  const [rate, setRate] = React.useState("15");
  const [years, setYears] = React.useState("5");
  const rows = Array.from({ length: Math.min(20, Math.max(1, Math.round(num(years)))) }, (_, i) => {
    const year = i + 1;
    const value = num(price) * Math.pow(1 - num(rate) / 100, year);
    return { year, value, lost: num(price) - value };
  });
  const last = rows[rows.length - 1];
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Purchase price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Decline per year %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Years"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
      </div>
      <Stats items={[["Value at the end", money(last?.value ?? 0)], ["Value lost", money(last?.lost ?? 0)], ["Kept", last && num(price) > 0 ? `${fmt((last.value / num(price)) * 100, 1)}%` : "—"], ["Yearly rate", `${fmt(num(rate), 1)}%`]]} />
      <div className="max-h-64 overflow-auto rounded-xl border border-border text-sm">
        <table className="w-full">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-3 py-2 text-left">Year</th><th className="px-3 py-2 text-right">Value</th><th className="px-3 py-2 text-right">Lost from new</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year} className="border-t border-border"><td className="px-3 py-1.5">{r.year}</td><td className="px-3 py-1.5 text-right">{money(r.value)}</td><td className="px-3 py-1.5 text-right">{money(r.lost)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice tone="info">Declining-balance model: each year the car is worth (100 − rate)% of the year before. Real resale also depends on miles and condition.</Notice>
      <CopyResult filename="depreciation.txt" rows={[["End value", money(last?.value ?? 0)], ["Lost", money(last?.lost ?? 0)]]} />
    </Box>
  );
}

export function MarketplaceFeeCalculator() {
  const [price, setPrice] = React.useState("49");
  const [pct, setPct] = React.useState("12");
  const [fixed, setFixed] = React.useState("0.3");
  const [shipIn, setShipIn] = React.useState("6");
  const [shipOut, setShipOut] = React.useState("5.5");
  const [cogs, setCogs] = React.useState("18");
  const revenue = num(price) + num(shipIn);
  const fees = num(price) * (num(pct) / 100) + num(fixed);
  const net = revenue - fees - num(shipOut) - num(cogs);
  const margin = revenue > 0 ? (net / revenue) * 100 : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Item price"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Fee %"><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        <Field label="Fixed fee"><Input type="number" value={fixed} onChange={(e) => setFixed(e.target.value)} /></Field>
        <Field label="Shipping you charge"><Input type="number" value={shipIn} onChange={(e) => setShipIn(e.target.value)} /></Field>
        <Field label="Shipping you pay"><Input type="number" value={shipOut} onChange={(e) => setShipOut(e.target.value)} /></Field>
        <Field label="Product cost"><Input type="number" value={cogs} onChange={(e) => setCogs(e.target.value)} /></Field>
      </div>
      <Stats items={[["Net profit", money(net)], ["Margin", `${fmt(margin, 1)}%`], ["Marketplace fees", money(fees)], ["Revenue", money(revenue)]]} />
      <CopyResult filename="marketplace-fees.txt" rows={[["Net", money(net)], ["Fees", money(fees)], ["Margin", fmt(margin, 1)]]} />
    </Box>
  );
}

export function TithingCalculator() {
  const [income, setIncome] = React.useState("4800");
  const [pct, setPct] = React.useState("10");
  const [period, setPeriod] = React.useState("month");
  const amount = num(income) * (num(pct) / 100);
  const yearly = period === "week" ? amount * 52 : period === "year" ? amount : amount * 12;
  const monthly = yearly / 12;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Income"><Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} /></Field>
        <Field label="Percent"><Input type="number" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        <Field label="That income is">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["This period", money(amount)], ["Per month", money(monthly)], ["Per year", money(yearly)], ["Percent", `${fmt(num(pct), 1)}%`]]} />
      <CopyResult filename="tithing.txt" rows={[["Period", money(amount)], ["Year", money(yearly)]]} />
    </Box>
  );
}

export function RetirementCalculator() {
  const [current, setCurrent] = React.useState("25000");
  const [monthly, setMonthly] = React.useState("400");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("25");
  const fv = futureValue(num(current), num(monthly), num(rate), num(years));
  const contributed = num(current) + num(monthly) * num(years) * 12;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Already saved"><Input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="Monthly contribution"><Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></Field>
        <Field label="Expected annual return %"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Years"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
      </div>
      <Stats items={[["Future value", money(fv)], ["You put in", money(contributed)], ["Growth", money(fv - contributed)], ["Monthly", money(num(monthly))]]} />
      <Notice tone="info">Compounds monthly. It does not subtract taxes, fees, or inflation, and the return is an assumption you type in.</Notice>
      <CopyResult filename="retirement.txt" rows={[["Future value", money(fv)], ["Contributed", money(contributed)]]} />
    </Box>
  );
}

export function EmployeeCostCalculator() {
  const [salary, setSalary] = React.useState("65000");
  const [benefits, setBenefits] = React.useState("20");
  const [tax, setTax] = React.useState("7.65");
  const loaded = num(salary) * (1 + num(benefits) / 100 + num(tax) / 100);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Gross annual salary"><Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} /></Field>
        <Field label="Benefits % of salary"><Input type="number" value={benefits} onChange={(e) => setBenefits(e.target.value)} /></Field>
        <Field label="Employer payroll tax %"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
      </div>
      <Stats items={[["Fully loaded cost", money(loaded)], ["Per month", money(loaded / 12)], ["Per hour (2080)", money(loaded / 2080)], ["Extra over salary", money(loaded - num(salary))]]} />
      <Notice tone="info">Loaded cost = salary × (1 + benefits% + employer tax%). 7.65% matches US Social Security plus Medicare as a starting point. Add workers’ comp and equipment if you pay them.</Notice>
      <CopyResult filename="employee-cost.txt" rows={[["Loaded", money(loaded)], ["Monthly", money(loaded / 12)]]} />
    </Box>
  );
}

export function AbsorptionRateCalculator() {
  const [sold, setSold] = React.useState("42");
  const [listed, setListed] = React.useState("210");
  const rate = num(listed) > 0 ? (num(sold) / num(listed)) * 100 : 0;
  const months = num(sold) > 0 ? num(listed) / num(sold) : Infinity;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Homes sold in the period"><Input type="number" value={sold} onChange={(e) => setSold(e.target.value)} /></Field>
        <Field label="Homes listed now"><Input type="number" value={listed} onChange={(e) => setListed(e.target.value)} /></Field>
      </div>
      <Stats items={[["Absorption rate", `${fmt(rate, 1)}%`], ["Months of supply", months === Infinity ? "—" : fmt(months, 1)], ["Sold", fmt(num(sold), 0)], ["Listed", fmt(num(listed), 0)]]} />
      <Notice tone="info">Absorption rate = sales ÷ active listings. Months of supply = listings ÷ sales. Under about 4 months is often called a seller’s market. Over about 6 months leans toward buyers.</Notice>
      <CopyResult filename="absorption-rate.txt" rows={[["Rate", fmt(rate, 1)], ["Months of supply", months === Infinity ? "n/a" : fmt(months, 1)]]} />
    </Box>
  );
}

export function CarTradeEquityCalculator() {
  const [value, setValue] = React.useState("14000");
  const [payoff, setPayoff] = React.useState("9000");
  const [next, setNext] = React.useState("28000");
  const [tax, setTax] = React.useState("6.5");
  const equity = num(value) - num(payoff);
  const taxable = Math.max(0, num(next) - num(value));
  const taxDue = taxable * (num(tax) / 100);
  const taxFull = num(next) * (num(tax) / 100);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Trade-in value"><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        <Field label="Loan payoff"><Input type="number" value={payoff} onChange={(e) => setPayoff(e.target.value)} /></Field>
        <Field label="Next vehicle price"><Input type="number" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Field label="Sales tax %" hint="Many states tax price minus trade"><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
      </div>
      <Stats items={[["Equity", money(equity)], ["Taxable amount", money(taxable)], ["Sales tax", money(taxDue)], ["Tax saved vs no trade", money(taxFull - taxDue)]]} />
      <Notice tone="info">Negative equity means the payoff is higher than the trade value, and that gap is usually added to the next loan. Tax rules differ by state.</Notice>
      <CopyResult filename="trade-equity.txt" rows={[["Equity", money(equity)], ["Tax", money(taxDue)]]} />
    </Box>
  );
}

export function BusinessValuationCalculator() {
  const [profit, setProfit] = React.useState("180000");
  const [profitMult, setProfitMult] = React.useState("3");
  const [revenue, setRevenue] = React.useState("900000");
  const [revMult, setRevMult] = React.useState("0.8");
  const byProfit = num(profit) * num(profitMult);
  const byRev = num(revenue) * num(revMult);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Annual seller’s earnings"><Input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} /></Field>
        <Field label="Earnings multiple"><Input type="number" value={profitMult} onChange={(e) => setProfitMult(e.target.value)} /></Field>
        <Field label="Annual revenue"><Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></Field>
        <Field label="Revenue multiple"><Input type="number" value={revMult} onChange={(e) => setRevMult(e.target.value)} /></Field>
      </div>
      <Stats items={[["Value from earnings", money(byProfit)], ["Value from revenue", money(byRev)], ["Earnings multiple", fmt(num(profitMult), 2)], ["Revenue multiple", fmt(num(revMult), 2)]]} />
      <Notice tone="info">A multiple is a market shortcut, not an appraisal. Small service businesses are often discussed as a multiple of seller’s discretionary earnings. Asset-heavy firms are often discussed as a multiple of revenue.</Notice>
      <CopyResult filename="business-valuation.txt" rows={[["Earnings value", money(byProfit)], ["Revenue value", money(byRev)]]} />
    </Box>
  );
}

/* --------------------------------- Hobby ---------------------------------- */
export function AquariumCalculator() {
  const [l, setL] = React.useState("36");
  const [w, setW] = React.useState("18");
  const [h, setH] = React.useState("18");
  const [change, setChange] = React.useState("25");
  const [salt, setSalt] = React.useState("0.5");
  const gallons = (num(l) * num(w) * num(h)) / 231;
  const liters = gallons * 3.78541;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Length (in)"><Input type="number" value={l} onChange={(e) => setL(e.target.value)} /></Field>
        <Field label="Width (in)"><Input type="number" value={w} onChange={(e) => setW(e.target.value)} /></Field>
        <Field label="Water height (in)"><Input type="number" value={h} onChange={(e) => setH(e.target.value)} /></Field>
        <Field label="Water change %"><Input type="number" value={change} onChange={(e) => setChange(e.target.value)} /></Field>
        <Field label="Salt (tsp per gallon)" hint="Use the dose on your product"><Input type="number" value={salt} onChange={(e) => setSalt(e.target.value)} /></Field>
      </div>
      <Stats items={[["Gallons", fmt(gallons, 1)], ["Liters", fmt(liters, 1)], ["Heater range", `${fmt(gallons * 3, 0)}–${fmt(gallons * 5, 0)} W`], ["Water to change", `${fmt(gallons * num(change) / 100, 1)} gal`]]} />
      <Stats items={[["Salt for a full tank", `${fmt(gallons * num(salt), 1)} tsp`], ["Tablespoons", fmt((gallons * num(salt)) / 3, 1)], ["Cubic inches", fmt(num(l) * num(w) * num(h), 0)], ["Pounds of water", fmt(gallons * 8.34, 0)]]} />
      <Notice tone="info">US gallons = length × width × height ÷ 231. A common tropical heater range is 3–5 watts per gallon. Follow the salt label; this dose is only the math.</Notice>
      <CopyResult filename="aquarium.txt" rows={[["Gallons", fmt(gallons, 1)], ["Heater W", `${fmt(gallons * 3, 0)}-${fmt(gallons * 5, 0)}`]]} />
    </Box>
  );
}

export function CoffeeRatioCalculator() {
  const [method, setMethod] = React.useState("16");
  const [coffee, setCoffee] = React.useState("20");
  const ratio = num(method);
  const water = num(coffee) * ratio;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Brew method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="16">Pour over (1:16)</option>
            <option value="15">French press (1:15)</option>
            <option value="17">Drip (1:17)</option>
            <option value="8">Cold brew concentrate (1:8)</option>
            <option value="2">Espresso (1:2)</option>
          </Select>
        </Field>
        <Field label="Coffee dose (g)"><Input type="number" value={coffee} onChange={(e) => setCoffee(e.target.value)} /></Field>
      </div>
      <Stats items={[["Water", `${fmt(water, 0)} g`], ["Water in ml", fmt(water, 0)], ["Ratio", `1:${fmt(ratio, 0)}`], ["Cups (240 ml)", fmt(water / 240, 2)]]} />
      <Notice tone="info">Grams of water equal milliliters. Cold brew at 1:8 is a concentrate you usually dilute. Espresso yield is beverage weight, not kettle water.</Notice>
      <CopyResult filename="coffee-ratio.txt" rows={[["Coffee g", fmt(num(coffee), 0)], ["Water g", fmt(water, 0)]]} />
    </Box>
  );
}

export function PrintCostCalculator() {
  const [grams, setGrams] = React.useState("85");
  const [spool, setSpool] = React.useState("22");
  const [hours, setHours] = React.useState("6");
  const [watts, setWatts] = React.useState("120");
  const [rate, setRate] = React.useState("0.16");
  const [wear, setWear] = React.useState("0.05");
  const filament = (num(grams) / 1000) * num(spool);
  const kwh = (num(watts) * num(hours)) / 1000;
  const electric = kwh * num(rate);
  const machine = num(hours) * num(wear);
  const total = filament + electric + machine;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Filament used (g)"><Input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} /></Field>
        <Field label="Spool price per kg"><Input type="number" value={spool} onChange={(e) => setSpool(e.target.value)} /></Field>
        <Field label="Print time (hours)"><Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
        <Field label="Printer watts"><Input type="number" value={watts} onChange={(e) => setWatts(e.target.value)} /></Field>
        <Field label="Electricity price / kWh"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Wear allowance / hour"><Input type="number" value={wear} onChange={(e) => setWear(e.target.value)} /></Field>
      </div>
      <Stats items={[["Print cost", money(total)], ["Filament", money(filament)], ["Electricity", money(electric)], ["Machine wear", money(machine)]]} />
      <CopyResult filename="3d-print-cost.txt" rows={[["Total", money(total)], ["Filament", money(filament)], ["kWh", fmt(kwh, 3)]]} />
    </Box>
  );
}

export function CatAgeCalculator() {
  const [years, setYears] = React.useState("4");
  const [months, setMonths] = React.useState("0");
  const y = num(years) + num(months) / 12;
  const human = y <= 1 ? 15 * y : y <= 2 ? 15 + 9 * (y - 1) : 24 + 4 * (y - 2);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Cat age (years)"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
        <Field label="Extra months"><Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} /></Field>
      </div>
      <Stats items={[["Human-equivalent age", fmt(human, 1)], ["Cat age", `${fmt(y, 2)} years`], ["First year counts as", "15"], ["Each year after 2", "+4"]]} />
      <Notice tone="info">A common veterinary shortcut: the first year is about 15 human years, the second adds 9, and each year after that adds 4. Indoor life, breed, and weight move the real number.</Notice>
      <CopyResult filename="cat-age.txt" rows={[["Human years", fmt(human, 1)]]} />
    </Box>
  );
}

export function PlantSpacingCalculator() {
  const [length, setLength] = React.useState("8");
  const [width, setWidth] = React.useState("4");
  const [spacing, setSpacing] = React.useState("12");
  const s = num(spacing) / 12;
  const cols = s > 0 ? Math.floor(num(width) / s) : 0;
  const rows = s > 0 ? Math.floor(num(length) / s) : 0;
  const grid = cols * rows;
  const triRows = s > 0 ? Math.floor(num(length) / (s * 0.866)) : 0;
  const tri = cols * triRows;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Bed length (ft)"><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} /></Field>
        <Field label="Bed width (ft)"><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Spacing (in)"><Input type="number" value={spacing} onChange={(e) => setSpacing(e.target.value)} /></Field>
      </div>
      <Stats items={[["Square grid plants", fmt(grid, 0)], ["Triangular spacing", fmt(tri, 0)], ["Rows × columns", `${rows} × ${cols}`], ["Bed area", `${fmt(num(length) * num(width), 1)} sq ft`]]} />
      <Notice tone="info">Square spacing divides each side by the spacing. Triangular spacing tightens the row gap to spacing × 0.866, which fits more plants in the same bed.</Notice>
      <CopyResult filename="plant-spacing.txt" rows={[["Grid", String(grid)], ["Triangular", String(tri)]]} />
    </Box>
  );
}

export function CompostCalculator() {
  const [browns, setBrowns] = React.useState("6");
  const [greens, setGreens] = React.useState("2");
  const [target, setTarget] = React.useState("3");
  const ratio = num(greens) > 0 ? num(browns) / num(greens) : 0;
  const need = num(greens) * num(target);
  const delta = need - num(browns);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Browns (cu ft)" hint="Leaves, cardboard, straw"><Input type="number" value={browns} onChange={(e) => setBrowns(e.target.value)} /></Field>
        <Field label="Greens (cu ft)" hint="Food scraps, grass"><Input type="number" value={greens} onChange={(e) => setGreens(e.target.value)} /></Field>
        <Field label="Target browns per 1 green"><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
      </div>
      <Stats items={[["Your ratio", num(greens) > 0 ? `${fmt(ratio, 2)} : 1` : "—"], ["Browns to add", delta > 0 ? `${fmt(delta, 2)} cu ft` : "0"], ["Greens to add", delta < 0 ? `${fmt(-delta / Math.max(num(target), 0.01), 2)} cu ft` : "0"], ["Pile volume", `${fmt(num(browns) + num(greens), 1)} cu ft`]]} />
      <Notice tone="info">A common starting mix is about 3 parts browns to 1 part greens by volume. Too many greens stay wet. Too many browns stay dry and slow.</Notice>
      <CopyResult filename="compost.txt" rows={[["Ratio", fmt(ratio, 2)], ["Browns delta", fmt(delta, 2)]]} />
    </Box>
  );
}

export function HullSpeedCalculator() {
  const [lwl, setLwl] = React.useState("24");
  const knots = 1.34 * Math.sqrt(Math.max(0, num(lwl)));
  const mph = knots * 1.15078;
  const kmh = knots * 1.852;
  return (
    <Box>
      <Field label="Waterline length (ft)"><Input type="number" value={lwl} onChange={(e) => setLwl(e.target.value)} /></Field>
      <Stats items={[["Hull speed", `${fmt(knots, 2)} kn`], ["Miles per hour", fmt(mph, 2)], ["km/h", fmt(kmh, 2)], ["Waterline", `${fmt(num(lwl), 1)} ft`]]} />
      <Notice tone="info">Displacement hull speed in knots is about 1.34 × √waterline length in feet. Planing boats and light multihulls can go faster than this wave-speed estimate.</Notice>
      <CopyResult filename="hull-speed.txt" rows={[["Knots", fmt(knots, 2)], ["MPH", fmt(mph, 2)]]} />
    </Box>
  );
}

export function FuelMixCalculator() {
  const [gallons, setGallons] = React.useState("2");
  const [ratio, setRatio] = React.useState("50");
  const oz = num(ratio) > 0 ? (num(gallons) * 128) / num(ratio) : 0;
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Gasoline (gallons)"><Input type="number" value={gallons} onChange={(e) => setGallons(e.target.value)} /></Field>
        <Field label="Mix ratio">
          <Select value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option value="50">50:1</option>
            <option value="40">40:1</option>
            <option value="32">32:1</option>
            <option value="25">25:1</option>
          </Select>
        </Field>
      </div>
      <Stats items={[["2-stroke oil", `${fmt(oz, 2)} fl oz`], ["Milliliters", fmt(oz * 29.5735, 0)], ["Ratio", `${ratio}:1`], ["Gas", `${fmt(num(gallons), 2)} gal`]]} />
      <Notice tone="info">Oil ounces = gallons × 128 ÷ the ratio number. A 50:1 mix in 1 gallon is 2.56 fl oz of oil. Use the ratio printed on the engine, not a guess.</Notice>
      <CopyResult filename="fuel-mix.txt" rows={[["Oil oz", fmt(oz, 2)], ["Oil ml", fmt(oz * 29.5735, 0)]]} />
    </Box>
  );
}

export function MolarityCalculator() {
  const [mode, setMode] = React.useState("molarity");
  const [grams, setGrams] = React.useState("58.44");
  const [mass, setMass] = React.useState("58.44");
  const [liters, setLiters] = React.useState("1");
  const [molar, setMolar] = React.useState("1");
  const moles = num(mass) > 0 ? num(grams) / num(mass) : 0;
  const fromMass = num(liters) > 0 ? moles / num(liters) : 0;
  const gramsNeeded = num(molar) * num(mass) * num(liters);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Find">
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="molarity">Molarity from a weighed mass</option>
            <option value="grams">Grams to weigh for a target molarity</option>
          </Select>
        </Field>
        <Field label="Molar mass (g/mol)"><Input type="number" value={mass} onChange={(e) => setMass(e.target.value)} /></Field>
        <Field label="Solution volume (L)"><Input type="number" value={liters} onChange={(e) => setLiters(e.target.value)} /></Field>
        {mode === "molarity" ? (
          <Field label="Mass dissolved (g)"><Input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} /></Field>
        ) : (
          <Field label="Target molarity (mol/L)"><Input type="number" value={molar} onChange={(e) => setMolar(e.target.value)} /></Field>
        )}
      </div>
      <Stats items={mode === "molarity"
        ? [["Molarity", `${fmt(fromMass, 4)} M`], ["Moles", fmt(moles, 4)], ["Volume", `${fmt(num(liters), 3)} L`], ["Mass", `${fmt(num(grams), 2)} g`]]
        : [["Grams to weigh", fmt(gramsNeeded, 3)], ["Moles needed", fmt(num(molar) * num(liters), 4)], ["Molarity", `${fmt(num(molar), 3)} M`], ["Volume", `${fmt(num(liters), 3)} L`]]} />
      <Notice tone="info">Molarity = moles ÷ liters, and moles = grams ÷ molar mass. The default mass is table salt, NaCl, 58.44 g/mol. This is classroom solution math.</Notice>
      <CopyResult filename="molarity.txt" rows={[["Result", mode === "molarity" ? fmt(fromMass, 4) : fmt(gramsNeeded, 3)]]} />
    </Box>
  );
}

export function HexagonQuiltCalculator() {
  const [side, setSide] = React.useState("1");
  const [count, setCount] = React.useState("80");
  const [seam, setSeam] = React.useState("0.25");
  const cut = num(side) + num(seam);
  const areaOne = ((3 * Math.sqrt(3)) / 2) * cut * cut;
  const total = areaOne * num(count);
  return (
    <Box>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Finished side (in)"><Input type="number" value={side} onChange={(e) => setSide(e.target.value)} /></Field>
        <Field label="Number of hexagons"><Input type="number" value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <Field label="Seam allowance per side (in)"><Input type="number" value={seam} onChange={(e) => setSeam(e.target.value)} /></Field>
      </div>
      <Stats items={[["Fabric", `${fmt(total / 144, 2)} sq ft`], ["Square inches", fmt(total, 0)], ["Cut side", `${fmt(cut, 2)} in`], ["Hexagons", fmt(num(count), 0)]]} />
      <Notice tone="info">Each hexagon area is (3√3 / 2) × side², using the side plus seam allowance. Buy extra for matching a print and for straightening the yardage.</Notice>
      <CopyResult filename="hexagon-quilt.txt" rows={[["Sq in", fmt(total, 0)], ["Hexagons", fmt(num(count), 0)]]} />
    </Box>
  );
}
