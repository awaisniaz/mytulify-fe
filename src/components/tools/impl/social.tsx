"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Input, Textarea, Button, Select } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Stat, Notice, FileDrop } from "@/components/tools/shared";
import {
  applyLineBreakMethod,
  BANNED_IG_TAGS,
  COUNTRY_CODES,
  extractHashtags,
  filterEmojis,
  EMOJI_CATEGORIES,
  IMAGE_SIZES,
  PLATFORM_LIMITS,
  ytVideoId,
} from "@/lib/social-tools";
import { download } from "@/lib/utils";

/* --------------------------- WhatsApp link --------------------------------- */
export function WhatsAppLink() {
  const [country, setCountry] = React.useState("PK");
  const [phone, setPhone] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [linkType, setLinkType] = React.useState<"chat" | "api">("chat");
  const [qr, setQr] = React.useState("");
  const dial = COUNTRY_CODES.find((c) => c.code === country)?.dial ?? "";
  const local = phone.replace(/[^0-9]/g, "");
  const full = `${dial}${local}`.replace(/^0+/, "");
  const link =
    full
      ? linkType === "chat"
        ? `https://wa.me/${full}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`
        : `https://api.whatsapp.com/send?phone=${full}${msg ? `&text=${encodeURIComponent(msg)}` : ""}`
      : "";

  React.useEffect(() => {
    if (!link) { setQr(""); return; }
    QRCode.toDataURL(link, { width: 220, margin: 2 }).then(setQr).catch(() => setQr(""));
  }, [link]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Country code">
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>{c.name} (+{c.dial})</option>
            ))}
          </Select>
        </Field>
        <Field label="Phone number" hint="Local number without country code">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="3001234567" />
        </Field>
      </div>
      <Field label="Pre-filled message (optional)">
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="font-sans" placeholder="Hi! I found you via…" />
      </Field>
      <Field label="Link format">
        <Select value={linkType} onChange={(e) => setLinkType(e.target.value as "chat" | "api")}>
          <option value="chat">wa.me (short link)</option>
          <option value="api">api.whatsapp.com (full API link)</option>
        </Select>
      </Field>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all text-sm">{link || "Your WhatsApp link…"}</code>
        <CopyButton value={link} />
      </div>
      {link && (
        <div className="flex flex-wrap gap-2">
          <a href={link} target="_blank" rel="noreferrer"><Button variant="secondary">Open chat ↗</Button></a>
          <Button variant="secondary" onClick={() => download(link, "whatsapp-link.txt", "text/plain")}>Save link</Button>
        </div>
      )}
      {qr && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-sm font-medium">Scan QR code</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="WhatsApp QR" className="rounded-lg" width={220} height={220} />
          <Button size="sm" variant="secondary" onClick={() => download(qr, "whatsapp-qr.png")}>Download QR</Button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Hashtag counter ------------------------------- */
type HashtagPlatform = "instagram" | "tiktok" | "linkedin" | "twitter" | "pinterest";

export function HashtagCounter() {
  const [text, setText] = React.useState("");
  const [platform, setPlatform] = React.useState<HashtagPlatform>("instagram");
  const tags = extractHashtags(text);
  const lower = tags.map((t) => t.toLowerCase());
  const unique = [...new Set(lower)];
  const dupes = lower.filter((t, i) => lower.indexOf(t) !== i);
  const limits: Record<HashtagPlatform, number> = { instagram: 30, tiktok: 100, linkedin: 0, twitter: 0, pinterest: 20 };
  const max = limits[platform];
  const banned = unique.filter((t) => BANNED_IG_TAGS.has(t));
  const density = text.replace(/\s/g, "").length ? Math.round((tags.join("").length / text.replace(/\s/g, "").length) * 100) : 0;

  return (
    <div className="space-y-4">
      <Field label="Platform limit">
        <Select value={platform} onChange={(e) => setPlatform(e.target.value as HashtagPlatform)}>
          <option value="instagram">Instagram (max 30)</option>
          <option value="tiktok">TikTok (max 100)</option>
          <option value="pinterest">Pinterest (max 20)</option>
          <option value="twitter">X / Twitter (no hard limit)</option>
          <option value="linkedin">LinkedIn (no hard limit)</option>
        </Select>
      </Field>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-sans" placeholder="Paste your caption with #hashtags…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hashtags" value={tags.length} />
        <Stat label="Unique" value={unique.length} />
        <Stat label="Characters" value={text.length} />
        <Stat label="Hashtag density" value={`${density}%`} />
      </div>
      {max > 0 && tags.length > max && <Notice tone="error">{platform} allows max {max} hashtags — you have {tags.length}.</Notice>}
      {dupes.length > 0 && <Notice tone="error">Duplicate hashtags: {dupes.join(", ")}</Notice>}
      {banned.length > 0 && <Notice tone="error">Spam/banned tags detected: {banned.join(", ")}</Notice>}
      <div className="flex flex-wrap gap-2">
        {unique.map((t) => (
          <span key={t} className={`rounded-full px-3 py-1 text-sm ${dupes.includes(t) || banned.includes(t) ? "bg-rose-500/10 text-rose-500" : "bg-brand/10 text-brand"}`}>{t}</span>
        ))}
      </div>
      {unique.length > 0 && <Output value={unique.join(" ")} rows={3} mono={false} filename="hashtags.txt" />}
    </div>
  );
}

/* ------------------------ Instagram line break ----------------------------- */
export function InstagramLineBreak() {
  const [text, setText] = React.useState("");
  const [method, setMethod] = React.useState<"braille" | "zero-width" | "dots" | "dash">("braille");
  const out = applyLineBreakMethod(text, method);
  const charLeft = PLATFORM_LIMITS.instagram.chars - out.length;

  return (
    <div className="space-y-4">
      <Notice tone="info">Add invisible or minimal characters on blank lines so Instagram keeps your spacing.</Notice>
      <Field label="Spacing method">
        <Select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
          <option value="braille">Braille blank (⠀) — most reliable</option>
          <option value="zero-width">Zero-width space</option>
          <option value="dots">Middle dot (·)</option>
          <option value="dash">Em dash (—)</option>
        </Select>
      </Field>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="font-sans" placeholder={"Line one\n\nLine two after blank line\n\nCall to action 👇"} />
      <div className="flex gap-3 text-sm">
        <span className={charLeft < 0 ? "text-rose-500" : "text-emerald-500"}>{out.length} / {PLATFORM_LIMITS.instagram.chars} chars</span>
        <span className="text-muted">{charLeft >= 0 ? `${charLeft} left` : `${-charLeft} over limit`}</span>
      </div>
      <Output value={out} mono={false} rows={8} />
    </div>
  );
}

/* --------------------------- YouTube thumbnail ----------------------------- */
export function YouTubeThumbnail() {
  const [url, setUrl] = React.useState("");
  const [batch, setBatch] = React.useState("");
  const id = ytVideoId(url);
  const batchIds = batch.split(/[\n,]+/).map((u) => ytVideoId(u.trim())).filter(Boolean) as string[];
  const sizes = (vid: string) => [
    ["Max (1280×720)", `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`],
    ["High (480×360)", `https://img.youtube.com/vi/${vid}/hqdefault.jpg`],
    ["Medium (320×180)", `https://img.youtube.com/vi/${vid}/mqdefault.jpg`],
    ["Standard (640×480)", `https://img.youtube.com/vi/${vid}/sddefault.jpg`],
    ["Default (120×90)", `https://img.youtube.com/vi/${vid}/default.jpg`],
  ];

  async function dl(src: string, name: string) {
    const res = await fetch(src);
    const blob = await res.blob();
    download(blob, name);
  }

  return (
    <div className="space-y-6">
      <Field label="YouTube video URL or ID">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=… or youtu.be/…" />
      </Field>
      {url && !id && <Notice tone="error">Could not detect a valid YouTube video ID.</Notice>}
      {id && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sizes(id).map(([label, src]) => (
            <div key={label} className="overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={label} className="w-full bg-surface-2" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.4"; }} />
              <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-2 px-3 py-2 text-sm">
                <span>{label}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => dl(src, `yt-${id}-${label.split(" ")[0].toLowerCase()}.jpg`)}>Download</Button>
                  <a href={src} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost">Open ↗</Button></a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Field label="Batch URLs (one per line)" hint="Extract thumbnails for multiple videos">
        <Textarea value={batch} onChange={(e) => setBatch(e.target.value)} rows={4} className="font-sans" placeholder="https://youtu.be/abc…&#10;https://youtube.com/watch?v=…" />
      </Field>
      {batchIds.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {batchIds.map((vid) => (
            <div key={vid} className="flex items-center gap-3 rounded-xl border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" className="h-14 w-24 rounded object-cover" />
              <code className="flex-1 text-xs">{vid}</code>
              <Button size="sm" variant="secondary" onClick={() => dl(`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`, `yt-${vid}-max.jpg`)}>DL</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Image size reference -------------------------- */
export function SocialImageSizes() {
  const platforms = [...new Set(IMAGE_SIZES.map((s) => s.platform))];
  const [filter, setFilter] = React.useState("All");
  const rows = filter === "All" ? IMAGE_SIZES : IMAGE_SIZES.filter((s) => s.platform === filter);

  return (
    <div className="space-y-4">
      <Field label="Filter by platform">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All platforms ({IMAGE_SIZES.length})</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((s) => (
          <div key={`${s.platform}-${s.name}`} className="rounded-xl border border-border bg-surface-2 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted">{s.platform}</p>
                <p className="text-sm font-medium">{s.name}</p>
              </div>
              <span className="shrink-0 font-mono text-sm text-brand">{s.w} × {s.h}</span>
            </div>
            {(s.ratio || s.notes) && <p className="mt-1 text-xs text-muted">{[s.ratio && `Ratio ${s.ratio}`, s.notes].filter(Boolean).join(" · ")}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Emoji picker ------------------------------- */
export function EmojiPicker() {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("");
  const [recent, setRecent] = React.useState<string[]>([]);
  const emojis = filterEmojis(q, cat || undefined);

  function pick(e: string) {
    navigator.clipboard.writeText(e);
    setRecent((r) => [e, ...r.filter((x) => x !== e)].slice(0, 24));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: fire, heart, party, travel…" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {EMOJI_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
      </div>
      {recent.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Recently copied</p>
          <div className="flex flex-wrap gap-1">
            {recent.map((e) => (
              <button key={e} type="button" onClick={() => pick(e)} className="grid h-9 w-9 place-items-center rounded-lg text-xl hover:bg-surface-2">{e}</button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-12 md:grid-cols-16">
        {emojis.map((e, i) => (
          <button key={`${e}-${i}`} type="button" onClick={() => pick(e)} className="grid h-10 place-items-center rounded-lg text-2xl transition hover:bg-surface-2" title="Copy">{e}</button>
        ))}
      </div>
      <p className="text-xs text-muted">{emojis.length} emojis · tap to copy</p>
    </div>
  );
}
