/** Shared data & helpers for social media tools (client-side). */

export const PLATFORM_LIMITS = {
  twitter: { label: "X / Twitter", chars: 280, hashtags: 0 },
  twitterPremium: { label: "X Premium", chars: 25000, hashtags: 0 },
  instagram: { label: "Instagram caption", chars: 2200, hashtags: 30 },
  tiktok: { label: "TikTok caption", chars: 4000, hashtags: 100 },
  linkedin: { label: "LinkedIn post", chars: 3000, hashtags: 0 },
  facebook: { label: "Facebook post", chars: 63206, hashtags: 0 },
  threads: { label: "Threads", chars: 500, hashtags: 0 },
  pinterest: { label: "Pinterest description", chars: 500, hashtags: 20 },
  youtube: { label: "YouTube description", chars: 5000, hashtags: 15 },
  sms: { label: "SMS", chars: 160, hashtags: 0 },
  seoTitle: { label: "SEO title", chars: 60, hashtags: 0 },
  seoDesc: { label: "SEO meta description", chars: 160, hashtags: 0 },
  bioInstagram: { label: "Instagram bio", chars: 150, hashtags: 0 },
  bioTwitter: { label: "X bio", chars: 160, hashtags: 0 },
} as const;

/** X/Twitter weighted length: URLs=23, most emoji=2 chars. */
export function twitterWeightedLength(text: string): number {
  let len = 0;
  const urlRe = /https?:\/\/[^\s]+/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRe.exec(text)) !== null) {
    len += [...text.slice(last, m.index)].reduce((n, c) => n + charWeight(c), 0);
    len += 23;
    last = m.index + m[0].length;
  }
  len += [...text.slice(last)].reduce((n, c) => n + charWeight(c), 0);
  return len;
}

function charWeight(ch: string): number {
  const cp = ch.codePointAt(0) ?? 0;
  if (cp > 0xffff) return 2;
  if (cp >= 0x2600 && cp <= 0x27bf) return 2;
  if (cp >= 0x1f300) return 2;
  return 1;
}

export function extractHashtags(text: string): string[] {
  return text.match(/#[\p{L}\p{N}_]+/gu) || [];
}

export const BANNED_IG_TAGS = new Set([
  "#like4like", "#follow4follow", "#f4f", "#l4l", "#tagsforlikes", "#likeforlike",
]);

export const COUNTRY_CODES: { code: string; dial: string; name: string }[] = [
  { code: "US", dial: "1", name: "United States" },
  { code: "GB", dial: "44", name: "United Kingdom" },
  { code: "PK", dial: "92", name: "Pakistan" },
  { code: "IN", dial: "91", name: "India" },
  { code: "DE", dial: "49", name: "Germany" },
  { code: "FR", dial: "33", name: "France" },
  { code: "NL", dial: "31", name: "Netherlands" },
  { code: "AE", dial: "971", name: "UAE" },
  { code: "SA", dial: "966", name: "Saudi Arabia" },
  { code: "CA", dial: "1", name: "Canada" },
  { code: "AU", dial: "61", name: "Australia" },
  { code: "BR", dial: "55", name: "Brazil" },
  { code: "MX", dial: "52", name: "Mexico" },
  { code: "TR", dial: "90", name: "Turkey" },
  { code: "ID", dial: "62", name: "Indonesia" },
  { code: "LV", dial: "371", name: "Latvia" },
];

export type ImageSizeEntry = { platform: string; name: string; w: number; h: number; ratio?: string; notes?: string };

export const IMAGE_SIZES: ImageSizeEntry[] = [
  { platform: "Instagram", name: "Square post", w: 1080, h: 1080, ratio: "1:1" },
  { platform: "Instagram", name: "Portrait post", w: 1080, h: 1350, ratio: "4:5" },
  { platform: "Instagram", name: "Landscape post", w: 1080, h: 566, ratio: "1.91:1" },
  { platform: "Instagram", name: "Story / Reel", w: 1080, h: 1920, ratio: "9:16" },
  { platform: "Instagram", name: "Profile photo", w: 320, h: 320, ratio: "1:1" },
  { platform: "Facebook", name: "Post (landscape)", w: 1200, h: 630, ratio: "1.91:1" },
  { platform: "Facebook", name: "Post (square)", w: 1080, h: 1080, ratio: "1:1" },
  { platform: "Facebook", name: "Cover photo", w: 851, h: 315, ratio: "2.7:1" },
  { platform: "Facebook", name: "Story", w: 1080, h: 1920, ratio: "9:16" },
  { platform: "Facebook", name: "Event cover", w: 1920, h: 1005 },
  { platform: "X / Twitter", name: "Post image", w: 1600, h: 900, ratio: "16:9" },
  { platform: "X / Twitter", name: "Header", w: 1500, h: 500, ratio: "3:1" },
  { platform: "X / Twitter", name: "Profile", w: 400, h: 400, ratio: "1:1" },
  { platform: "LinkedIn", name: "Post", w: 1200, h: 627, ratio: "1.91:1" },
  { platform: "LinkedIn", name: "Cover (personal)", w: 1584, h: 396 },
  { platform: "LinkedIn", name: "Cover (company)", w: 1128, h: 191 },
  { platform: "LinkedIn", name: "Profile", w: 400, h: 400 },
  { platform: "YouTube", name: "Thumbnail", w: 1280, h: 720, ratio: "16:9" },
  { platform: "YouTube", name: "Channel banner", w: 2560, h: 1440, notes: "Safe area 1546×423" },
  { platform: "YouTube", name: "Shorts", w: 1080, h: 1920, ratio: "9:16" },
  { platform: "TikTok", name: "Video", w: 1080, h: 1920, ratio: "9:16" },
  { platform: "TikTok", name: "Profile", w: 200, h: 200 },
  { platform: "Pinterest", name: "Pin (standard)", w: 1000, h: 1500, ratio: "2:3" },
  { platform: "Pinterest", name: "Pin (square)", w: 1000, h: 1000 },
  { platform: "Threads", name: "Post image", w: 1080, h: 1350 },
  { platform: "Snapchat", name: "Story / Ad", w: 1080, h: 1920, ratio: "9:16" },
  { platform: "Discord", name: "Server icon", w: 512, h: 512 },
  { platform: "Discord", name: "Server banner", w: 960, h: 540 },
  { platform: "Twitch", name: "Profile", w: 256, h: 256 },
  { platform: "Twitch", name: "Offline banner", w: 1200, h: 480 },
  { platform: "WhatsApp", name: "Status", w: 1080, h: 1920, ratio: "9:16" },
];

export const EMOJI_CATEGORIES: { id: string; label: string; emojis: string[] }[] = [
  { id: "smileys", label: "Smileys", emojis: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🥲 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱".split(" ") },
  { id: "gestures", label: "Gestures", emojis: "👋 🤚 🖐 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁 👅 👄 🫦".split(" ") },
  { id: "hearts", label: "Hearts & symbols", emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❤️‍🔥 ❤️‍🩹 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉 ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🛗 🈳 🈂️ 🛂 🛃 🛄 🛅 🚹 🚺 🚼 ⚧ 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟".split(" ") },
  { id: "nature", label: "Nature", emojis: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🪲 🪳 🦟 🦗 🕷 🕸 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🦣 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐕‍🦺 🐈 🐈‍⬛ 🪶 🐓 🦃 🦤 🦚 🦜 🦢 🦩 🕊 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿 🦔 🌵 🎄 🌲 🌳 🌴 🪵 🌱 🌿 ☘️ 🍀 🎍 🪴 🎋 🍃 🍂 🍁 🍄 🐚 🪨 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 🌎 🌍 🌏 🪐 💫 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌪 🌈 ☀️ 🌤 ⛅ 🌥 ☁️ 🌦 🌧 ⛈ 🌩 🌨 ❄️ ☃️ ⛄ 🌬 💨 💧 💦 ☔ ☂️ 🌊 🌫".split(" ") },
  { id: "food", label: "Food", emojis: "🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🫘 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🦴 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 🫖 ☕ 🍵 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🍾 🧊 🥄 🍴 🍽 🥣 🥡 🥢 🧂".split(" ") },
  { id: "activities", label: "Activities", emojis: "⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸ 🥌 🎿 ⛷ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖 🏵 🎗 🎫 🎟 🎪 🤹 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🎲 ♟ 🎯 🎳 🎮 🎰 🧩".split(" ") },
  { id: "travel", label: "Travel", emojis: "🚗 🚕 🚙 🚌 🚎 🏎 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🦯 🦽 🦼 🛴 🚲 🛵 🏍 🛺 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩 💺 🛰 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥 🛳 ⛴ 🚢 ⚓ 🪝 ⛽ 🚧 🚦 🚥 🚏 🗺 🗿 🗽 🗼 🏰 🏯 🏟 🎡 🎢 🎠 ⛲ ⛱ 🏖 🏝 🏜 🌋 ⛰ 🏔 🗻 🏕 ⛺ 🛖 🏠 🏡 🏘 🏚 🏗 🏭 🏢 🏬 🏣 🏤 🏥 🏦 🏨 🏪 🏫 🏩 💒 🏛 ⛪ 🕌 🕍 🛕 🕋 ⛩ 🛤 🛣 🗾 🎑 🏞 🌅 🌄 🌠 🎇 🎆 🌇 🌆 🏙 🌃 🌌 🌉 🌁".split(" ") },
  { id: "objects", label: "Objects", emojis: "⌚ 📱 📲 💻 ⌨️ 🖥 🖨 🖱 🖲 🕹 🗜 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽 🎞 📞 ☎️ 📟 📠 📺 📻 🎙 🎚 🎛 🧭 ⏱ ⏲ ⏰ 🕰 ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯 🪔 🧯 🛢 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🪜 🧰 🪛 🔧 🔨 ⚒ 🛠 ⛏ 🪚 🔩 ⚙️ 🪤 🧱 ⛓ 🧲 🔫 💣 🧨 🪓 🔪 🗡 ⚔️ 🛡 🚬 ⚰️ 🪦 ⚱️ 🏺 🔮 📿 🧿 💈 ⚗️ 🔭 🔬 🕳 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡 🧹 🪠 🧺 🧻 🚽 🚰 🚿 🛁 🛀 🧼 🪥 🪒 🧽 🪣 🧴 🛎 🔑 🗝 🚪 🪑 🛋 🛏 🛌 🧸 🪆 🖼 🪞 🪟 🛍 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉 🎎 🏮 🎐 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷 🪧 📪 📫 📬 📭 📮 📯 📜 📃 📄 📑 🧾 📊 📈 📉 🗒 🗓 📆 📅 🗑 🪪 📇 🗃 🗳 🗄 📋 📁 📂 🗂 🗞 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🧷 🔗 📎 🖇 📐 📏 🧮 📌 📍 ✂️ 🖊 🖋 ✒️ 🖌 🖍 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓".split(" ") },
  { id: "flags", label: "Flags", emojis: "🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇺🇸 🇬🇧 🇵🇰 🇮🇳 🇩🇪 🇫🇷 🇳🇱 🇦🇪 🇸🇦 🇨🇦 🇦🇺 🇧🇷 🇲🇽 🇹🇷 🇮🇩 🇯🇵 🇰🇷 🇨🇳 🇷🇺 🇪🇸 🇮🇹 🇵🇹 🇱🇻 🇿🇦 🇳🇬 🇪🇬".split(" ") },
];

export const EMOJI_KEYWORDS: Record<string, string> = {
  fire: "🔥", heart: "❤️", love: "❤️", star: "⭐", check: "✅", rocket: "🚀",
  party: "🎉", camera: "📸", music: "🎵", sun: "☀️", moon: "🌙", rain: "🌧",
  dog: "🐶", cat: "🐱", pizza: "🍕", coffee: "☕", beer: "🍺", money: "💰",
  thumbs: "👍", clap: "👏", pray: "🙏", eyes: "👀", think: "🤔", cry: "😭",
  laugh: "😂", cool: "😎", wow: "😮", angry: "😡", sick: "🤒", plane: "✈️",
};

export function filterEmojis(query: string, categoryId?: string): string[] {
  const q = query.trim().toLowerCase();
  let pool = categoryId
    ? (EMOJI_CATEGORIES.find((c) => c.id === categoryId)?.emojis ?? [])
    : EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  pool = [...new Set(pool)];
  if (!q) return pool;
  const kwHits = Object.entries(EMOJI_KEYWORDS)
    .filter(([k]) => k.includes(q))
    .map(([, e]) => e);
  const catHits = EMOJI_CATEGORIES
    .filter((c) => c.label.toLowerCase().includes(q))
    .flatMap((c) => c.emojis);
  return [...new Set([...kwHits, ...catHits, ...pool])].slice(0, 240);
}

const IG_GENERIC = ["love", "instagood", "photooftheday", "beautiful", "happy", "fashion", "art", "photography", "picoftheday", "follow", "nature", "reels", "explore", "explorepage", "viral", "trending", "instadaily", "style", "life", "photo"];
const IG_NICHE = ["creator", "contentcreator", "digitalcreator", "smallbusiness", "supportlocal", "handmade", "fitness", "foodie", "travelgram", "ootd", "skincare", "motivation"];
const TIKTOK_GENERIC = ["fyp", "foryou", "foryoupage", "viral", "trending", "tiktok", "tiktokviral", "xyzbca", "duet", "stitch", "capcut", "edit", "aesthetic", "pov", "grwm", "vlog"];
const TIKTOK_NICHE = ["booktok", "foodtok", "fitnesstok", "techtok", "beautytok", "comedy", "dance", "tutorial", "learnontiktok", "smallbusiness"];

export function generateHashtags(
  keywords: string,
  platform: "Instagram" | "TikTok",
  opts: { max?: number; includePopular?: boolean; includeNiche?: boolean; includeBranded?: boolean } = {},
) {
  const max = opts.max ?? (platform === "TikTok" ? 100 : 30);
  const words = keywords.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const tags: string[] = [];
  for (const w of words) {
    tags.push(`#${w}`, `#${w}lover`, `#${w}life`, `#${w}daily`, `#${w}gram`, `#${w}community`, `#${w}tips`, `#${w}inspo`);
    if (opts.includeBranded !== false) tags.push(`#${w}official`, `#team${w}`);
  }
  const popular = platform === "TikTok" ? TIKTOK_GENERIC : IG_GENERIC;
  const niche = platform === "TikTok" ? TIKTOK_NICHE : IG_NICHE;
  if (opts.includePopular !== false) tags.push(...popular.map((g) => `#${g}`));
  if (opts.includeNiche !== false) tags.push(...niche.map((g) => `#${g}`));
  const uniq = [...new Set(tags.map((t) => t.toLowerCase()))];
  return uniq.slice(0, max);
}

export function splitTwitterThread(text: string, limit = 280): string[] {
  const paras = text.split(/\n\n+/).filter(Boolean);
  const tweets: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (twitterWeightedLength(p) <= limit) {
      if (cur && twitterWeightedLength(`${cur}\n\n${p}`) > limit) {
        tweets.push(cur.trim());
        cur = p;
      } else {
        cur = cur ? `${cur}\n\n${p}` : p;
      }
    } else {
      if (cur) { tweets.push(cur.trim()); cur = ""; }
      const words = p.split(/\s+/);
      let chunk = "";
      for (const w of words) {
        const next = chunk ? `${chunk} ${w}` : w;
        if (twitterWeightedLength(next) > limit) {
          if (chunk) tweets.push(chunk);
          chunk = w;
        } else chunk = next;
      }
      if (chunk) tweets.push(chunk);
    }
  }
  if (cur.trim()) tweets.push(cur.trim());
  return tweets.length ? tweets : [""];
}

export function applyLineBreakMethod(text: string, method: "braille" | "zero-width" | "dots" | "dash"): string {
  return text.split("\n").map((line) => {
    if (line.trim() !== "") return line;
    switch (method) {
      case "zero-width": return "\u200B";
      case "dots": return "·";
      case "dash": return "—";
      default: return "⠀";
    }
  }).join("\n");
}

export function ytVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}
