/** Shared TTS data — sample scripts & preview phrases per language (ISO 639-1 base). */

export const TONE_PRESETS = {
  natural: { rate: 1, pitch: 1, volume: 1, label: "Natural", emoji: "🎯", desc: "Balanced everyday narration" },
  tutorial: { rate: 0.85, pitch: 1, volume: 1, label: "Slow & clear", emoji: "📚", desc: "Tutorials & e-learning" },
  energetic: { rate: 1.15, pitch: 1.1, volume: 1, label: "Energetic", emoji: "⚡", desc: "Reels & TikTok" },
  deep: { rate: 0.9, pitch: 0.75, volume: 1, label: "Deep", emoji: "🎙️", desc: "Podcast & documentary" },
  friendly: { rate: 1.05, pitch: 1.15, volume: 0.95, label: "Friendly", emoji: "😊", desc: "Vlogs & lifestyle" },
  dramatic: { rate: 0.92, pitch: 0.85, volume: 1, label: "Dramatic", emoji: "🎬", desc: "Storytelling & trailers" },
  news: { rate: 1.12, pitch: 0.95, volume: 1, label: "News", emoji: "📰", desc: "Bulletin & anchor style" },
  calm: { rate: 0.78, pitch: 0.95, volume: 0.85, label: "Calm", emoji: "🧘", desc: "Meditation & wellness" },
  excited: { rate: 1.22, pitch: 1.2, volume: 1, label: "Excited", emoji: "🔥", desc: "Launches & gaming" },
  soft: { rate: 0.8, pitch: 0.9, volume: 0.55, label: "Soft", emoji: "🤫", desc: "ASMR & intimate reads" },
  professional: { rate: 1, pitch: 0.95, volume: 1, label: "Professional", emoji: "💼", desc: "Corporate & business" },
  storyteller: { rate: 0.88, pitch: 0.92, volume: 0.95, label: "Storyteller", emoji: "📖", desc: "Audiobooks & narration" },
} as const;

export type ToneKey = keyof typeof TONE_PRESETS;

/** Long sample scripts for "Load sample" */
export const SAMPLE_SCRIPTS: Record<string, string> = {
  en: "Welcome to my channel! Today we're exploring something amazing. Stick around until the end for a special tip you won't want to miss.",
  ur: "میری چینل میں خوش آمدید! آج ہم کچھ شاندار دریافت کریں گے۔ آخر تک دیکھیں، خاص تجویز ملے گی۔",
  hi: "मेरे चैनल में आपका स्वागत है! आज हम कुछ अद्भुत एक्सप्लोर करेंगे। अंत तक बने रहें।",
  ar: "مرحباً بكم في قناتي! اليوم سنستكشف شيئاً رائعاً. ابقوا حتى النهاية للحصول على نصيحة خاصة.",
  fa: "به کانال من خوش آمدید! امروز چیز شگفت‌انگیزی را کشف می‌کنیم.",
  ps: "زما چینل ته ښه راغلاست! نن موږ به څه حیرانونکي ومومو.",
  bn: "আমার চ্যানেলে স্বাগতম! আজ আমরা কিছু অসাধারণ অন্বেষণ করব।",
  pa: "ਮੇਰੇ ਚੈਨਲ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ! ਅੱਜ ਅਸੀਂ ਕੁਝ ਸ਼ਾਨਦਾਰ ਖੋਜਾਂਗੇ।",
  gu: "મારી ચેનલ પર સ્વાગત છે! આજે અમે કંઈક અદ્ભુત શોધીશું.",
  mr: "माझ्या चॅनेलवर स्वागत आहे! आज आपण काहीतरी अप्रतिम शोधणार आहोत.",
  ta: "என் சேனலுக்கு வரவேற்கிறோம்! இன்று நாம் ஏதோ அற்புதமானதை ஆராய்வோம்.",
  te: "నా చానల్‌కు స్వాగతం! ఈరోజు మనం అద్భుతమైనదాన్ని అన్వేషిస్తాము.",
  kn: "ನನ್ನ ಚಾನಲ್‌ಗೆ ಸ್ವಾಗತ! ಇಂದು ನಾವು ಅದ್ಭುತವಾದದ್ದನ್ನು ಅನ್ವೇಷಿಸುತ್ತೇವೆ.",
  ml: "എന്റെ ചാനലിലേക്ക് സ്വാഗതം! ഇന്ന് നമ്മൾ അത്ഭുതകരമായ എന്തെങ്കിലും പര്യവേക്ഷണം ചെയ്യും.",
  si: "මගේ නාලිකාවට සාදරයෙන් පිළිගනිමු! අද අපි අපූරු දෙයක් ගවේෂණය කරමු.",
  ne: "मेरो च्यानलमा स्वागत छ! आज हामी केही अद्भुत कुरा अन्वेषण गर्नेछौं.",
  es: "¡Bienvenidos a mi canal! Hoy exploraremos algo increíble. Quédense hasta el final.",
  fr: "Bienvenue sur ma chaîne ! Aujourd'hui nous allons explorer quelque chose d'incroyable.",
  de: "Willkommen auf meinem Kanal! Heute entdecken wir etwas Erstaunliches.",
  it: "Benvenuti sul mio canale! Oggi esploreremo qualcosa di incredibile.",
  pt: "Bem-vindo ao meu canal! Hoje vamos explorar algo incrível.",
  nl: "Welkom op mijn kanaal! Vandaag gaan we iets geweldigs ontdekken.",
  pl: "Witamy na moim kanale! Dziś odkryjemy coś niesamowitego.",
  ru: "Добро пожаловать на мой канал! Сегодня мы исследуем нечто удивительное.",
  uk: "Ласкаво просимо на мій канал! Сьогодні ми дослідимо щось дивовижне.",
  cs: "Vítejte na mém kanálu! Dnes prozkoumáme něco úžasného.",
  sk: "Vitajte na mojom kanáli! Dnes preskúmame niečo úžasné.",
  ro: "Bun venit pe canalul meu! Astăzi vom explora ceva uimitor.",
  hu: "Üdvözöljük a csatornámon! Ma valami csodálatosat fedezünk fel.",
  bg: "Добре дошли в моя канал! Днес ще проучим нещо невероятно.",
  hr: "Dobrodošli na moj kanal! Danas ćemo istražiti nešto nevjerojatno.",
  sr: "Добродошли на мој канал! Данас ћемо истражити нешто невероватно.",
  sl: "Dobrodošli na moj kanal! Danes bomo raziskali nekaj neverjetnega.",
  el: "Καλώς ήρθατε στο κανάλι μου! Σήμερα θα εξερευνήσουμε κάτι καταπληκτικό.",
  tr: "Kanalıma hoş geldiniz! Bugün harika bir şey keşfedeceğiz.",
  he: "ברוכים הבאים לערוץ שלי! היום נחקור משהו מדהים.",
  ja: "チャンネルへようこそ！今日は素晴らしいことを探求します。",
  ko: "채널에 오신 것을 환영합니다! 오늘 놀라운 것을 탐험할 것입니다.",
  zh: "欢迎来到我的频道！今天我们将探索一些精彩的内容。",
  vi: "Chào mừng đến với kênh của tôi! Hôm nay chúng ta sẽ khám phá điều gì đó tuyệt vời.",
  th: "ยินดีต้อนรับสู่ช่องของฉัน! วันนี้เราจะสำรวจสิ่งที่น่าทึ่ง",
  id: "Selamat datang di channel saya! Hari ini kita akan menjelajahi sesuatu yang luar biasa.",
  ms: "Selamat datang ke saluran saya! Hari ini kita akan meneroka sesuatu yang menakjubkan.",
  fil: "Maligayang pagdating sa aking channel! Ngayon ay tuklasin natin ang isang kamangha-manghang bagay.",
  sw: "Karibu kwenye chaneli yangu! Leo tutachunguza kitu cha kushangaza.",
  am: "ወደ ቻናሌዬ እንኳን በደህና መጡ! ዛሬ አስደናቂ ነገር እንחקור።",
  ha: "Barka da zuwa tashar ta! Yau za mu bincika wani abu mai ban mamaki.",
  yo: "Kaabo si ikanni mi! Loni a o ṣawari nkan ti o yà.",
  zu: "Siyakwamukela esiteshini sami! Namhlanje sizohlole okumangalisayo.",
  af: "Welkom by my kanaal! Vandag gaan ons iets wonderliks verken.",
  sv: "Välkommen till min kanal! Idag ska vi utforska något fantastiskt.",
  da: "Velkommen til min kanal! I dag udforsker vi noget fantastisk.",
  nb: "Velkommen til kanalen min! I dag skal vi utforske noe fantastisk.",
  fi: "Tervetuloa kanavalleni! Tänään tutkimme jotain upeaa.",
  is: "Velkomin á rásina mína! Í dag munum við kanna eitthvað ótrúlegt.",
  lv: "Laipni lūdzam manā kanālā! Šodien mēs izpētīsim kaut ko pārsteidzošu.",
  lt: "Sveiki atvykę į mano kanalą! Šiandien tyrinėsime ką nors nuostabaus.",
  et: "Tere tulemast minu kanalisse! Täna uurime midagi imelist.",
  ca: "Benvingut al meu canal! Avui explorarem alguna cosa increïble.",
  eu: "Ongi etorri nire kanalera! Gaur zerbait harrigarria arakatu dugu.",
  gl: "Benvido ao meu canal! Hoxe exploraremos algo incrible.",
  sq: "Mirë se vini në kanalin tim! Sot do të eksplorojmë diçka të mahnitshme.",
  mk: "Добредојдовте на мојот канал! Денес ќе истражуваме нешто неверојатно.",
  bs: "Dobrodošli na moj kanal! Danas ćemo istražiti nešto nevjerovatno.",
  az: "Kanalıma xoş gəlmisiniz! Bu gün möhtəşəm bir şey kəşf edəcəyik.",
  kk: "Арнама қош келдіңіз! Бүгін біз керемет нәрсе зерттейміз.",
  uz: "Kanalimga xush kelibsiz! Bugun ajoyib narsani kashf qilamiz.",
  hy: "Բari galustst im chanalin! Aysor menq kdischenq hrashali ban:",
  ka: "კეთილი იყოს თქვენი მობრძანება ჩემს არხზე! დღეს რაღაც საოცარს გავივლით.",
  km: "សូមស្វាគមន៍មកកាន់ឆានែលរបស់ខ្ញុំ! ថ្ងៃនេះយើងនឹងរុករកអ្វីមួយអស្ចារ្យ។",
  lo: "ຍິນດີຕ້ອນຮັບສູ່ຊ່ອງຂອງຂ້ອຍ! ມື້ນີ້ພວກເຮົາຈະສຳຫຼວດບາງສິ່ງທີ່น่าอັດສະຈັນ.",
  my: "ကျွန်ုပ်၏ချန်နယ်သို့ ကြိုဆိုပါသည်! ယနေ့ အံ့ဖွယ်တစ်ခုခုကို ရှာဖွေပါမည်။",
};

/** Short phrase for tone / actor previews */
export const PREVIEW_PHRASES: Record<string, string> = {
  en: "Hello! This is how I sound with this tone.",
  ur: "السلام! یہ میری آواز ہے۔",
  hi: "नमस्ते! यह मेरी आवाज़ है।",
  ar: "مرحباً! هكذا يبدو صوتي.",
  fa: "سلام! این صدای من است.",
  bn: "হ্যালো! এটি আমার কণ্ঠস্বর।",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਇਹ ਮੇਰੀ ਆਵਾਜ਼ ਹੈ।",
  es: "¡Hola! Así suena mi voz.",
  fr: "Bonjour ! Voici ma voix.",
  de: "Hallo! So klingt meine Stimme.",
  it: "Ciao! Ecco come suona la mia voce.",
  pt: "Olá! Assim soa a minha voz.",
  ru: "Привет! Так звучит мой голос.",
  ja: "こんにちは！これが私の声です。",
  ko: "안녕하세요! 제 목소리입니다.",
  zh: "你好！这是我的声音。",
  tr: "Merhaba! Sesim böyle.",
  vi: "Xin chào! Đây là giọng của tôi.",
  th: "สวัสดี! นี่คือเสียงของฉัน",
  id: "Halo! Ini suara saya.",
  nl: "Hallo! Zo klinkt mijn stem.",
  pl: "Cześć! Tak brzmi mój głos.",
  ta: "வணக்கம்! இது என் குரல்.",
  te: "హలో! ఇది నా స్వరం.",
  default: "Hello! This is a voice preview.",
};

export function sampleForLang(langCode: string) {
  const base = (langCode.split("-")[0] ?? "en").toLowerCase();
  return SAMPLE_SCRIPTS[base] ?? SAMPLE_SCRIPTS.en!;
}

export function previewForLang(langCode: string) {
  const base = (langCode.split("-")[0] ?? "en").toLowerCase();
  return PREVIEW_PHRASES[base] ?? PREVIEW_PHRASES.default!;
}

export function langFamilyLabel(base: string) {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    return dn.of(base) ?? base;
  } catch {
    return base;
  }
}

export function langLocaleLabel(code: string) {
  try {
    const parts = code.split("-");
    const base = parts[0] ?? code;
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    const rn = new Intl.DisplayNames(["en"], { type: "region" });
    const lang = dn.of(base) ?? base;
    const region = parts[1] ? rn.of(parts[1]) : null;
    return region ? `${lang} (${region})` : lang;
  } catch {
    return code;
  }
}

export type VoiceGender = "female" | "male" | "neutral";

const FEMALE_RE =
  /female|woman|girl|zira|samantha|victoria|karen|moira|fiona|veena|lekha|heera|meera|salma|hoda|amina|paulina|luciana|maria|elena|anna|petra|yuki|yuna|xiaoxiao|xiaoyi|yunxi|tingting|ayumi|sora|nanami|helen|helena|linda|susan|lisa|jenny|aria|sonia|laura|monica|isabella|camila|valentina|natasha|olga|irina|katya|marina|nadia|hannah|emma|sarah|jessica|nicole|michelle|catherine|nancy|heidi|marlene|klara|amala|swara|ananya|kajal|neerja|tarun|sapna|kalpana|gul|farah|noor|layla|zainab|fatima|aisha|noura|amira|hala|dalia|rana|maged|hiam|zeina|laila|yasmin|amani|hala|mouna|leila|samira|nada|dina|rima|sabina|gabriela|fernanda|carolina|andrea|patricia|clara|beatriz|alicia|raquel|teresa|paula|julia|helena|ines|filipa|catarina|joana|sara|miriam|ruth|esther|deborah|miriam|sharon|tessa|fleur|colette|denise|celeste|yvette|genevieve|helene|brigitte|chantal|florence|odette|simone|renée|noémie|capucine|manon|juliette|charlotte|amelie|aurelie|celine|marion|justine|oceane|elodie|mathilde|chloe|camille|claire|sophie|emilie|audrey|melanie|nathalie|isabelle|veronique|sandrine|corinne|dominique|francoise|monique|sylvie|brigitte|karin|ingrid|astrid|birgit|heike|sabine|petra|monika|andrea|susanne|ursula|helga|greta|freya|astrid|solveig|sigrid|ingrid|kirsten|line|nora|thea|ida|maja|elin|saga|freja|alva|liv|nora|sara|hedda|tuva|ebba|alma|ella|mila|nova|luna|stella|violet/i;

const MALE_RE =
  /male|man|boy|david|mark|james|daniel|guy|ryan|george|rishi|arjun|hamza|farooq|diego|jorge|thomas|stefan|ivan|alex|fred|john|mike|paul|peter|richard|robert|steve|tom|william|brian|kevin|jason|eric|frank|jack|nick|oscar|adam|ben|carlos|miguel|antonio|francisco|luis|pedro|rafael|sergio|marco|luca|matteo|giuseppe|paolo|stefano|giovanni|hans|klaus|wolfgang|jurgen|dieter|helmut|manfred|werner|horst|gunther|heinz|franz|otto|erik|lars|anders|bjorn|magnus|olav|sven|nils|piotr|tomasz|krzysztof|marek|pavel|milan|dusan|boris|milos|nikola|marko|dejan|vladimir|dmitri|sergei|alexei|nikolai|andrei|mikhail|yuri|oleg|viktor|artem|maxim|roman|timur|standard b|standard d|standard f|standard h|standard j|wavenet b|wavenet d|wavenet f|neural2 b|neural2 d|neural2 f|polyglot|male voice|en-us standard b|en-gb standard b|en-au standard b|en-in standard b|ur-pk|ur-in|hi-in standard b|ar-xa|fr-fr standard b|de-de standard b|es-es standard b|it-it standard b|pt-br standard b|ja-jp standard b|ko-kr standard b|zh-cn standard b|tr-tr standard b|vi-vn standard b|th-th standard b|id-id standard b|nl-nl standard b|pl-pl standard b|ru-ru standard b|uk-ua standard b|cs-cz standard b|ro-ro standard b|hu-hu standard b|el-gr standard b|he-il standard b|sv-se standard b|da-dk standard b|nb-no standard b|fi-fi standard b|ca-es standard b|sk-sk standard b|bg-bg standard b|hr-hr standard b|sr-rs standard b|sl-si standard b|lt-lt standard b|lv-lv standard b|et-ee standard b|is-is standard b|ms-my standard b|fil-ph standard b|sw-ke standard b|am-et standard b|af-za standard b|zu-za standard b|bn-in standard b|ta-in standard b|te-in standard b|kn-in standard b|ml-in standard b|mr-in standard b|gu-in standard b|pa-in standard b|fa-ir standard b|ps-af standard b|si-lk standard b|ne-np standard b|my-mm standard b|km-kh standard b|lo-la standard b|ka-ge standard b|hy-am standard b|az-az standard b|kk-kz standard b|uz-uz standard b|mk-mk standard b|sq-al standard b|eu-es standard b|gl-es standard b|bs-ba standard b|ha-ng standard b|yo-ng standard b|ig-ng standard b|xh-za standard b|st-za standard b|tn-za standard b|ts-za standard b|ss-za standard b|ve-za standard b|nr-za standard b|nso-za standard b|tsn-za standard b|ven-za standard b|tso-za standard b|ssw-za standard b|nbl-za standard b/i;

export function inferGender(voice: SpeechSynthesisVoice): VoiceGender {
  const hay = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  if (FEMALE_RE.test(hay)) return "female";
  if (MALE_RE.test(hay)) return "male";
  return "neutral";
}

export function cleanActorName(name: string) {
  return name
    .replace(/^Microsoft\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s+Online\s+\(Natural\)/i, " (Natural)")
    .replace(/\s+-?\s*English\s+\([^)]+\)/i, "")
    .trim();
}

/** Detect primary language from script in pasted text */
export function detectTextLanguage(text: string): string | null {
  const t = text.replace(/\s/g, "");
  if (!t.length) return null;
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  if (/[\u0980-\u09FF]/.test(t)) return "bn";
  if (/[\u0A00-\u0A7F]/.test(t)) return "pa";
  if (/[\u0B80-\u0BFF]/.test(t)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(t)) return "te";
  if (/[\u0D00-\u0D7F]/.test(t)) return "ml";
  if (/[\u0B00-\u0B7F]/.test(t)) return "or";
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh";
  if (/[\u3040-\u30FF]/.test(t)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(t)) return "ko";
  if (/[\u0400-\u04FF]/.test(t)) return "ru";
  if (/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(t)) {
    // Urdu-specific letters: ے ں گ پ چ ژ ٹ ڈ ڑ ھ (and Urdu yeh ی U+06CC)
    if (/[\u06CC\u06D2\u06BA\u06BE\u06C1\u06AF\u0679\u0688\u0691\u067E\u0686\u0698\u06A9\u06D3]/.test(t)) return "ur";
    return "ar";
  }
  if (/[a-zA-Z]/.test(t)) return "en";
  return null;
}

/** All voices matching a language base (ur → ur-PK, ur-IN, ur) */
export function voicesForLanguage(voices: SpeechSynthesisVoice[], langBase: string): SpeechSynthesisVoice[] {
  const base = langBase.toLowerCase();
  return voices.filter((v) => {
    const l = v.lang.toLowerCase();
    return l === base || l.startsWith(`${base}-`);
  });
}

export function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  langBase: string,
  preferredName?: string,
): SpeechSynthesisVoice | undefined {
  const matches = voicesForLanguage(voices, langBase);
  if (!matches.length) return undefined;
  if (preferredName) {
    const kept = matches.find((v) => v.name === preferredName);
    if (kept) return kept;
  }
  if (langBase === "ur") {
    const urduNamed = matches.find((v) =>
      /urdu|ur-pk|pakistan|gul|asad|salman|madina|saba|farah|noor|hira|uzma/i.test(v.name),
    );
    if (urduNamed) return urduNamed;
  }
  return (
    matches.find((v) => v.localService && v.default) ??
    matches.find((v) => v.localService) ??
    matches.find((v) => v.default) ??
    matches[0]
  );
}

/** Chrome / Edge sometimes drops speak() — retry once if silent */
export function speakUtterance(u: SpeechSynthesisUtterance, onDone?: () => void, onError?: (msg: string) => void) {
  if (speechSynthesis.paused) speechSynthesis.resume();
  speechSynthesis.getVoices();

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone?.();
  };

  u.onend = finish;
  u.onerror = (ev) => {
    done = true;
    const err = (ev as SpeechSynthesisErrorEvent).error ?? "speech-error";
    onError?.(String(err));
    onDone?.();
  };

  speechSynthesis.cancel();
  window.setTimeout(() => {
    speechSynthesis.speak(u);
    // Chrome stuck bug — retry if nothing started
    window.setTimeout(() => {
      if (!done && !speechSynthesis.speaking && !speechSynthesis.pending) {
        speechSynthesis.speak(u);
      }
    }, 300);
  }, 80);
}
