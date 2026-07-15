"use client";

import * as React from "react";
import { toPng } from "html-to-image";
import { Input, Textarea, Button } from "@/components/ui/primitives";
import { Field, Notice, Output, CopyButton } from "@/components/tools/shared";
import { download } from "@/lib/utils";

function ExportCard({ children, name }: { children: React.ReactNode; name: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-3">
      <div className="flex justify-center rounded-2xl border border-border bg-surface-2 p-6">
        <div ref={ref}>{children}</div>
      </div>
      <Button onClick={async () => { if (ref.current) download(await (await fetch(await toPng(ref.current, { pixelRatio: 2 }))).blob(), `${name}.png`); }}>
        Download as PNG
      </Button>
    </div>
  );
}

/* ------------------------------ Fake tweet --------------------------------- */
export function FakeTweet() {
  const [name, setName] = React.useState("Jane Doe");
  const [handle, setHandle] = React.useState("janedoe");
  const [text, setText] = React.useState("Just shipped my new project 🚀 built entirely with free online tools!");
  const [likes, setLikes] = React.useState("2.4K");
  const [retweets, setRt] = React.useState("531");
  const [verified, setVerified] = React.useState(true);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="@handle"><Input value={handle} onChange={(e) => setHandle(e.target.value)} /></Field>
        <Field label="Tweet text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="font-sans" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Likes"><Input value={likes} onChange={(e) => setLikes(e.target.value)} /></Field>
          <Field label="Retweets"><Input value={retweets} onChange={(e) => setRt(e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Verified badge</label>
      </div>
      <ExportCard name="tweet">
        <div className="w-80 rounded-2xl border border-gray-200 bg-white p-4 text-left text-black">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 text-lg font-bold text-white">{name[0]?.toUpperCase()}</div>
            <div>
              <div className="flex items-center gap-1 font-bold">{name}{verified && <span className="text-[#1d9bf0]">✔</span>}</div>
              <div className="text-sm text-gray-500">@{handle}</div>
            </div>
          </div>
          <p className="mt-3 text-[15px] leading-snug">{text}</p>
          <div className="mt-3 text-sm text-gray-500">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date().toLocaleDateString()}</div>
          <div className="mt-3 flex gap-5 border-t border-gray-100 pt-3 text-sm text-gray-600">
            <span>💬 {Math.round(parseInt(retweets) / 4) || 12}</span><span>🔁 {retweets}</span><span>❤️ {likes}</span>
          </div>
        </div>
      </ExportCard>
    </div>
  );
}

/* --------------------------- Fake Instagram post --------------------------- */
export function FakeInstagram() {
  const [name, setName] = React.useState("janedoe");
  const [caption, setCaption] = React.useState("living my best life ✨");
  const [likes, setLikes] = React.useState("12,403");
  const [img, setImg] = React.useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Username"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Caption"><Input value={caption} onChange={(e) => setCaption(e.target.value)} /></Field>
        <Field label="Likes"><Input value={likes} onChange={(e) => setLikes(e.target.value)} /></Field>
        <Field label="Photo">
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setImg(r.result as string); r.readAsDataURL(f); } }} className="text-sm" />
        </Field>
      </div>
      <ExportCard name="instagram-post">
        <div className="w-80 overflow-hidden rounded-xl border border-gray-200 bg-white text-left text-black">
          <div className="flex items-center gap-2 p-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 text-xs font-bold text-white">{name[0]?.toUpperCase()}</div>
            <span className="text-sm font-semibold">{name}</span>
          </div>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-80 w-80 object-cover" />
          ) : (
            <div className="grid h-80 w-80 place-items-center bg-gradient-to-br from-indigo-300 to-pink-300 text-white">Upload a photo</div>
          )}
          <div className="p-3 text-sm">
            <div className="mb-1 text-lg">❤️ 💬 ✈️</div>
            <div className="font-semibold">{likes} likes</div>
            <div><span className="font-semibold">{name}</span> {caption}</div>
          </div>
        </div>
      </ExportCard>
    </div>
  );
}

/* --------------------------- Fake Facebook post ---------------------------- */
export function FakeFacebook() {
  const [name, setName] = React.useState("Jane Doe");
  const [text, setText] = React.useState("Had the best day ever! 🎉 Thanks everyone for the birthday wishes ❤️");
  const [likes, setLikes] = React.useState("1.2K");
  const [comments, setComments] = React.useState("348");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Post text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="font-sans" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Likes"><Input value={likes} onChange={(e) => setLikes(e.target.value)} /></Field>
          <Field label="Comments"><Input value={comments} onChange={(e) => setComments(e.target.value)} /></Field>
        </div>
      </div>
      <ExportCard name="facebook-post">
        <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 text-left text-black">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1877f2] font-bold text-white">{name[0]?.toUpperCase()}</div>
            <div><div className="font-semibold">{name}</div><div className="text-xs text-gray-500">2h · 🌎</div></div>
          </div>
          <p className="mt-3 text-[15px]">{text}</p>
          <div className="mt-3 flex justify-between border-y border-gray-100 py-1.5 text-xs text-gray-500"><span>👍❤️ {likes}</span><span>{comments} comments</span></div>
          <div className="flex justify-around pt-1 text-sm font-medium text-gray-600"><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
        </div>
      </ExportCard>
    </div>
  );
}

/* --------------------------- Fake Instagram DM ----------------------------- */
export function FakeInstagramDm() {
  const [name, setName] = React.useState("janedoe");
  const [msgs, setMsgs] = React.useState("hey! did you see the new tools site?\nyeah it's amazing 🔥\nright?? so many free tools");
  const lines = msgs.split("\n");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Username"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Messages (alternating, one per line)"><Textarea value={msgs} onChange={(e) => setMsgs(e.target.value)} rows={5} className="font-sans" /></Field>
      </div>
      <ExportCard name="instagram-dm">
        <div className="w-80 overflow-hidden rounded-xl border border-gray-200 bg-white text-left text-black">
          <div className="flex items-center gap-2 border-b border-gray-100 p-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 text-xs font-bold text-white">{name[0]?.toUpperCase()}</div>
            <span className="text-sm font-semibold">{name}</span>
          </div>
          <div className="space-y-2 p-3">
            {lines.map((m, i) => (
              <div key={i} className={i % 2 ? "flex justify-end" : "flex justify-start"}>
                <span className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${i % 2 ? "bg-[#3797f0] text-white" : "bg-gray-100 text-black"}`}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </ExportCard>
    </div>
  );
}

/* ----------------------------- Bio generator ------------------------------- */
export function BioGenerator({ platform }: { platform: string }) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [interest, setInterest] = React.useState("");
  const emojis = ["✨", "🌸", "💫", "🚀", "📍", "💼", "🎯", "☕"];
  const e = (i: number) => emojis[i % emojis.length];
  const bios = [
    `${e(0)} ${name || "Your name"}\n${e(1)} ${role || "What you do"}\n${e(2)} ${interest || "Your passion"}`,
    `${role || "Creator"} ${e(3)} | ${interest || "dreamer"} ${e(4)}\n${name || ""} ${e(5)}`,
    `${name || "Name"} ${e(6)}\n${role || "role"} • ${interest || "interest"}\nlink below ${e(7)}`,
  ];
  return (
    <div className="space-y-4">
      <Notice tone="info">Build a {platform} bio with line breaks and emojis.</Notice>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name"><Input value={name} onChange={(ev) => setName(ev.target.value)} /></Field>
        <Field label="What you do"><Input value={role} onChange={(ev) => setRole(ev.target.value)} /></Field>
        <Field label="Interest"><Input value={interest} onChange={(ev) => setInterest(ev.target.value)} /></Field>
      </div>
      {bios.map((b, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap font-sans text-sm">{b}</pre>
          <CopyButton value={b} label="" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Caption generator --------------------------- */
export function CaptionGenerator() {
  const [topic, setTopic] = React.useState("travel");
  const templates = [
    (t: string) => `Chasing ${t} and good vibes ✨`,
    (t: string) => `${t.charAt(0).toUpperCase() + t.slice(1)} mode: ON 🔥`,
    (t: string) => `Making memories, one ${t} at a time 📸`,
    (t: string) => `Life is better with a little ${t} 💫`,
    (t: string) => `Currently obsessed with ${t} 🤍`,
    (t: string) => `${t} therapy >>> 🌿`,
  ];
  return (
    <div className="space-y-4">
      <Field label="Topic / keyword"><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></Field>
      {templates.map((fn, i) => (
        <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <span className="min-w-0 flex-1 text-sm">{fn(topic || "life")}</span>
          <CopyButton value={fn(topic || "life")} label="" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Hashtag generator --------------------------- */
export function HashtagGenerator({ platform }: { platform: string }) {
  const [kw, setKw] = React.useState("photography");
  const generic = ["love", "instagood", "photooftheday", "fashion", "beautiful", "happy", "cute", "art", "follow", "picoftheday", "viral", "trending", "explore", "reels", "fyp"];
  const words = kw.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const tags = [
    ...words.map((w) => "#" + w),
    ...words.flatMap((w) => [`#${w}lover`, `#${w}gram`, `#${w}daily`, `#${w}life`]),
    ...generic.slice(0, 12).map((g) => "#" + g),
  ];
  const uniq = [...new Set(tags)].slice(0, 30);
  return (
    <div className="space-y-4">
      <Notice tone="info">Generate up to 30 {platform} hashtags from your keywords.</Notice>
      <Field label="Keywords (comma separated)"><Input value={kw} onChange={(e) => setKw(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        {uniq.map((t) => <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">{t}</span>)}
      </div>
      <Output value={uniq.join(" ")} rows={3} mono={false} />
    </div>
  );
}

/* ----------------------------- Social preview ------------------------------ */
export function SocialPreviewTester() {
  const [d, setD] = React.useState({ title: "Your shared link title", desc: "This is the description that will appear under your link when shared on social media.", img: "", url: "example.com" });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field label="URL / domain"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} /></Field>
        <Field label="Image URL"><Input value={d.img} onChange={(e) => setD({ ...d, img: e.target.value })} /></Field>
      </div>
      <Field label="Description"><Textarea value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} rows={2} className="font-sans" /></Field>
      <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid h-48 place-items-center bg-surface-2 text-muted">
          {d.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.img} alt="" className="h-full w-full object-cover" />
          ) : "Preview image"}
        </div>
        <div className="p-3">
          <div className="text-xs uppercase text-muted">{d.url}</div>
          <div className="font-semibold">{d.title}</div>
          <div className="line-clamp-2 text-sm text-muted">{d.desc}</div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Twitter bio (text gen) ------------------------ */
export const TwitterBio = () => <BioGenerator platform="Twitter / X" />;
export const InstagramBio = () => <BioGenerator platform="Instagram" />;
