"use client";

import * as React from "react";
import CryptoJS from "crypto-js";
import { Input, Select, Button, Textarea } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Notice, Stat } from "@/components/tools/shared";

/* ---------------------------- Password generator --------------------------- */
const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};
function randPick(chars: string, n: number) {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return [...a].map((x) => chars[x % chars.length]).join("");
}
export function PasswordGenerator({ bulk }: { bulk?: boolean }) {
  const [len, setLen] = React.useState(16);
  const [count, setCount] = React.useState(bulk ? 10 : 1);
  const [opts, setOpts] = React.useState({ upper: true, lower: true, digits: true, symbols: true });
  const [list, setList] = React.useState<string[]>([]);
  const gen = React.useCallback(() => {
    let pool = "";
    (Object.keys(SETS) as (keyof typeof SETS)[]).forEach((k) => { if (opts[k]) pool += SETS[k]; });
    if (!pool) pool = SETS.lower;
    setList(Array.from({ length: Math.max(1, Math.min(200, count)) }, () => randPick(pool, len)));
  }, [len, count, opts]);
  React.useEffect(() => { gen(); }, [gen]);
  return (
    <div className="space-y-4">
      {!bulk && list[0] && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <code className="min-w-0 flex-1 break-all font-mono text-lg">{list[0]}</code>
          <CopyButton value={list[0]} />
        </div>
      )}
      <Field label={`Length: ${len}`}>
        <input type="range" min={6} max={64} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <div className="flex flex-wrap gap-4 text-sm">
        {(Object.keys(SETS) as (keyof typeof SETS)[]).map((k) => (
          <label key={k} className="flex items-center gap-2 capitalize">
            <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} /> {k}
          </label>
        ))}
      </div>
      {bulk && (
        <Field label="How many"><Input type="number" value={count} onChange={(e) => setCount(+e.target.value)} className="w-32" /></Field>
      )}
      <Button onClick={gen}>↻ Generate</Button>
      {bulk && <Output value={list.join("\n")} rows={Math.min(10, list.length)} filename="passwords.txt" />}
    </div>
  );
}

/* ---------------------------- Strength / entropy --------------------------- */
function entropyBits(pw: string) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  return pw.length * Math.log2(pool || 1);
}
function crackTime(bits: number) {
  const guesses = Math.pow(2, bits) / 2;
  const perSec = 1e10;
  const secs = guesses / perSec;
  if (secs < 1) return "instantly";
  const units: [number, string][] = [[31536000, "years"], [86400, "days"], [3600, "hours"], [60, "minutes"], [1, "seconds"]];
  for (const [u, l] of units) if (secs >= u) return `${(secs / u).toFixed(secs / u > 100 ? 0 : 1)} ${l}`;
  return "instantly";
}
export function PasswordStrength() {
  const [pw, setPw] = React.useState("");
  const bits = entropyBits(pw);
  const label = bits < 28 ? "Very weak" : bits < 36 ? "Weak" : bits < 60 ? "Reasonable" : bits < 128 ? "Strong" : "Very strong";
  const pct = Math.min(100, (bits / 128) * 100);
  const color = bits < 36 ? "bg-rose-500" : bits < 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-4">
      <Field label="Enter a password"><Input value={pw} onChange={(e) => setPw(e.target.value)} className="font-mono" /></Field>
      <div className="h-3 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Strength" value={label} />
        <Stat label="Entropy" value={`${Math.round(bits)} bits`} />
        <Stat label="Crack time" value={crackTime(bits)} />
      </div>
    </div>
  );
}
export function PasswordEntropy() { return <PasswordStrength />; }

/* ------------------------------ Hash generators ---------------------------- */
const HASHERS: Record<string, (s: string) => CryptoJS.lib.WordArray> = {
  MD5: CryptoJS.MD5, SHA1: CryptoJS.SHA1, SHA256: CryptoJS.SHA256,
  SHA512: CryptoJS.SHA512, SHA3: CryptoJS.SHA3, RIPEMD160: CryptoJS.RIPEMD160,
};
export function HashGenerator({ algo, base64 }: { algo?: string; base64?: boolean }) {
  const [text, setText] = React.useState("");
  const [picked, setPicked] = React.useState(algo ?? "SHA256");
  const active = algo ?? picked;
  const wa = text ? HASHERS[active](text) : null;
  const out = wa ? (base64 ? wa.toString(CryptoJS.enc.Base64) : wa.toString()) : "";
  return (
    <div className="space-y-4">
      <Field label="Text to hash"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="font-sans" /></Field>
      {!algo && (
        <Field label="Algorithm">
          <Select value={picked} onChange={(e) => setPicked(e.target.value)}>
            {Object.keys(HASHERS).map((a) => <option key={a}>{a}</option>)}
          </Select>
        </Field>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm">{out || `${active} hash appears here…`}</code>
        <CopyButton value={out} />
      </div>
    </div>
  );
}

/* ------------------------------ HMAC --------------------------------------- */
export function HmacGenerator() {
  const [text, setText] = React.useState("");
  const [key, setKey] = React.useState("");
  const [algo, setAlgo] = React.useState("SHA256");
  const fns: Record<string, (m: string, k: string) => CryptoJS.lib.WordArray> = {
    SHA256: CryptoJS.HmacSHA256, SHA1: CryptoJS.HmacSHA1, SHA512: CryptoJS.HmacSHA512, MD5: CryptoJS.HmacMD5,
  };
  const out = text && key ? fns[algo](text, key).toString() : "";
  return (
    <div className="space-y-4">
      <Field label="Message"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Secret key"><Input value={key} onChange={(e) => setKey(e.target.value)} /></Field>
        <Field label="Algorithm"><Select value={algo} onChange={(e) => setAlgo(e.target.value)}>{Object.keys(fns).map((a) => <option key={a}>{a}</option>)}</Select></Field>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm">{out || "HMAC appears here…"}</code>
        <CopyButton value={out} />
      </div>
    </div>
  );
}

/* ------------------------------ AES encrypt -------------------------------- */
export function AesTool() {
  const [mode, setMode] = React.useState<"enc" | "dec">("enc");
  const [text, setText] = React.useState("");
  const [pass, setPass] = React.useState("");
  let out = "", error = "";
  try {
    if (text && pass) {
      out = mode === "enc"
        ? CryptoJS.AES.encrypt(text, pass).toString()
        : CryptoJS.AES.decrypt(text, pass).toString(CryptoJS.enc.Utf8);
      if (mode === "dec" && !out) error = "Wrong passphrase or corrupted ciphertext.";
    }
  } catch { error = "Decryption failed."; }
  return (
    <div className="space-y-4">
      <Select value={mode} onChange={(e) => setMode(e.target.value as "enc")} className="max-w-56">
        <option value="enc">Encrypt</option>
        <option value="dec">Decrypt</option>
      </Select>
      <Field label={mode === "enc" ? "Plain text" : "Ciphertext"}><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} /></Field>
      <Field label="Passphrase"><Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
      {error ? <Notice tone="error">{error}</Notice> : <Output value={out} rows={4} />}
    </div>
  );
}

/* ------------------------------ Token / PIN / key -------------------------- */
export function TokenGenerator({ kind }: { kind: "token" | "pin" | "api" | "salt" | "key" | "csrf" }) {
  const cfg = {
    token: { len: 32, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" },
    api: { len: 40, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" },
    csrf: { len: 32, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" },
    salt: { len: 16, chars: "0123456789abcdef" },
    key: { len: 64, chars: "0123456789abcdef" },
    pin: { len: 6, chars: "0123456789" },
  }[kind];
  const [len, setLen] = React.useState(cfg.len);
  const [list, setList] = React.useState<string[]>([]);
  const prefix = kind === "api" ? "sk_live_" : "";
  const gen = React.useCallback(() => {
    setList(Array.from({ length: 5 }, () => prefix + randPick(cfg.chars, len)));
  }, [len, kind]);
  React.useEffect(() => { gen(); }, [gen]);
  return (
    <div className="space-y-4">
      <Field label={`Length: ${len}`}>
        <input type="range" min={4} max={kind === "pin" ? 12 : 128} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <Button onClick={gen}>↻ Generate</Button>
      <Output value={list.join("\n")} rows={5} filename={`${kind}.txt`} />
    </div>
  );
}

/* ------------------------------ Passphrase --------------------------------- */
const WORDS = "able acid aged army away baby back ball band bank base bath bear beat bell belt bird blue boat body bone book boot born boss both bowl bulk burn bush busy cake call calm camp card care cash cell chat chip city clay clip club coal coat code coin cold cool copy core corn cost crew crop dark dash data date dawn days deal dear debt deck deep deer desk dial diet disk dock door dose down draw drop drum dual duck dust duty each earn ease east easy edge else even ever evil exit face fact fade fail fair fall farm fast fate fear feed feel feet fell felt file fill film find fine fire firm fish five flag flat flaw flow folk food foot fork form fort four free frog from fuel full fund gain game gate gear gift girl give glad goal goat gold golf gone good gray grew grid grim grin grip grow gulf hair half hall hand hang hard harm hawk head heal heap hear heat held hell helm help herb herd hero hide high hill hint hire hold hole holy home hood hook hope horn host hour huge hull hunt hurt icon idea inch iron item jump junk keep kept kick kind king kiss kite knee knew knot know lace lack lady lake lamp land lane last late lawn lazy lead leaf lean leap left lend lens less life lift like lime line link lion list live load loan lock loft logo long look loop lord lose loss lost loud love luck lump lung made mail main make male mall many mark mask mass mast mate math meal mean meat meet melt menu mere mesh mile milk mill mind mine mint miss mist mode mold mole monk mood moon more moss most moth move much mule muse must mute nail name navy near neat neck need nest news next nice nine node none noon norm nose note noun null oath obey odds okay omit once only onto open oral oven over pace pack page paid pain pair palm pant park part pass past path peak peer pile pill pine pink pipe plan play plea plot plug plus poem poet pole poll pond pool poor pore port pose post pour pray prep prey pull pump pure push quit race rack rage rail rain rank rare rate read real reap rear reef rely rent rest rice rich ride ring riot rise risk road roar robe rock role roll roof room root rope rose ruby rule rush rust sack safe said sail sake sale salt same sand save scan seal seat seed seek seem self sell send sept ship shoe shop shot show shut sick side sign silk sing sink site size skin slip slot slow snap snow soak soap sock soft soil sold sole solo some song soon sort soul soup sour span spin spit spot star stay stem step stir stop stub such suit sung sure surf swap swim sync tail take tale talk tall tank tape task team tear tech teen tell tend tent term test text than that thaw them then they thin this thus tick tide tidy tied tier tile till tilt time tiny tire toad toll tomb tone tool torn tour town trap tray tree trim trip true tube tune turn twin twit type unit upon urge used user vary vase vast verb very vest vial vibe view vine void vote wade wage wait wake walk wall wand want ward ware warm warn wart wash wave weak wear weed week well went were west what when whip whom wide wife wild will wind wine wing wink wire wise wish with wolf wood wool word wore work worm worn wrap yard yarn yeah year yell yoga yolk zero zone zoom".split(" ");
export function PassphraseGenerator() {
  const [n, setN] = React.useState(4);
  const [list, setList] = React.useState<string[]>([]);
  const gen = React.useCallback(() => {
    setList(Array.from({ length: 5 }, () => {
      const idx = new Uint32Array(n); crypto.getRandomValues(idx);
      return [...idx].map((x) => WORDS[x % WORDS.length]).join("-");
    }));
  }, [n]);
  React.useEffect(() => { gen(); }, [gen]);
  return (
    <div className="space-y-4">
      <Field label={`Words: ${n}`}><input type="range" min={3} max={8} value={n} onChange={(e) => setN(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      <Button onClick={gen}>↻ Generate</Button>
      <Output value={list.join("\n")} rows={5} mono={false} filename="passphrases.txt" />
    </div>
  );
}

/* ------------------------------ Ciphers ------------------------------------ */
export function CaesarCipher() {
  const [text, setText] = React.useState("Hello World");
  const [shift, setShift] = React.useState(3);
  const out = text.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + (shift % 26) + 26) % 26) + base);
  });
  return (
    <div className="space-y-4">
      <Field label="Text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} /></Field>
      <Field label={`Shift: ${shift}`}><input type="range" min={0} max={25} value={shift} onChange={(e) => setShift(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      <Output value={out} rows={3} mono={false} />
    </div>
  );
}
export function Rot47() {
  const [text, setText] = React.useState("Hello World");
  const out = text.replace(/[!-~]/g, (c) => String.fromCharCode(33 + ((c.charCodeAt(0) - 33 + 47) % 94)));
  return (
    <div className="space-y-4">
      <Field label="Text (ROT47 is its own inverse)"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} /></Field>
      <Output value={out} rows={3} mono={false} />
    </div>
  );
}

/* ------------------------------ CRC32 -------------------------------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function Crc32() {
  const [text, setText] = React.useState("");
  let crc = 0xffffffff;
  for (let i = 0; i < text.length; i++) crc = CRC_TABLE[(crc ^ text.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  const out = text ? ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0") : "";
  return (
    <div className="space-y-4">
      <Field label="Text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} /></Field>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="flex-1 font-mono">{out || "CRC32 checksum…"}</code>
        <CopyButton value={out} />
      </div>
    </div>
  );
}

/* ------------------------------ Hash identifier ---------------------------- */
export function HashIdentifier() {
  const [h, setH] = React.useState("");
  const t = h.trim();
  const guesses: string[] = [];
  if (/^[a-f0-9]{32}$/i.test(t)) guesses.push("MD5", "NTLM");
  if (/^[a-f0-9]{40}$/i.test(t)) guesses.push("SHA-1");
  if (/^[a-f0-9]{64}$/i.test(t)) guesses.push("SHA-256");
  if (/^[a-f0-9]{128}$/i.test(t)) guesses.push("SHA-512");
  if (/^\$2[aby]\$/.test(t)) guesses.push("bcrypt");
  if (/^\$argon2/.test(t)) guesses.push("Argon2");
  return (
    <div className="space-y-4">
      <Field label="Hash string"><Input value={h} onChange={(e) => setH(e.target.value)} className="font-mono" /></Field>
      {t && (
        <Notice tone={guesses.length ? "success" : "info"}>
          {guesses.length ? `Likely: ${guesses.join(", ")}` : "Unrecognised hash format."}
        </Notice>
      )}
    </div>
  );
}
