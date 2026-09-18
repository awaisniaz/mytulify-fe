"use client";

import * as React from "react";
import bcrypt from "bcryptjs";
import md4 from "js-md4";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Field, Output, CopyButton, Notice, CopyResult } from "@/components/tools/shared";

export function BcryptGenerator() {
  const [text, setText] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [rounds, setRounds] = React.useState(10);
  const [hash, setHash] = React.useState("");
  const [verify, setVerify] = React.useState("");
  const [match, setMatch] = React.useState<boolean | null>(null);

  const generate = () => {
    if (!text) return;
    setHash(bcrypt.hashSync(text, rounds));
    setMatch(null);
  };

  const check = () => {
    if (!hash || !verify) return;
    setMatch(bcrypt.compareSync(verify, hash));
  };

  return (
    <div className="space-y-4">
      <Field label="Password"><Input type={show ? "text" : "password"} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
      <Field label={`Cost rounds: ${rounds}`}>
        <input type="range" min={4} max={14} value={rounds} onChange={(e) => setRounds(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <Button onClick={generate}>Generate bcrypt hash</Button>
      {hash && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <code className="min-w-0 flex-1 break-all font-mono text-sm">{hash}</code>
          <CopyButton value={hash} />
        </div>
      )}
      {hash && (
        <>
          <Field label="Verify a password against the hash"><Input type={show ? "text" : "password"} value={verify} onChange={(e) => setVerify(e.target.value)} /></Field>
          <Button variant="secondary" onClick={check}>Verify</Button>
          {match !== null && <Notice tone={match ? "success" : "error"}>{match ? "Password matches." : "Password does not match."}</Notice>}
        </>
      )}
    </div>
  );
}

function ntlmHash(text: string): string {
  const buf = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    buf[i * 2] = c & 0xff;
    buf[i * 2 + 1] = (c >> 8) & 0xff;
  }
  return md4(buf).toUpperCase();
}

export function NtlmHashGenerator() {
  const [text, setText] = React.useState("");
  const [upper, setUpper] = React.useState(true);
  const raw = text ? ntlmHash(text) : "";
  const out = upper ? raw : raw.toLowerCase();
  return (
    <div className="space-y-4">
      <Field label="Password / text"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase hex</label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm">{out || "NTLM hash…"}</code>
        <CopyButton value={out} />
      </div>
      {out && <CopyResult filename="ntlm.txt" rows={[["NTLM", out], ["Length", String(out.length)]]} />}
    </div>
  );
}

function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

async function totp(secret: string, period: number, digits: number): Promise<string> {
  const key = base32Decode(secret.replace(/\s/g, ""));
  const counter = Math.floor(Date.now() / 1000 / period);
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter, false);
  const keyBytes = new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const code = ((sig[offset] & 0x7f) << 24) | (sig[offset + 1] << 16) | (sig[offset + 2] << 8) | sig[offset + 3];
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function TotpGenerator() {
  const [secret, setSecret] = React.useState("JBSWY3DPEHPK3PXP");
  const [issuer, setIssuer] = React.useState("Mytulify");
  const [account, setAccount] = React.useState("user@example.com");
  const [period, setPeriod] = React.useState(30);
  const [digits, setDigits] = React.useState(6);
  const [code, setCode] = React.useState("");
  const [remaining, setRemaining] = React.useState(period);

  React.useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!secret.trim()) return;
      try {
        const c = await totp(secret, period, digits);
        if (alive) {
          setCode(c);
          setRemaining(period - (Math.floor(Date.now() / 1000) % period));
        }
      } catch {
        if (alive) setCode("Invalid secret");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => { alive = false; clearInterval(id); };
  }, [secret, period, digits]);

  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret.replace(/\s/g, "")}&issuer=${encodeURIComponent(issuer)}&period=${period}&digits=${digits}`;

  return (
    <div className="space-y-4">
      <Field label="Base32 secret"><Input value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" placeholder="JBSWY3DPEHPK3PXP" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Issuer"><Input value={issuer} onChange={(e) => setIssuer(e.target.value)} /></Field>
        <Field label="Account"><Input value={account} onChange={(e) => setAccount(e.target.value)} /></Field>
        <Field label="Period (seconds)"><Input type="number" value={period} onChange={(e) => setPeriod(+e.target.value)} /></Field>
        <Field label="Digits"><Select value={String(digits)} onChange={(e) => setDigits(+e.target.value)}><option value="6">6</option><option value="8">8</option></Select></Field>
      </div>
      <div className="rounded-2xl border border-border bg-surface-2 p-6 text-center">
        <div className="font-mono text-4xl font-bold tracking-widest text-brand">{code || "------"}</div>
        <p className="mt-2 text-sm text-muted">Refreshes in {remaining}s</p>
      </div>
      <CopyButton value={code} label="Copy code" />
      <Field label="otpauth URL"><Output value={otpauth} rows={2} filename="otpauth.txt" /></Field>
    </div>
  );
}

export function Argon2HashGenerator() {
  const [text, setText] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [iter, setIter] = React.useState(3);
  const [mem, setMem] = React.useState(64);
  const [hash, setHash] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const generate = async () => {
    if (!text) return;
    setBusy(true);
    try {
      const { argon2id } = await import("hash-wasm");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
      const h = await argon2id({
        password: text,
        salt,
        parallelism: 1,
        iterations: iter,
        memorySize: mem * 1024,
        hashLength: 32,
        outputType: "encoded",
      });
      setHash(h || `$argon2id$v=19$m=${mem * 1024},t=${iter},p=1$${saltHex}$…`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Field label="Password"><Input type={show ? "text" : "password"} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
      <Field label={`Iterations ${iter}`}><input type="range" min={1} max={8} value={iter} onChange={(e) => setIter(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      <Field label={`Memory ${mem} MB`}><input type="range" min={16} max={256} step={16} value={mem} onChange={(e) => setMem(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      <Button onClick={generate} disabled={busy}>{busy ? "Hashing…" : "Generate Argon2id hash"}</Button>
      {hash && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <code className="min-w-0 flex-1 break-all font-mono text-xs">{hash}</code>
          <CopyButton value={hash} />
        </div>
      )}
    </div>
  );
}

export function HtpasswdGenerator() {
  const [user, setUser] = React.useState("admin");
  const [pass, setPass] = React.useState("");
  const [rounds, setRounds] = React.useState(10);
  const [out, setOut] = React.useState("");

  const generate = () => {
    if (!user || !pass) return;
    const line = `${user}:${bcrypt.hashSync(pass, rounds)}`;
    setOut((prev) => (prev ? `${prev}\n${line}` : line));
  };

  return (
    <div className="space-y-4">
      <Field label="Username"><Input value={user} onChange={(e) => setUser(e.target.value)} /></Field>
      <Field label="Password"><Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></Field>
      <Field label={`bcrypt rounds: ${rounds}`}>
        <input type="range" min={4} max={14} value={rounds} onChange={(e) => setRounds(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate}>Add htpasswd line</Button>
        <Button variant="secondary" onClick={() => setOut("")}>Clear list</Button>
      </div>
      {out && <Output value={out} rows={6} filename="htpasswd.txt" />}
      <Notice tone="info">Generates bcrypt htpasswd entries compatible with Apache and Nginx. Add multiple users, then download.</Notice>
    </div>
  );
}
