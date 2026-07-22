"use client";

import * as React from "react";
import { toPng } from "html-to-image";
import { Input, Textarea, Button, Select } from "@/components/ui/primitives";
import { Field, Notice, Output, CopyButton, FileDrop, useImageUpload } from "@/components/tools/shared";
import { download } from "@/lib/utils";
import { generateHashtags, PLATFORM_LIMITS } from "@/lib/social-tools";
import { STYLES } from "@/components/tools/impl/text-styler";

function ExportCard({ children, name, scale = 2 }: { children: React.ReactNode; name: string; scale?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-3">
      <div className="flex justify-center overflow-auto rounded-2xl border border-border bg-surface-2 p-4 sm:p-6">
        <div ref={ref}>{children}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={async () => {
          if (!ref.current) return;
          const dataUrl = await toPng(ref.current, { pixelRatio: scale });
          download(await (await fetch(dataUrl)).blob(), `${name}.png`);
        }}>Download PNG</Button>
        <Button variant="secondary" onClick={async () => {
          if (!ref.current) return;
          const dataUrl = await toPng(ref.current, { pixelRatio: 1 });
          download(await (await fetch(dataUrl)).blob(), `${name}-1x.png`);
        }}>PNG (1×)</Button>
      </div>
    </div>
  );
}

function Avatar({ src, name, size = 48 }: { src?: string; name: string; size?: number }) {
  if (src) return <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div className="grid place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name[0]?.toUpperCase() || "?"}
    </div>
  );
}

/* ------------------------------ Fake tweet --------------------------------- */
export function FakeTweet() {
  const avatar = useImageUpload();
  const [name, setName] = React.useState("Jane Doe");
  const [handle, setHandle] = React.useState("janedoe");
  const [text, setText] = React.useState("Just shipped my new project 🚀 built entirely with free online tools!");
  const [likes, setLikes] = React.useState("2.4K");
  const [retweets, setRt] = React.useState("531");
  const [views, setViews] = React.useState("48.2K");
  const [replies, setReplies] = React.useState("89");
  const [bookmarks, setBookmarks] = React.useState("120");
  const [verified, setVerified] = React.useState(true);
  const [goldVerified, setGoldVerified] = React.useState(false);
  const [dark, setDark] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState("");
  const [showMedia, setShowMedia] = React.useState(false);
  const media = useImageUpload();
  const ts = timestamp || `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const bg = dark ? "bg-black text-white border-zinc-800" : "bg-white text-black border-gray-200";
  const muted = dark ? "text-zinc-500" : "text-gray-500";
  const border = dark ? "border-zinc-800" : "border-gray-100";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Display name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="@handle"><Input value={handle} onChange={(e) => setHandle(e.target.value)} /></Field>
        <Field label="Profile photo"><FileDrop accept="image/*" onFiles={avatar.onFiles} label="Upload avatar" /></Field>
        <Field label="Tweet text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="font-sans" /></Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Replies"><Input value={replies} onChange={(e) => setReplies(e.target.value)} /></Field>
          <Field label="Retweets"><Input value={retweets} onChange={(e) => setRt(e.target.value)} /></Field>
          <Field label="Likes"><Input value={likes} onChange={(e) => setLikes(e.target.value)} /></Field>
          <Field label="Views"><Input value={views} onChange={(e) => setViews(e.target.value)} /></Field>
          <Field label="Bookmarks"><Input value={bookmarks} onChange={(e) => setBookmarks(e.target.value)} /></Field>
        </div>
        <Field label="Timestamp (optional)"><Input value={timestamp} onChange={(e) => setTimestamp(e.target.value)} placeholder="2:30 PM · Mar 15, 2026" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Blue verified</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={goldVerified} onChange={(e) => setGoldVerified(e.target.checked)} /> Gold verified (org)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showMedia} onChange={(e) => setShowMedia(e.target.checked)} /> Attach media image</label>
        {showMedia && <FileDrop accept="image/*" onFiles={media.onFiles} label="Upload tweet media" />}
      </div>
      <ExportCard name="tweet">
        <div className={`w-[360px] rounded-2xl border p-4 text-left ${bg}`}>
          <div className="flex items-start gap-3">
            <Avatar src={avatar.src} name={name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1 font-bold">
                {name}
                {verified && <span className="text-[#1d9bf0]">✔</span>}
                {goldVerified && <span className="text-amber-500">✔</span>}
                <span className={`font-normal ${muted}`}>@{handle}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-snug">{text}</p>
              {showMedia && media.src && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.src} alt="" className="max-h-64 w-full object-cover" />
                </div>
              )}
              <p className={`mt-3 text-sm ${muted}`}>{ts}</p>
              <div className={`mt-3 flex flex-wrap gap-4 border-t pt-3 text-sm ${border} ${muted}`}>
                <span>{replies} Replies</span><span>{retweets} Reposts</span><span>{likes} Likes</span><span>{views} Views</span><span>{bookmarks} Bookmarks</span>
              </div>
              <div className={`mt-2 flex justify-around border-t pt-2 text-sm ${border} ${muted}`}>
                <span>💬</span><span>🔁</span><span>❤️</span><span>📊</span><span>🔖</span><span>↗</span>
              </div>
            </div>
          </div>
        </div>
      </ExportCard>
    </div>
  );
}

/* ------------------------------ Tweet to image ----------------------------- */
const TWEET_THEMES = {
  light: { bg: "#ffffff", text: "#0f1419", accent: "#1d9bf0", card: "#ffffff", border: "#eff3f4" },
  dark: { bg: "#000000", text: "#e7e9ea", accent: "#1d9bf0", card: "#16181c", border: "#2f3336" },
  gradient: { bg: "linear-gradient(135deg,#667eea,#764ba2)", text: "#ffffff", accent: "#ffd700", card: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.2)" },
  minimal: { bg: "#f8fafc", text: "#1e293b", accent: "#6366f1", card: "#ffffff", border: "#e2e8f0" },
  sunset: { bg: "linear-gradient(135deg,#f093fb,#f5576c)", text: "#ffffff", accent: "#fff", card: "rgba(0,0,0,0.15)", border: "rgba(255,255,255,0.25)" },
};

export function TweetToImage() {
  const [text, setText] = React.useState("The best tools are the ones that just work.");
  const [name, setName] = React.useState("@you");
  const [theme, setTheme] = React.useState<keyof typeof TWEET_THEMES>("gradient");
  const [aspect, setAspect] = React.useState<"square" | "story" | "wide">("square");
  const t = TWEET_THEMES[theme];
  const dims = { square: "400×400", story: "360×640", wide: "560×315" }[aspect];
  const sizeClass = aspect === "story" ? "w-[360px] h-[640px]" : aspect === "wide" ? "w-[560px] h-[315px]" : "w-[400px] min-h-[400px]";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Quote / tweet text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" /></Field>
        <Field label="Attribution"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="@username or Your Name" /></Field>
        <Field label="Theme">
          <Select value={theme} onChange={(e) => setTheme(e.target.value as keyof typeof TWEET_THEMES)}>
            {Object.keys(TWEET_THEMES).map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </Field>
        <Field label="Aspect ratio">
          <Select value={aspect} onChange={(e) => setAspect(e.target.value as typeof aspect)}>
            <option value="square">Square {dims}</option>
            <option value="story">Story / Reel 9:16</option>
            <option value="wide">Wide 16:9</option>
          </Select>
        </Field>
      </div>
      <ExportCard name="tweet-image" scale={3}>
        <div className={`${sizeClass} flex flex-col justify-center rounded-3xl p-8 shadow-xl`} style={{ background: t.bg, color: t.text }}>
          <div className="text-4xl leading-none opacity-30">"</div>
          <p className="my-4 whitespace-pre-wrap text-xl font-medium leading-relaxed sm:text-2xl">{text}</p>
          <div className="mt-auto flex items-center gap-2 text-sm font-semibold" style={{ color: t.accent }}>{name}</div>
        </div>
      </ExportCard>
    </div>
  );
}

/* --------------------------- Fake Instagram post --------------------------- */
export function FakeInstagram() {
  const avatar = useImageUpload();
  const photo = useImageUpload();
  const [name, setName] = React.useState("janedoe");
  const [caption, setCaption] = React.useState("living my best life ✨ #travel #photography");
  const [likes, setLikes] = React.useState("12,403");
  const [comments, setComments] = React.useState("248");
  const [location, setLocation] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [dark, setDark] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState("2 HOURS AGO");

  const bg = dark ? "bg-black text-white border-zinc-800" : "bg-white text-black border-gray-200";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Username"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Profile photo"><FileDrop accept="image/*" onFiles={avatar.onFiles} label="Upload profile pic" /></Field>
        <Field label="Caption"><Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="font-sans" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Likes"><Input value={likes} onChange={(e) => setLikes(e.target.value)} /></Field>
          <Field label="Comments"><Input value={comments} onChange={(e) => setComments(e.target.value)} /></Field>
        </div>
        <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Paris, France" /></Field>
        <Field label="Timestamp"><Input value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></Field>
        <Field label="Post photo"><FileDrop accept="image/*" onFiles={photo.onFiles} label="Upload post image" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Verified</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode</label>
      </div>
      <ExportCard name="instagram-post">
        <div className={`w-[360px] overflow-hidden rounded-xl border text-left ${bg}`}>
          <div className="flex items-center gap-2 p-3">
            <Avatar src={avatar.src} name={name} size={32} />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold">{name}{verified && " ✓"}</span>
              {location && <p className="truncate text-xs opacity-60">{location}</p>}
            </div>
            <span className="text-lg">⋯</span>
          </div>
          {photo.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.src} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="grid aspect-square w-full place-items-center bg-gradient-to-br from-indigo-300 to-pink-300 text-white">Upload a photo</div>
          )}
          <div className="p-3 text-sm">
            <div className="mb-2 flex gap-4 text-xl"><span>❤️</span><span>💬</span><span>✈️</span><span className="ml-auto">🔖</span></div>
            <div className="font-semibold">{likes} likes</div>
            <div className="mt-1"><span className="font-semibold">{name}</span> {caption}</div>
            <button type="button" className="mt-1 text-xs opacity-50">View all {comments} comments</button>
            <p className="mt-1 text-[10px] uppercase tracking-wide opacity-40">{timestamp}</p>
          </div>
        </div>
      </ExportCard>
    </div>
  );
}

/* --------------------------- Fake Facebook post ---------------------------- */
const FB_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export function FakeFacebook() {
  const avatar = useImageUpload();
  const photo = useImageUpload();
  const [name, setName] = React.useState("Jane Doe");
  const [text, setText] = React.useState("Had the best day ever! 🎉 Thanks everyone for the birthday wishes ❤️");
  const [likes, setLikes] = React.useState("1.2K");
  const [comments, setComments] = React.useState("348");
  const [shares, setShares] = React.useState("42");
  const [time, setTime] = React.useState("2h");
  const [audience, setAudience] = React.useState("🌎");
  const [reactions, setReactions] = React.useState("👍❤️😂");
  const [showPhoto, setShowPhoto] = React.useState(false);
  const [dark, setDark] = React.useState(false);
  const bg = dark ? "bg-[#242526] text-[#e4e6eb] border-zinc-700" : "bg-white text-black border-gray-200";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Profile photo"><FileDrop accept="image/*" onFiles={avatar.onFiles} label="Upload avatar" /></Field>
        <Field label="Post text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="font-sans" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Likes"><Input value={likes} onChange={(e) => setLikes(e.target.value)} /></Field>
          <Field label="Comments"><Input value={comments} onChange={(e) => setComments(e.target.value)} /></Field>
          <Field label="Shares"><Input value={shares} onChange={(e) => setShares(e.target.value)} /></Field>
        </div>
        <Field label="Time ago"><Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="2h" /></Field>
        <Field label="Audience icon"><Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="🌎 or 👥" /></Field>
        <Field label="Reaction emojis shown">
          <Select value={reactions} onChange={(e) => setReactions(e.target.value)}>
            {FB_REACTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            <option value="👍❤️">👍 ❤️</option>
            <option value="👍❤️😂">👍 ❤️ 😂</option>
            <option value="👍❤️😂😮">👍 ❤️ 😂 😮</option>
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} /> Attach photo</label>
        {showPhoto && <FileDrop accept="image/*" onFiles={photo.onFiles} label="Upload post photo" />}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode</label>
      </div>
      <ExportCard name="facebook-post">
        <div className={`w-[360px] rounded-lg border p-4 text-left ${bg}`}>
          <div className="flex items-center gap-2">
            {avatar.src ? <img src={avatar.src} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1877f2] font-bold text-white">{name[0]}</div>}
            <div><div className="font-semibold">{name}</div><div className="text-xs opacity-60">{time} · {audience}</div></div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-[15px]">{text}</p>
          {showPhoto && photo.src && <img src={photo.src} alt="" className="mt-3 w-full rounded-lg object-cover" />}
          <div className="mt-3 flex justify-between border-y py-1.5 text-xs opacity-60"><span>{reactions} {likes}</span><span>{comments} comments · {shares} shares</span></div>
          <div className="flex justify-around pt-1 text-sm font-medium opacity-70"><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
        </div>
      </ExportCard>
    </div>
  );
}

/* --------------------------- Fake Instagram DM ----------------------------- */
export function FakeInstagramDm() {
  const avatar = useImageUpload();
  const [name, setName] = React.useState("janedoe");
  const [msgs, setMsgs] = React.useState("hey! did you see the new tools site?\nyeah it's amazing 🔥\nright?? so many free tools");
  const [showSeen, setShowSeen] = React.useState(true);
  const [showActive, setShowActive] = React.useState(true);
  const [dark, setDark] = React.useState(false);
  const lines = msgs.split("\n").filter((l) => l.length >= 0);
  const bg = dark ? "bg-black text-white border-zinc-800" : "bg-white text-black border-gray-200";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <Field label="Username"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Profile photo"><FileDrop accept="image/*" onFiles={avatar.onFiles} label="Upload avatar" /></Field>
        <Field label="Messages (one per line, alternating sent/received)"><Textarea value={msgs} onChange={(e) => setMsgs(e.target.value)} rows={6} className="font-sans" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSeen} onChange={(e) => setShowSeen(e.target.checked)} /> Show &quot;Seen&quot; at bottom</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showActive} onChange={(e) => setShowActive(e.target.checked)} /> Active now indicator</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark mode</label>
      </div>
      <ExportCard name="instagram-dm">
        <div className={`w-[360px] overflow-hidden rounded-xl border text-left ${bg}`}>
          <div className="flex items-center gap-2 border-b border-gray-100 p-3 dark:border-zinc-800">
            <Avatar src={avatar.src} name={name} size={32} />
            <div><span className="text-sm font-semibold">{name}</span>{showActive && <p className="text-xs text-emerald-500">Active now</p>}</div>
          </div>
          <div className="space-y-2 p-3">
            {lines.map((m, i) => (
              <div key={i} className={i % 2 ? "flex justify-end" : "flex justify-start"}>
                <span className={`max-w-[80%] rounded-3xl px-4 py-2 text-sm ${i % 2 ? "bg-[#3797f0] text-white" : dark ? "bg-zinc-800" : "bg-gray-100"}`}>{m || "…"}</span>
              </div>
            ))}
            {showSeen && <p className="text-right text-xs opacity-40">Seen</p>}
          </div>
        </div>
      </ExportCard>
    </div>
  );
}

/* ----------------------------- Bio generator ------------------------------- */
const BIO_TONES = ["professional", "creative", "minimal", "funny"] as const;
const BIO_NICHES = ["creator", "business", "fitness", "travel", "tech", "food", "fashion", "music"];

export function BioGenerator({ platform }: { platform: string }) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [interest, setInterest] = React.useState("");
  const [link, setLink] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [tone, setTone] = React.useState<(typeof BIO_TONES)[number]>("creative");
  const [niche, setNiche] = React.useState("creator");
  const [useFonts, setUseFonts] = React.useState(true);
  const limit = platform.includes("Twitter") || platform.includes("X") ? PLATFORM_LIMITS.bioTwitter.chars : PLATFORM_LIMITS.bioInstagram.chars;
  const emojis = ["✨", "🌸", "💫", "🚀", "📍", "💼", "🎯", "☕", "🔗", "📸"];
  const e = (i: number) => emojis[i % emojis.length];

  const rawBios = React.useMemo(() => {
    const n = name || "Your name";
    const r = role || "What you do";
    const intr = interest || "Your passion";
    const loc = location ? `📍 ${location}` : "";
    const lnk = link ? `🔗 ${link}` : "link below 🔗";
    const templates: Record<string, string[]> = {
      professional: [`${n}\n${r} | ${intr}\n${loc}\n${lnk}`, `${r} helping ${intr} grow\n${n} · ${loc}`, `${n}\n${r}\nDM for collabs 💼`],
      creative: [`${e(0)} ${n}\n${e(1)} ${r}\n${e(2)} ${intr}\n${loc} ${e(3)}`, `${r} ${e(4)} | ${intr} ${e(5)}\n${n} ${e(6)}`, `${n} ${e(7)}\n${r} • ${intr}\n${lnk}`],
      minimal: [`${n}\n${r}\n${lnk}`, `${r}\n${n}`, `${n} · ${r}`],
      funny: [`probably ${intr} ${e(0)}\n${r} (allegedly)\n${n}`, `${n} | ${r} | professional ${intr} enthusiast`, `i do ${r} and ${intr} ${e(1)}\n${n}`],
    };
    const nicheLine = niche !== "creator" ? `\n#${niche}life` : "";
    return (templates[tone] ?? templates.creative).map((b) => b + nicheLine);
  }, [name, role, interest, link, location, tone, niche]);

  const bios = useFonts ? rawBios.map((b, i) => {
    const font = ["Script", "Bold Sans", "Italic", "Small Caps"][i % 4];
    const firstLine = b.split("\n")[0] ?? "";
    const styled = STYLES[font]?.(firstLine) ?? firstLine;
    return b.replace(firstLine, styled);
  }) : rawBios;

  return (
    <div className="space-y-4">
      <Notice tone="info">Build a {platform} bio — max {limit} characters recommended.</Notice>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name"><Input value={name} onChange={(ev) => setName(ev.target.value)} /></Field>
        <Field label="What you do"><Input value={role} onChange={(ev) => setRole(ev.target.value)} /></Field>
        <Field label="Interest / niche"><Input value={interest} onChange={(ev) => setInterest(ev.target.value)} /></Field>
        <Field label="Link / CTA"><Input value={link} onChange={(ev) => setLink(ev.target.value)} placeholder="mytulify.com/tools" /></Field>
        <Field label="Location"><Input value={location} onChange={(ev) => setLocation(ev.target.value)} /></Field>
        <Field label="Tone">
          <Select value={tone} onChange={(ev) => setTone(ev.target.value as typeof tone)}>
            {BIO_TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Niche">
          <Select value={niche} onChange={(ev) => setNiche(ev.target.value)}>
            {BIO_NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useFonts} onChange={(ev) => setUseFonts(ev.target.checked)} /> Unicode font on first line</label>
      {bios.map((b, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <div className="min-w-0 flex-1">
            <pre className="whitespace-pre-wrap font-sans text-sm">{b}</pre>
            <p className={`mt-1 text-xs ${b.length > limit ? "text-rose-500" : "text-muted"}`}>{b.length}/{limit} chars</p>
          </div>
          <CopyButton value={b} label="" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Caption generator --------------------------- */
const CAPTION_TONES = ["casual", "professional", "funny", "inspirational", "sales"] as const;

export function CaptionGenerator() {
  const [topic, setTopic] = React.useState("travel");
  const [tone, setTone] = React.useState<(typeof CAPTION_TONES)[number]>("casual");
  const [includeHashtags, setIncludeHashtags] = React.useState(true);
  const [includeCta, setIncludeCta] = React.useState(true);
  const [hashtagCount, setHashtagCount] = React.useState(15);
  const t = topic || "life";
  const tags = generateHashtags(t, "Instagram", { max: hashtagCount }).slice(0, hashtagCount);

  const templates: Record<string, ((x: string) => string)[]> = {
    casual: [(x) => `Chasing ${x} and good vibes ✨`, (x) => `${x.charAt(0).toUpperCase() + x.slice(1)} mode: ON 🔥`, (x) => `Currently obsessed with ${x} 🤍`],
    professional: [(x) => `Insights on ${x} — swipe for tips →`, (x) => `How we approach ${x} differently.`, (x) => `${x.charAt(0).toUpperCase() + x.slice(1)} lessons learned this week.`],
    funny: [(x) => `me + ${x} = chaos 😂`, (x) => `plot twist: it's all about ${x}`, (x) => `${x}? never heard of her (jk it's all I talk about)`],
    inspirational: [(x) => `Every ${x} journey starts with one step 🌱`, (x) => `Trust the process — ${x} edition`, (x) => `Small steps in ${x}, big dreams ✨`],
    sales: [(x) => `Ready to level up your ${x}? Link in bio 👆`, (x) => `Limited offer — ${x} bundle inside 🛒`, (x) => `DM "${x}" for details 📩`],
  };

  const captions = (templates[tone] ?? templates.casual).map((fn) => {
    let c = fn(t);
    if (includeCta) c += "\n\n👇 Save this for later · Share with a friend";
    if (includeHashtags) c += `\n\n${tags.join(" ")}`;
    return c;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Topic / keyword"><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></Field>
        <Field label="Tone">
          <Select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
            {CAPTION_TONES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </Field>
        <Field label="Hashtag count"><Input type="number" min={0} max={30} value={hashtagCount} onChange={(e) => setHashtagCount(Number(e.target.value))} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} /> Include hashtags</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeCta} onChange={(e) => setIncludeCta(e.target.checked)} /> Include CTA line</label>
      {captions.map((c, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <pre className="min-w-0 flex-1 whitespace-pre-wrap font-sans text-sm">{c}</pre>
          <CopyButton value={c} label="" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Hashtag generator --------------------------- */
export function HashtagGenerator({ platform }: { platform: "Instagram" | "TikTok" }) {
  const [kw, setKw] = React.useState("photography");
  const [max, setMax] = React.useState(platform === "TikTok" ? 30 : 30);
  const [popular, setPopular] = React.useState(true);
  const [niche, setNiche] = React.useState(true);
  const [branded, setBranded] = React.useState(false);
  const [grouped, setGrouped] = React.useState(true);
  const maxLimit = platform === "TikTok" ? 100 : 30;

  const all = generateHashtags(kw, platform, { max: maxLimit, includePopular: popular, includeNiche: niche, includeBranded: branded });
  const uniq = all.slice(0, Math.min(max, maxLimit));
  const keywordTags = uniq.filter((t) => kw.toLowerCase().split(/[\s,]+/).some((w) => t.includes(w)));
  const rest = uniq.filter((t) => !keywordTags.includes(t));

  return (
    <div className="space-y-4">
      <Notice tone="info">Generate up to {maxLimit} {platform} hashtags — popular, niche & keyword-based.</Notice>
      <Field label="Keywords (comma separated)"><Input value={kw} onChange={(e) => setKw(e.target.value)} /></Field>
      <Field label="Max hashtags"><Input type="number" min={1} max={maxLimit} value={max} onChange={(e) => setMax(Number(e.target.value))} /></Field>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} /> Popular / viral</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={niche} onChange={(e) => setNiche(e.target.checked)} /> Niche community</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={branded} onChange={(e) => setBranded(e.target.checked)} /> Branded (#team…)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} /> Group output</label>
      </div>
      {grouped ? (
        <>
          {keywordTags.length > 0 && (<><p className="text-xs font-medium text-muted">Keyword tags</p><div className="flex flex-wrap gap-2">{keywordTags.map((t) => <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">{t}</span>)}</div></>)}
          {rest.length > 0 && (<><p className="text-xs font-medium text-muted">Suggested tags</p><div className="flex flex-wrap gap-2">{rest.map((t) => <span key={t} className="rounded-full bg-surface-2 px-3 py-1 text-sm">{t}</span>)}</div></>)}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">{uniq.map((t) => <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">{t}</span>)}</div>
      )}
      <Output value={uniq.join(" ")} rows={4} mono={false} filename={`${platform.toLowerCase()}-hashtags.txt`} />
      <Output value={uniq.join("\n")} rows={Math.min(12, uniq.length + 1)} mono={false} filename={`${platform.toLowerCase()}-hashtags-lines.txt`} />
    </div>
  );
}

/* ----------------------------- Social preview ------------------------------ */
type PreviewPlatform = "facebook" | "twitter" | "linkedin" | "slack" | "discord";

export function SocialPreviewTester() {
  const [d, setD] = React.useState({ title: "Your shared link title", desc: "This is the description that will appear under your link when shared on social media.", img: "", url: "example.com" });
  const [platform, setPlatform] = React.useState<PreviewPlatform>("facebook");
  const [cardType, setCardType] = React.useState<"summary" | "large">("large");

  const titleMax = platform === "twitter" ? 70 : platform === "linkedin" ? 200 : 100;
  const descMax = platform === "twitter" ? 200 : platform === "linkedin" ? 256 : 300;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Platform preview">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as PreviewPlatform)}>
            <option value="facebook">Facebook</option>
            <option value="twitter">X / Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="slack">Slack</option>
            <option value="discord">Discord</option>
          </Select>
        </Field>
        {(platform === "twitter" || platform === "facebook") && (
          <Field label="Card type">
            <Select value={cardType} onChange={(e) => setCardType(e.target.value as typeof cardType)}>
              <option value="large">Large image (summary_large_image)</option>
              <option value="summary">Small image (summary)</option>
            </Select>
          </Field>
        )}
        <Field label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field label="URL / domain"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} /></Field>
        <Field label="Image URL"><Input value={d.img} onChange={(e) => setD({ ...d, img: e.target.value })} placeholder="https://…" /></Field>
      </div>
      <Field label="Description"><Textarea value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} rows={2} className="font-sans" /></Field>
      <div className="flex gap-4 text-xs text-muted">
        <span className={d.title.length > titleMax ? "text-rose-500" : ""}>Title: {d.title.length}/{titleMax}</span>
        <span className={d.desc.length > descMax ? "text-rose-500" : ""}>Desc: {d.desc.length}/{descMax}</span>
      </div>
      <Notice tone="info">Recommended OG image: 1200×630 (Facebook/LinkedIn) · 1200×675 (Twitter large card)</Notice>

      <div className="mx-auto max-w-lg">
        {platform === "facebook" && (
          <div className="overflow-hidden rounded-lg border border-border bg-[#f0f2f5]">
            <div className={`bg-white ${cardType === "large" ? "" : "flex"}`}>
              {cardType === "large" ? (
                <>
                  <div className="grid h-48 place-items-center bg-gray-200 text-muted">{d.img ? <img src={d.img} alt="" className="h-full w-full object-cover" /> : "1200×630 image"}</div>
                  <div className="border-t bg-[#f0f2f5] p-3"><div className="text-xs uppercase text-muted">{d.url}</div><div className="font-semibold text-gray-900">{d.title}</div><div className="line-clamp-2 text-sm text-muted">{d.desc}</div></div>
                </>
              ) : (
                <>
                  <div className="grid h-24 w-24 shrink-0 place-items-center bg-gray-200 text-xs text-muted">img</div>
                  <div className="p-2"><div className="text-xs uppercase text-muted">{d.url}</div><div className="text-sm font-semibold">{d.title}</div></div>
                </>
              )}
            </div>
          </div>
        )}
        {platform === "twitter" && (
          <div className="overflow-hidden rounded-2xl border border-border bg-white text-black">
            {cardType === "large" && <div className="grid h-52 place-items-center bg-gray-100">{d.img ? <img src={d.img} alt="" className="h-full w-full object-cover" /> : "Image"}</div>}
            <div className="border-t p-3"><div className="text-sm text-muted">{d.url}</div><div className="font-bold">{d.title}</div><div className="line-clamp-2 text-sm text-muted">{d.desc}</div></div>
          </div>
        )}
        {platform === "linkedin" && (
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <div className="grid h-44 place-items-center bg-gray-100">{d.img ? <img src={d.img} alt="" className="h-full w-full object-cover" /> : "Image"}</div>
            <div className="p-3"><div className="font-semibold">{d.title}</div><div className="line-clamp-2 text-sm text-muted">{d.desc}</div><div className="mt-1 text-xs text-muted">{d.url}</div></div>
          </div>
        )}
        {platform === "slack" && (
          <div className="rounded-lg border-l-4 border-[#611f69] bg-white p-3 shadow"><div className="text-xs font-bold text-[#611f69]">{d.url}</div><div className="font-bold">{d.title}</div><div className="text-sm">{d.desc}</div>{d.img && <img src={d.img} alt="" className="mt-2 max-h-32 rounded object-cover" />}</div>
        )}
        {platform === "discord" && (
          <div className="rounded bg-[#2f3136] p-3 text-[#dcddde]"><div className="border-l-4 border-[#5865f2] pl-3"><div className="text-sm font-semibold text-[#00aff4]">{d.title}</div><div className="text-sm">{d.desc}</div><div className="mt-1 text-xs text-muted">{d.url}</div>{d.img && <img src={d.img} alt="" className="mt-2 max-h-40 rounded object-cover" />}</div></div>
        )}
      </div>
      <Output value={`<meta property="og:title" content="${d.title}" />\n<meta property="og:description" content="${d.desc}" />\n<meta property="og:url" content="https://${d.url.replace(/^https?:\/\//, "")}" />\n<meta property="og:image" content="${d.img || "https://example.com/image.jpg"}" />\n<meta name="twitter:card" content="${cardType === "large" ? "summary_large_image" : "summary"}" />`} rows={6} filename="og-tags.html" />
    </div>
  );
}

export const TwitterBio = () => <BioGenerator platform="Twitter / X" />;
export const InstagramBio = () => <BioGenerator platform="Instagram" />;
