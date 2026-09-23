"use client";

import * as React from "react";
import { Button } from "@/components/ui/primitives";
import { Notice } from "@/components/tools/shared";

/* ── Table / physics ───────────────────────────────────────────────────── */

const TABLE_W = 1000;
const TABLE_H = 500;
const RAIL = 36;
const BALL_R = 13;
const POCKET_R = 26;
const FRICTION = 0.982;
const MIN_SPEED = 0.055;
const MAX_POWER = 16;
const CUSHION_REST = 0.82;
const BALL_REST = 0.98;

type Group = "solid" | "stripe" | null;
type Phase = "tutorial" | "aim" | "shooting" | "ai-thinking" | "over";

type Ball = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
};

type ShotResult = {
  pocketed: number[];
  scratched: boolean;
  firstHit: number | null;
  cushionHit: boolean;
};

type AimState = {
  angle: number;
  power: number;
  pulling: false | { ox: number; oy: number };
};

const BALL_COLORS: Record<number, { fill: string; stripe?: boolean }> = {
  1: { fill: "#f0c02e" },
  2: { fill: "#1e5aa8" },
  3: { fill: "#c62828" },
  4: { fill: "#5e35b1" },
  5: { fill: "#ef6c00" },
  6: { fill: "#2e7d32" },
  7: { fill: "#6d1b1b" },
  8: { fill: "#111111" },
  9: { fill: "#f0c02e", stripe: true },
  10: { fill: "#1e5aa8", stripe: true },
  11: { fill: "#c62828", stripe: true },
  12: { fill: "#5e35b1", stripe: true },
  13: { fill: "#ef6c00", stripe: true },
  14: { fill: "#2e7d32", stripe: true },
  15: { fill: "#6d1b1b", stripe: true },
};

function groupOf(id: number): Group {
  if (id >= 1 && id <= 7) return "solid";
  if (id >= 9 && id <= 15) return "stripe";
  return null;
}

function pockets() {
  const i = RAIL * 0.28;
  return [
    { x: i, y: i },
    { x: TABLE_W / 2, y: i * 0.55 },
    { x: TABLE_W - i, y: i },
    { x: i, y: TABLE_H - i },
    { x: TABLE_W / 2, y: TABLE_H - i * 0.55 },
    { x: TABLE_W - i, y: TABLE_H - i },
  ];
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

function rackPositions() {
  const solids = [1, 2, 3, 4, 5, 6, 7];
  const stripes = [9, 10, 11, 12, 13, 14, 15];
  shuffle(solids);
  shuffle(stripes);
  const apex = solids.pop()!;
  const cornerA = stripes.pop()!;
  const cornerB = solids.pop()!;
  const rest = [...solids, ...stripes];
  shuffle(rest);
  const ids = [
    apex,
    rest.pop()!,
    rest.pop()!,
    rest.pop()!,
    8,
    rest.pop()!,
    rest.pop()!,
    rest.pop()!,
    rest.pop()!,
    rest.pop()!,
    cornerA,
    rest.pop()!,
    rest.pop()!,
    rest.pop()!,
    cornerB,
  ];

  const cx = TABLE_W * 0.72;
  const cy = TABLE_H / 2;
  const gap = BALL_R * 2.02;
  const out: { id: number; x: number; y: number }[] = [];
  let n = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      out.push({
        id: ids[n++]!,
        x: cx + row * gap * Math.cos(Math.PI / 6),
        y: cy - (row * gap) / 2 + col * gap,
      });
    }
  }
  return out;
}

function createBalls(): Ball[] {
  const balls: Ball[] = [
    { id: 0, x: TABLE_W * 0.25, y: TABLE_H / 2, vx: 0, vy: 0, pocketed: false },
  ];
  for (const p of rackPositions()) {
    balls.push({ id: p.id, x: p.x, y: p.y, vx: 0, vy: 0, pocketed: false });
  }
  return balls;
}

function playArea() {
  return {
    left: RAIL + BALL_R,
    right: TABLE_W - RAIL - BALL_R,
    top: RAIL + BALL_R,
    bottom: TABLE_H - RAIL - BALL_R,
  };
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function ballsMoving(balls: Ball[]) {
  return balls.some((b) => !b.pocketed && (Math.abs(b.vx) > MIN_SPEED || Math.abs(b.vy) > MIN_SPEED));
}

function stepPhysics(balls: Ball[], result: ShotResult) {
  const area = playArea();
  const pocks = pockets();

  for (const b of balls) {
    if (b.pocketed) continue;
    b.x += b.vx;
    b.y += b.vy;
    b.vx *= FRICTION;
    b.vy *= FRICTION;
    if (Math.hypot(b.vx, b.vy) < MIN_SPEED) {
      b.vx = 0;
      b.vy = 0;
    }

    const nearPocket = pocks.some((p) => dist(b.x, b.y, p.x, p.y) < POCKET_R + BALL_R);
    if (!nearPocket) {
      if (b.x < area.left) {
        b.x = area.left;
        b.vx = Math.abs(b.vx) * CUSHION_REST;
        result.cushionHit = true;
      } else if (b.x > area.right) {
        b.x = area.right;
        b.vx = -Math.abs(b.vx) * CUSHION_REST;
        result.cushionHit = true;
      }
      if (b.y < area.top) {
        b.y = area.top;
        b.vy = Math.abs(b.vy) * CUSHION_REST;
        result.cushionHit = true;
      } else if (b.y > area.bottom) {
        b.y = area.bottom;
        b.vy = -Math.abs(b.vy) * CUSHION_REST;
        result.cushionHit = true;
      }
    }

    for (const p of pocks) {
      if (dist(b.x, b.y, p.x, p.y) < POCKET_R - 3) {
        b.pocketed = true;
        b.vx = 0;
        b.vy = 0;
        result.pocketed.push(b.id);
        if (b.id === 0) result.scratched = true;
      }
    }
  }

  // multi-pass collisions so stacked balls don't stick overlapping
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i]!;
      if (a.pocketed) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j]!;
        if (b.pocketed) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        if (d >= BALL_R * 2) continue;

        const overlap = BALL_R * 2 - d;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * overlap * 0.51;
        a.y -= ny * overlap * 0.51;
        b.x += nx * overlap * 0.51;
        b.y += ny * overlap * 0.51;

        if (pass > 0) continue; // only apply impulse once

        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const vn = dvx * nx + dvy * ny;
        if (vn > 0) continue;

        const impulse = (-(1 + BALL_REST) * vn) / 2;
        a.vx += impulse * nx;
        a.vy += impulse * ny;
        b.vx -= impulse * nx;
        b.vy -= impulse * ny;

        if (result.firstHit === null) {
          if (a.id === 0) result.firstHit = b.id;
          else if (b.id === 0) result.firstHit = a.id;
        }
      }
    }
  }
}

function legalTargets(playerGroup: Group, balls: Ball[], openTable: boolean): number[] {
  if (openTable) {
    return balls.filter((b) => !b.pocketed && b.id !== 0 && b.id !== 8).map((b) => b.id);
  }
  const remaining = balls.filter((b) => !b.pocketed && groupOf(b.id) === playerGroup);
  if (remaining.length === 0) return [8];
  return remaining.map((b) => b.id);
}

function evaluateShot(
  shot: ShotResult,
  turn: "you" | "ai",
  yourGroup: Group,
  aiGroup: Group,
  openTable: boolean,
  balls: Ball[],
) {
  const playerIsYou = turn === "you";
  let newYour = yourGroup;
  let newAi = aiGroup;
  let foul = false;
  let message = "";
  let winner: "you" | "ai" | null = null;

  const objectPotted = shot.pocketed.filter((id) => id !== 0);
  const eightPotted = objectPotted.includes(8);

  if (openTable && objectPotted.length && !eightPotted && !shot.scratched) {
    const first = objectPotted.find((id) => id !== 8);
    const g = first != null ? groupOf(first) : null;
    if (g) {
      if (playerIsYou) {
        newYour = g;
        newAi = g === "solid" ? "stripe" : "solid";
      } else {
        newAi = g;
        newYour = g === "solid" ? "stripe" : "solid";
      }
      message = playerIsYou
        ? `You are ${g === "solid" ? "Solids" : "Stripes"}`
        : `AI took ${g === "solid" ? "Solids" : "Stripes"} — you are ${newYour === "solid" ? "Solids" : "Stripes"}`;
    }
  }

  const effectiveGroup = playerIsYou ? newYour : newAi;
  const clearedOwn =
    effectiveGroup != null &&
    balls.every((b) => b.pocketed || shot.pocketed.includes(b.id) || groupOf(b.id) !== effectiveGroup);

  if (eightPotted) {
    if (shot.scratched || !clearedOwn) {
      winner = playerIsYou ? "ai" : "you";
      message = playerIsYou ? "8-ball early — AI wins!" : "AI fouled the 8 — you win!";
      return { foul: true, message, switchTurn: false, newYourGroup: newYour, newAiGroup: newAi, winner };
    }
    winner = turn;
    message = playerIsYou ? "You win!" : "AI wins!";
    return { foul: false, message, switchTurn: false, newYourGroup: newYour, newAiGroup: newAi, winner };
  }

  if (shot.scratched) {
    return {
      foul: true,
      message: "Scratch! Cue ball pocketed.",
      switchTurn: true,
      newYourGroup: newYour,
      newAiGroup: newAi,
      winner,
    };
  }

  if (shot.firstHit === null) {
    return {
      foul: true,
      message: "Foul — no ball hit.",
      switchTurn: true,
      newYourGroup: newYour,
      newAiGroup: newAi,
      winner,
    };
  }

  if (!openTable && effectiveGroup) {
    const stillHave = balls.some(
      (b) => !b.pocketed && !shot.pocketed.includes(b.id) && groupOf(b.id) === effectiveGroup,
    );
    if (stillHave && shot.firstHit === 8) {
      return {
        foul: true,
        message: "Foul — hit the 8 too early.",
        switchTurn: true,
        newYourGroup: newYour,
        newAiGroup: newAi,
        winner,
      };
    }
    if (stillHave && groupOf(shot.firstHit) !== effectiveGroup && shot.firstHit !== 8) {
      return {
        foul: true,
        message: "Foul — wrong ball first.",
        switchTurn: true,
        newYourGroup: newYour,
        newAiGroup: newAi,
        winner,
      };
    }
  }

  const potOwn = objectPotted.some((id) => {
    if (openTable && !newYour && !newAi) return id !== 8;
    return groupOf(id) === effectiveGroup;
  });

  if (potOwn) {
    return {
      foul: false,
      message: message || `Potted ${objectPotted.join(", ")} — shoot again!`,
      switchTurn: false,
      newYourGroup: newYour,
      newAiGroup: newAi,
      winner,
    };
  }

  return {
    foul: false,
    message: message || (objectPotted.length ? `Potted ${objectPotted.join(", ")}` : "Miss — turn ends."),
    switchTurn: true,
    newYourGroup: newYour,
    newAiGroup: newAi,
    winner,
  };
}

function aimAi(balls: Ball[], aiGroup: Group, openTable: boolean) {
  const cue = balls.find((b) => b.id === 0)!;
  const targets = legalTargets(aiGroup, balls, openTable || aiGroup == null);
  const pocks = pockets();
  let best = { angle: 0, power: 10, score: -Infinity };

  for (const tid of targets) {
    const t = balls.find((b) => b.id === tid);
    if (!t || t.pocketed) continue;
    for (const p of pocks) {
      const toPx = p.x - t.x;
      const toPy = p.y - t.y;
      const len = Math.hypot(toPx, toPy) || 1;
      const gx = t.x - (toPx / len) * BALL_R * 2;
      const gy = t.y - (toPy / len) * BALL_R * 2;
      const angle = Math.atan2(gy - cue.y, gx - cue.x);
      const travel = dist(cue.x, cue.y, gx, gy);
      const potDist = dist(t.x, t.y, p.x, p.y);
      const score = 1000 / (1 + potDist) + 200 / (1 + travel) + Math.random() * 50;
      if (score > best.score) {
        best = {
          angle,
          power: Math.min(MAX_POWER * 0.9, 5.5 + travel * 0.018 + potDist * 0.012),
          score,
        };
      }
    }
  }
  best.angle += (Math.random() - 0.5) * 0.1;
  best.power *= 0.88 + Math.random() * 0.22;
  return { angle: best.angle, power: Math.min(MAX_POWER, best.power) };
}

function placeCueSafe(balls: Ball[]) {
  const area = playArea();
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = area.left + 50 + Math.random() * (TABLE_W * 0.32);
    const y = area.top + Math.random() * (area.bottom - area.top);
    if (balls.every((b) => b.pocketed || b.id === 0 || dist(x, y, b.x, b.y) > BALL_R * 2.6)) {
      return { x, y };
    }
  }
  return { x: TABLE_W * 0.25, y: TABLE_H / 2 };
}

/* ── Drawing ───────────────────────────────────────────────────────────── */

let feltNoise: HTMLCanvasElement | null = null;

function getFeltNoise() {
  if (feltNoise) return feltNoise;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = TABLE_W;
  c.height = TABLE_H;
  const x = c.getContext("2d")!;
  for (let i = 0; i < 1400; i++) {
    const px = RAIL + Math.random() * (TABLE_W - RAIL * 2);
    const py = RAIL + Math.random() * (TABLE_H - RAIL * 2);
    x.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.035)";
    x.fillRect(px, py, 1.6, 1.6);
  }
  feltNoise = c;
  return c;
}

function drawTable(ctx: CanvasRenderingContext2D) {
  // outer wood
  const wood = ctx.createLinearGradient(0, 0, TABLE_W, TABLE_H);
  wood.addColorStop(0, "#6b3a1f");
  wood.addColorStop(0.35, "#3e2110");
  wood.addColorStop(0.7, "#5a3018");
  wood.addColorStop(1, "#2a150a");
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, TABLE_W, TABLE_H);

  // rail bevel highlight
  ctx.strokeStyle = "rgba(255,220,160,0.18)";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, TABLE_W - 8, TABLE_H - 8);

  // felt
  const felt = ctx.createRadialGradient(
    TABLE_W * 0.45,
    TABLE_H * 0.35,
    20,
    TABLE_W / 2,
    TABLE_H / 2,
    TABLE_W * 0.65,
  );
  felt.addColorStop(0, "#3a9bb5");
  felt.addColorStop(0.55, "#1f6f88");
  felt.addColorStop(1, "#145066");
  ctx.fillStyle = felt;
  roundRect(ctx, RAIL, RAIL, TABLE_W - RAIL * 2, TABLE_H - RAIL * 2, 10);
  ctx.fill();

  // cached felt grain
  const noise = getFeltNoise();
  if (noise) {
    ctx.save();
    roundRect(ctx, RAIL, RAIL, TABLE_W - RAIL * 2, TABLE_H - RAIL * 2, 10);
    ctx.clip();
    ctx.drawImage(noise, 0, 0);
    ctx.restore();
  }

  // cushion inner lip
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 6;
  roundRect(ctx, RAIL + 2, RAIL + 2, TABLE_W - RAIL * 2 - 4, TABLE_H - RAIL * 2 - 4, 8);
  ctx.stroke();

  // head string + spots
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(TABLE_W * 0.25, RAIL + 10);
  ctx.lineTo(TABLE_W * 0.25, TABLE_H - RAIL - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(TABLE_W * 0.25, TABLE_H / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(TABLE_W * 0.72, TABLE_H / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // diamonds
  ctx.fillStyle = "rgba(255,240,200,0.65)";
  for (let i = 1; i <= 3; i++) {
    const x = RAIL + ((TABLE_W - RAIL * 2) * i) / 4;
    diamond(ctx, x, RAIL / 2, 5);
    diamond(ctx, x, TABLE_H - RAIL / 2, 5);
  }
  diamond(ctx, RAIL / 2, TABLE_H / 2, 5);
  diamond(ctx, TABLE_W - RAIL / 2, TABLE_H / 2, 5);

  // pockets
  for (const p of pockets()) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#8d939c";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
    const hole = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, POCKET_R);
    hole.addColorStop(0, "#1a1a1a");
    hole.addColorStop(1, "#000");
    ctx.fillStyle = hole;
    ctx.fill();
  }
}

function drawCue(
  ctx: CanvasRenderingContext2D,
  cue: Ball,
  angle: number,
  power: number,
  pulling: boolean,
) {
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);

  // aim guide + ghost
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(cue.x + ax * (BALL_R + 2), cue.y + ay * (BALL_R + 2));
  ctx.lineTo(cue.x + ax * 280, cue.y + ay * 280);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(cue.x + ax * 90, cue.y + ay * 90, BALL_R * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.stroke();
  ctx.restore();

  const pull = pulling ? 8 + power * 4.5 : 6;
  const tipX = cue.x - ax * (BALL_R + 3 + pull);
  const tipY = cue.y - ay * (BALL_R + 3 + pull);
  const len = 195;
  const buttX = tipX - ax * len;
  const buttY = tipY - ay * len;

  // cue shadow
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tipX + 2, tipY + 3);
  ctx.lineTo(buttX + 2, buttY + 3);
  ctx.stroke();

  const grad = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
  grad.addColorStop(0, "#fff8e7");
  grad.addColorStop(0.04, "#e8d5a8");
  grad.addColorStop(0.12, "#c9a06a");
  grad.addColorStop(0.55, "#8b5a2b");
  grad.addColorStop(0.72, "#1c1c1c");
  grad.addColorStop(1, "#0a0a0a");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(buttX, buttY);
  ctx.stroke();

  // tip
  ctx.beginPath();
  ctx.arc(tipX, tipY, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = "#f5f5f5";
  ctx.fill();
}

function drawBall(ctx: CanvasRenderingContext2D, b: Ball) {
  // shadow
  ctx.beginPath();
  ctx.ellipse(b.x + 2, b.y + BALL_R * 0.55, BALL_R * 0.9, BALL_R * 0.35, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  if (b.id === 0) {
    const g = ctx.createRadialGradient(b.x - 4, b.y - 5, 2, b.x, b.y, BALL_R);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.7, "#f0f2f5");
    g.addColorStop(1, "#b8bec8");
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }

  const meta = BALL_COLORS[b.id]!;
  const g = ctx.createRadialGradient(b.x - 4, b.y - 5, 2, b.x, b.y, BALL_R);
  g.addColorStop(0, shade(meta.fill, 35));
  g.addColorStop(0.55, meta.fill);
  g.addColorStop(1, shade(meta.fill, -40));
  ctx.beginPath();
  ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  if (meta.stripe) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R - 0.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(b.x - BALL_R, b.y - BALL_R * 0.42, BALL_R * 2, BALL_R * 0.84);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(b.x, b.y, BALL_R * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#f7f7f7";
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = `bold ${Math.round(BALL_R * 0.78)}px ui-sans-serif,system-ui,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(b.id), b.x, b.y + 0.5);

  ctx.beginPath();
  ctx.arc(b.x - BALL_R * 0.35, b.y - BALL_R * 0.38, BALL_R * 0.26, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fill();
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function EightBallPool() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const ballsRef = React.useRef<Ball[]>(createBalls());
  const shotRef = React.useRef<ShotResult>({ pocketed: [], scratched: false, firstHit: null, cushionHit: false });
  const aimRef = React.useRef<AimState>({ angle: 0, power: 0, pulling: false });
  const phaseRef = React.useRef<Phase>("tutorial");
  const turnRef = React.useRef<"you" | "ai">("you");
  const groupsRef = React.useRef({ your: null as Group, ai: null as Group });
  const rafRef = React.useRef(0);
  const mouseRef = React.useRef({ x: TABLE_W * 0.5, y: TABLE_H / 2 });
  const shotFramesRef = React.useRef(0);

  const [phase, setPhase] = React.useState<Phase>("tutorial");
  const [turn, setTurn] = React.useState<"you" | "ai">("you");
  const [yourGroup, setYourGroup] = React.useState<Group>(null);
  const [aiGroup, setAiGroup] = React.useState<Group>(null);
  const [status, setStatus] = React.useState("Tap Start, then drag on the table to shoot.");
  const [winner, setWinner] = React.useState<"you" | "ai" | null>(null);
  const [powerUI, setPowerUI] = React.useState(0);

  React.useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  React.useEffect(() => {
    turnRef.current = turn;
  }, [turn]);
  React.useEffect(() => {
    groupsRef.current = { your: yourGroup, ai: aiGroup };
  }, [yourGroup, aiGroup]);

  const paint = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, TABLE_W, TABLE_H);
    drawTable(ctx);

    const balls = ballsRef.current;
    for (const b of balls) {
      if (!b.pocketed) drawBall(ctx, b);
    }

    const cue = balls.find((b) => b.id === 0);
    const ph = phaseRef.current;
    if (cue && !cue.pocketed && ph === "aim" && turnRef.current === "you") {
      drawCue(ctx, cue, aimRef.current.angle, aimRef.current.power, !!aimRef.current.pulling);
    }
  }, []);

  const finishShot = React.useCallback(() => {
    const shot = shotRef.current;
    const openTable = groupsRef.current.your == null && groupsRef.current.ai == null;
    const evaled = evaluateShot(
      shot,
      turnRef.current,
      groupsRef.current.your,
      groupsRef.current.ai,
      openTable,
      ballsRef.current,
    );

    setYourGroup(evaled.newYourGroup);
    setAiGroup(evaled.newAiGroup);
    groupsRef.current = { your: evaled.newYourGroup, ai: evaled.newAiGroup };
    setStatus(evaled.message);

    if (evaled.winner) {
      setWinner(evaled.winner);
      phaseRef.current = "over";
      setPhase("over");
      return;
    }

    const cue = ballsRef.current.find((b) => b.id === 0)!;
    if (shot.scratched || cue.pocketed) {
      cue.pocketed = false;
      const pos = placeCueSafe(ballsRef.current);
      cue.x = pos.x;
      cue.y = pos.y;
      cue.vx = 0;
      cue.vy = 0;
    }

    const next = evaled.switchTurn || evaled.foul ? (turnRef.current === "you" ? "ai" : "you") : turnRef.current;
    setTurn(next);
    turnRef.current = next;

    if (next === "ai") {
      setStatus(`${evaled.message} AI's turn…`);
      phaseRef.current = "ai-thinking";
      setPhase("ai-thinking");
    } else {
      setStatus(evaled.switchTurn || evaled.foul ? `${evaled.message} Your turn.` : evaled.message);
      phaseRef.current = "aim";
      setPhase("aim");
      aimRef.current.power = 0;
      setPowerUI(0);
    }
  }, []);

  // continuous render + physics loop
  React.useEffect(() => {
    let alive = true;
    let finishing = false;
    const loop = () => {
      if (!alive) return;
      if (phaseRef.current === "shooting") {
        shotFramesRef.current += 1;
        stepPhysics(ballsRef.current, shotRef.current);
        const stuck = shotFramesRef.current > 360; // ~6s hard stop
        if ((!ballsMoving(ballsRef.current) || stuck) && !finishing) {
          if (stuck) {
            for (const b of ballsRef.current) {
              b.vx = 0;
              b.vy = 0;
            }
          }
          finishing = true;
          shotFramesRef.current = 0;
          finishShot();
        }
      } else {
        finishing = false;
        shotFramesRef.current = 0;
        if (phaseRef.current === "aim" && turnRef.current === "you" && !aimRef.current.pulling) {
          const cue = ballsRef.current.find((b) => b.id === 0);
          if (cue && !cue.pocketed) {
            const m = mouseRef.current;
            aimRef.current.angle = Math.atan2(m.y - cue.y, m.x - cue.x);
          }
        }
      }
      paint();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [paint, finishShot]);

  // AI
  React.useEffect(() => {
    if (phase !== "ai-thinking") return;
    const t = window.setTimeout(() => {
      const openTable = groupsRef.current.your == null && groupsRef.current.ai == null;
      const shot = aimAi(ballsRef.current, groupsRef.current.ai, openTable);
      const cue = ballsRef.current.find((b) => b.id === 0)!;
      if (cue.pocketed) {
        const pos = placeCueSafe(ballsRef.current);
        cue.pocketed = false;
        cue.x = pos.x;
        cue.y = pos.y;
      }
      cue.vx = Math.cos(shot.angle) * shot.power;
      cue.vy = Math.sin(shot.angle) * shot.power;
      shotRef.current = { pocketed: [], scratched: false, firstHit: null, cushionHit: false };
      setStatus("AI shooting…");
      shotFramesRef.current = 0;
      phaseRef.current = "shooting";
      setPhase("shooting");
    }, 650);
    return () => clearTimeout(t);
  }, [phase]);

  const resetGame = () => {
    ballsRef.current = createBalls();
    shotRef.current = { pocketed: [], scratched: false, firstHit: null, cushionHit: false };
    aimRef.current = { angle: 0, power: 0, pulling: false };
    setPhase("aim");
    setTurn("you");
    setYourGroup(null);
    setAiGroup(null);
    groupsRef.current = { your: null, ai: null };
    turnRef.current = "you";
    phaseRef.current = "aim";
    setStatus("Aim with mouse · click & drag back to power · release to shoot");
    setWinner(null);
    setPowerUI(0);
  };

  function toCanvas(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * TABLE_W,
      y: ((clientY - rect.top) / rect.height) * TABLE_H,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (phaseRef.current !== "aim" || turnRef.current !== "you") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toCanvas(e.clientX, e.clientY);
    mouseRef.current = p;
    const cue = ballsRef.current.find((b) => b.id === 0);
    if (!cue || cue.pocketed) return;
    aimRef.current.angle = Math.atan2(p.y - cue.y, p.x - cue.x);
    aimRef.current.pulling = { ox: p.x, oy: p.y };
    aimRef.current.power = 0;
    setPowerUI(0);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = toCanvas(e.clientX, e.clientY);
    mouseRef.current = p;
    if (phaseRef.current !== "aim" || turnRef.current !== "you") return;

    const cue = ballsRef.current.find((b) => b.id === 0);
    if (!cue || cue.pocketed) return;

    if (!aimRef.current.pulling) {
      aimRef.current.angle = Math.atan2(p.y - cue.y, p.x - cue.x);
      return;
    }

    // Power = how far you dragged from press point (any direction works)
    const pull = aimRef.current.pulling;
    const dragDist = dist(p.x, p.y, pull.ox, pull.oy);
    const power = Math.min(MAX_POWER, dragDist / 14);

    // Aim: prefer direction from cue toward current mouse (shot goes that way)
    // If user is clearly pulling opposite the initial aim, keep locked aim
    const toMouse = Math.atan2(p.y - cue.y, p.x - cue.x);
    const ax = Math.cos(aimRef.current.angle);
    const ay = Math.sin(aimRef.current.angle);
    const behind = -((p.x - cue.x) * ax + (p.y - cue.y) * ay);
    if (behind > 20) {
      // pulling behind cue — keep aim, increase power from behind distance
      aimRef.current.power = Math.min(MAX_POWER, behind / 12);
    } else {
      aimRef.current.angle = toMouse;
      aimRef.current.power = power;
    }
    setPowerUI(aimRef.current.power / MAX_POWER);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!aimRef.current.pulling) return;
    e.preventDefault();
    const power = aimRef.current.power;
    aimRef.current.pulling = false;
    setPowerUI(0);

    if (phaseRef.current !== "aim" || turnRef.current !== "you") return;
    if (power < 1.2) {
      setStatus("Drag farther for more power, then release.");
      return;
    }

    const cue = ballsRef.current.find((b) => b.id === 0)!;
    const a = aimRef.current.angle;
    cue.vx = Math.cos(a) * power;
    cue.vy = Math.sin(a) * power;
    shotRef.current = { pocketed: [], scratched: false, firstHit: null, cushionHit: false };
    aimRef.current.power = 0;
    shotFramesRef.current = 0;
    phaseRef.current = "shooting";
    setPhase("shooting");
    setStatus("Rolling…");
  }

  function setPowerFromSlider(v: number) {
    if (phase !== "aim" || turn !== "you") return;
    aimRef.current.power = v * MAX_POWER;
    setPowerUI(v);
  }

  function shootFromSlider() {
    if (phaseRef.current !== "aim" || turnRef.current !== "you") return;
    const power = aimRef.current.power > 0.5 ? aimRef.current.power : powerUI * MAX_POWER;
    if (power < 1.2) {
      setStatus("Raise power on the slider, then hit Shoot.");
      return;
    }
    const cue = ballsRef.current.find((b) => b.id === 0)!;
    if (cue.pocketed) return;
    const a = aimRef.current.angle;
    cue.vx = Math.cos(a) * power;
    cue.vy = Math.sin(a) * power;
    shotRef.current = { pocketed: [], scratched: false, firstHit: null, cushionHit: false };
    aimRef.current.power = 0;
    setPowerUI(0);
    shotFramesRef.current = 0;
    phaseRef.current = "shooting";
    setPhase("shooting");
    setStatus("Rolling…");
  }

  const yourPotted = ballsRef.current.filter((b) => b.pocketed && groupOf(b.id) === yourGroup).length;
  const aiPotted = ballsRef.current.filter((b) => b.pocketed && groupOf(b.id) === aiGroup).length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <Notice tone="info">
        Touch / mouse se aim karo. Drag se power, ya neeche slider + Shoot use karo.
      </Notice>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:gap-4 sm:text-sm">
          <span className="font-semibold">
            Turn:{" "}
            <span className={turn === "you" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>
              {turn === "you" ? "You" : "AI"}
            </span>
          </span>
          <span className="text-muted">
            You: {yourGroup ? `${yourGroup === "solid" ? "Solids" : "Stripes"} (${yourPotted}/7)` : "Open"}
          </span>
          <span className="text-muted">
            AI: {aiGroup ? `${aiGroup === "solid" ? "Solids" : "Stripes"} (${aiPotted}/7)` : "Open"}
          </span>
        </div>
        <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto" onClick={resetGame}>
          New game
        </Button>
      </div>

      <div
        ref={wrapRef}
        className="relative -mx-1 overflow-hidden rounded-xl border border-border bg-[#071018] shadow-xl sm:mx-0 sm:rounded-2xl"
      >
        <canvas
          ref={canvasRef}
          width={TABLE_W}
          height={TABLE_H}
          className="block h-auto w-full touch-none select-none"
          style={{ cursor: phase === "aim" && turn === "you" ? "crosshair" : "default", maxHeight: "70vh" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        <div className="pointer-events-none absolute bottom-2 left-2 max-w-[70%] rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm sm:bottom-3 sm:left-3 sm:max-w-[75%] sm:px-3 sm:py-1.5 sm:text-xs">
          {status}
        </div>

        <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1 sm:bottom-3 sm:right-3">
          <div className="pointer-events-none h-20 w-2.5 overflow-hidden rounded-full border border-white/40 bg-black/50 sm:h-28 sm:w-3">
            <div
              className="w-full bg-gradient-to-t from-emerald-400 via-yellow-400 to-red-500"
              style={{
                height: `${Math.round(powerUI * 100)}%`,
                marginTop: `${Math.round((1 - powerUI) * 100)}%`,
              }}
            />
          </div>
        </div>

        {phase === "tutorial" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 p-3 sm:p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#15202b] p-4 text-center shadow-2xl sm:p-6">
              <p className="text-xl font-bold text-yellow-400 sm:text-2xl">8 Ball Pool</p>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                1) Aim — finger / mouse move
                <br />
                2) Drag for power (or use slider)
                <br />
                3) Release / tap <b>Shoot</b>
              </p>
              <button
                type="button"
                className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-3.5 text-base font-bold text-white hover:bg-emerald-400"
                onClick={resetGame}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {phase === "over" && winner && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/65 p-3 sm:p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#15202b] p-4 text-center sm:p-6">
              <p className="text-xl font-bold text-yellow-400 sm:text-2xl">{winner === "you" ? "You win!" : "AI wins!"}</p>
              <p className="mt-2 text-sm text-white/80">{status}</p>
              <button
                type="button"
                className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-3.5 text-base font-bold text-white hover:bg-emerald-400"
                onClick={resetGame}
              >
                Play again
              </button>
            </div>
          </div>
        )}

        {phase === "ai-thinking" && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-black sm:right-3 sm:top-3 sm:px-3 sm:text-xs">
            AI thinking…
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex w-full min-w-0 flex-1 items-center gap-3 text-sm">
          <span className="shrink-0 font-medium">Power</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(powerUI * 100)}
            disabled={phase !== "aim" || turn !== "you"}
            onChange={(e) => setPowerFromSlider(Number(e.target.value) / 100)}
            className="min-h-11 w-full accent-emerald-500"
          />
          <span className="w-10 shrink-0 text-right text-muted">{Math.round(powerUI * 100)}%</span>
        </label>
        <Button
          type="button"
          size="md"
          className="w-full sm:w-auto"
          disabled={phase !== "aim" || turn !== "you"}
          onClick={shootFromSlider}
        >
          Shoot
        </Button>
      </div>

      <div className="grid gap-1.5 text-[11px] text-muted sm:grid-cols-3 sm:gap-2 sm:text-xs">
        <p>
          <span className="font-semibold text-foreground">Aim:</span> move on table
        </p>
        <p>
          <span className="font-semibold text-foreground">Power:</span> drag or slider
        </p>
        <p>
          <span className="font-semibold text-foreground">Shoot:</span> release / Shoot btn
        </p>
      </div>
    </div>
  );
}
