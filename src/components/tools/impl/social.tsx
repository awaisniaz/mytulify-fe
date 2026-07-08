"use client";

import * as React from "react";
import { Input, Textarea, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Stat, Notice } from "@/components/tools/shared";

/* --------------------------- WhatsApp link --------------------------------- */
export function WhatsAppLink() {
  const [phone, setPhone] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const clean = phone.replace(/[^0-9]/g, "");
  const link = clean ? `https://wa.me/${clean}${msg ? `?text=${encodeURIComponent(msg)}` : ""}` : "";
  return (
    <div className="space-y-4">
      <Field label="Phone number" hint="With country code, no + or spaces">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="14155552671" />
      </Field>
      <Field label="Pre-filled message (optional)">
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="font-sans" />
      </Field>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all text-sm">{link || "Your wa.me link…"}</code>
        <CopyButton value={link} />
      </div>
      {link && (
        <a href={link} target="_blank" rel="noreferrer">
          <Button variant="secondary">Open chat ↗</Button>
        </a>
      )}
    </div>
  );
}

/* --------------------------- Hashtag counter ------------------------------- */
export function HashtagCounter() {
  const [text, setText] = React.useState("");
  const tags = text.match(/#[\w]+/g) || [];
  const unique = new Set(tags.map((t) => t.toLowerCase()));
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" placeholder="Paste your caption with #hashtags…" />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Hashtags" value={tags.length} />
        <Stat label="Unique" value={unique.size} />
        <Stat label="Characters" value={text.length} />
      </div>
      {tags.length > 30 && <Notice tone="error">Instagram allows max 30 hashtags per post.</Notice>}
      <div className="flex flex-wrap gap-2">
        {[...unique].map((t) => (
          <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------ Instagram line break ----------------------------- */
export function InstagramLineBreak() {
  const [text, setText] = React.useState("");
  // Insert an invisible braille-blank char on empty lines so IG keeps spacing
  const out = text.split("\n").map((l) => (l.trim() === "" ? "⠀" : l)).join("\n");
  return (
    <div className="space-y-4">
      <Notice tone="info">Write your caption with line breaks. We add invisible characters so the spacing survives on Instagram.</Notice>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-sans" placeholder={"Line one\n\nLine two after a blank line"} />
      <Output value={out} mono={false} rows={6} />
    </div>
  );
}

/* --------------------------- YouTube thumbnail ----------------------------- */
function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}
export function YouTubeThumbnail() {
  const [url, setUrl] = React.useState("");
  const id = ytId(url);
  const sizes = id
    ? [
        ["Max (1280×720)", `https://img.youtube.com/vi/${id}/maxresdefault.jpg`],
        ["High (480×360)", `https://img.youtube.com/vi/${id}/hqdefault.jpg`],
        ["Medium (320×180)", `https://img.youtube.com/vi/${id}/mqdefault.jpg`],
        ["Standard (640×480)", `https://img.youtube.com/vi/${id}/sddefault.jpg`],
      ]
    : [];
  return (
    <div className="space-y-4">
      <Field label="YouTube video URL or ID">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" />
      </Field>
      {url && !id && <Notice tone="error">Could not detect a valid YouTube video ID.</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        {sizes.map(([label, src]) => (
          <div key={label} className="overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={label} className="w-full" />
            <div className="flex items-center justify-between gap-2 bg-surface-2 px-3 py-2 text-sm">
              <span>{label}</span>
              <a href={src} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">Open ↗</Button>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Image size reference -------------------------- */
const SIZES: [string, string][][] = [
  [["Instagram Post (Square)", "1080 × 1080"], ["Instagram Portrait", "1080 × 1350"], ["Instagram Story/Reel", "1080 × 1920"]],
  [["Facebook Post", "1200 × 630"], ["Facebook Cover", "851 × 315"], ["Facebook Story", "1080 × 1920"]],
  [["X / Twitter Post", "1600 × 900"], ["X Header", "1500 × 500"], ["YouTube Thumbnail", "1280 × 720"]],
  [["YouTube Channel Art", "2560 × 1440"], ["LinkedIn Post", "1200 × 627"], ["TikTok Video", "1080 × 1920"]],
];
export function SocialImageSizes() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SIZES.flat().map(([name, dim]) => (
        <div key={name} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
          <span className="text-sm">{name}</span>
          <span className="font-mono text-sm text-brand">{dim}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Emoji picker ------------------------------- */
const EMOJI = "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥳 🤩 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🔥 ⭐ 🌟 ✨ 💥 💫 💯 ✅ ❌ ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 👍 👎 👏 🙌 🤝 🙏 💪 👀 🎉 🎊 🎁 🚀 ⚡ 🌈 ☀️ 🌙".split(" ");
export function EmojiPicker() {
  const [q, setQ] = React.useState("");
  return (
    <div className="space-y-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Click any emoji to copy it" />
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
        {EMOJI.map((e, i) => (
          <button
            key={i}
            onClick={() => navigator.clipboard.writeText(e)}
            className="grid h-10 place-items-center rounded-lg text-2xl transition hover:bg-surface-2"
            title="Copy"
          >
            {e}
          </button>
        ))}
      </div>
      <Notice tone="info">Tap an emoji to copy it to your clipboard.</Notice>
    </div>
  );
}
