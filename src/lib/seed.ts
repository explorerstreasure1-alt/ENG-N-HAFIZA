import { LEVELS, type Language, type Level, type Publication, type Topic } from "./types";

export const TOPIC_TEMPLATES: Record<Level, string[]> = {
  A1: [
    "Alfabe & Telaffuz Temelleri",
    "Selamlaşma & Tanışma",
    "Sayılar & Zaman & Günler",
    "Aile & Kişiler",
    "Renkler & Günlük Nesneler",
    "Yiyecek & İçecekler",
    "Temel Fiiller & Günlük Rutin",
    "Yönler & Ulaşım",
  ],
  A2: [
    "Alışveriş & Para",
    "Sağlık & Vücut",
    "Hava Durumu & Mevsimler",
    "Hobiler & Boş Zaman",
    "Geçmiş Zaman İfadeleri",
    "Ev & Eşyalar",
    "Restoran & Seyahat Diyalogları",
  ],
  B1: [
    "İş Hayatı & Meslekler",
    "Duygular & Karakter Özellikleri",
    "Eğitim & Teknoloji",
    "Bağlaçlar & Kalıp İfadeler",
    "Sosyal İlişkiler & İletişim",
    "Haber & Güncel Olaylar",
  ],
  B2: [
    "Deyimler & Atasözleri",
    "Soyut Kavramlar & Düşünce",
    "Tartışma & İkna Kalıpları",
    "Kültür & Sanat & Edebiyat",
    "İleri Fiil Yapıları",
  ],
  C1: [
    "Akademik & Profesyonel Terminoloji",
    "Nüanslı İfadeler & Retorik",
    "Hukuk & Ekonomi & Diplomasi Terimleri",
    "Üst Düzey Deyimsel Kalıplar",
  ],
};

export const LANGUAGE_SEEDS: Language[] = [
  { id: "en", name: "İngilizce", nativeName: "English", icon: "EN", cover: "/kapaklar/en.jpg" },
  { id: "de", name: "Almanca", nativeName: "Deutsch", icon: "DE", cover: "/kapaklar/de.jpg" },
  { id: "fr", name: "Fransızca", nativeName: "Français", icon: "FR", cover: "/kapaklar/fr.jpg" },
  { id: "es", name: "İspanyolca", nativeName: "Español", icon: "ES", cover: "/kapaklar/es.jpg" },
  { id: "it", name: "İtalyanca", nativeName: "Italiano", icon: "IT", cover: "/kapaklar/it.jpg" },
  { id: "ru", name: "Rusça", nativeName: "Русский", icon: "RU", cover: "/kapaklar/ru.jpg" },
  { id: "ar", name: "Arapça", nativeName: "العربية", icon: "AR", cover: "/kapaklar/ar.jpg" },
  { id: "ja", name: "Japonca", nativeName: "日本語", icon: "JA", cover: "/kapaklar/ja.jpg" },
  { id: "pt", name: "Portekizce", nativeName: "Português", icon: "PT", cover: "/kapaklar/pt.jpg" },
  { id: "nl", name: "Hollandaca", nativeName: "Nederlands", icon: "NL", cover: "/kapaklar/nl.jpg" },
  { id: "zh", name: "Çince", nativeName: "中文", icon: "ZH", cover: "/kapaklar/zh.jpg" },
  { id: "ko", name: "Korece", nativeName: "한국어", icon: "KO", cover: "/kapaklar/ko.jpg" },
];

export function buildTopics(): Topic[] {
  return LEVELS.flatMap((level) =>
    TOPIC_TEMPLATES[level].map((title, index) => ({
      id: `${level}-${index + 1}`,
      level,
      title,
      order: index + 1,
    })),
  );
}

export const TOPICS = buildTopics();

/** Demo kart görseli üretir (harici dosya gerektirmez, 1000x880). */
function demoCardImage(word: string, emoji: string): string {
  const safeWord = word.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fontSize = safeWord.length > 14 ? 46 : safeWord.length > 10 ? 58 : safeWord.length > 7 ? 72 : 88;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="880" viewBox="0 0 1000 880">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2a4a"/>
      <stop offset="0.55" stop-color="#101c33"/>
      <stop offset="1" stop-color="#3b0a0a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.18" r="0.85">
      <stop offset="0" stop-color="#ff6b6b" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#ff6b6b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="880" fill="url(#bg)"/>
  <rect width="1000" height="880" fill="url(#glow)"/>
  <rect x="30" y="30" width="940" height="820" rx="46" fill="none" stroke="#8b0000" stroke-width="14"/>
  <text x="500" y="330" font-size="150" text-anchor="middle">${emoji}</text>
  <text x="500" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeWord}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface DemoWord {
  word: string;
  emoji: string;
}

const DEMO_GREETINGS: Record<string, { label: string; words: DemoWord[] }> = {
  en: { label: "English", words: [{ word: "Hello", emoji: "👋" }, { word: "Good morning", emoji: "🌅" }, { word: "Thank you", emoji: "🙏" }, { word: "Please", emoji: "🤲" }, { word: "Goodbye", emoji: "🚪" }] },
  de: { label: "Deutsch", words: [{ word: "Hallo", emoji: "👋" }, { word: "Guten Morgen", emoji: "🌅" }, { word: "Danke", emoji: "🙏" }, { word: "Bitte", emoji: "🤲" }, { word: "Tschüss", emoji: "🚪" }] },
  fr: { label: "Français", words: [{ word: "Bonjour", emoji: "👋" }, { word: "Bonsoir", emoji: "🌙" }, { word: "Merci", emoji: "🙏" }, { word: "S'il vous plaît", emoji: "🤲" }, { word: "Au revoir", emoji: "🚪" }] },
  es: { label: "Español", words: [{ word: "Hola", emoji: "👋" }, { word: "Buenos días", emoji: "🌅" }, { word: "Gracias", emoji: "🙏" }, { word: "Por favor", emoji: "🤲" }, { word: "Adiós", emoji: "🚪" }] },
  it: { label: "Italiano", words: [{ word: "Ciao", emoji: "👋" }, { word: "Buongiorno", emoji: "🌅" }, { word: "Grazie", emoji: "🙏" }, { word: "Per favore", emoji: "🤲" }, { word: "Arrivederci", emoji: "🚪" }] },
  ru: { label: "Русский", words: [{ word: "Привет", emoji: "👋" }, { word: "Доброе утро", emoji: "🌅" }, { word: "Спасибо", emoji: "🙏" }, { word: "Пожалуйста", emoji: "🤲" }, { word: "До свидания", emoji: "🚪" }] },
  ar: { label: "العربية", words: [{ word: "مرحبا", emoji: "👋" }, { word: "صباح الخير", emoji: "🌅" }, { word: "شكرا", emoji: "🙏" }, { word: "من فضلك", emoji: "🤲" }, { word: "مع السلامة", emoji: "🚪" }] },
  ja: { label: "日本語", words: [{ word: "こんにちは", emoji: "👋" }, { word: "おはよう", emoji: "🌅" }, { word: "ありがとう", emoji: "🙏" }, { word: "お願いします", emoji: "🤲" }, { word: "さようなら", emoji: "🚪" }] },
  pt: { label: "Português", words: [{ word: "Olá", emoji: "👋" }, { word: "Bom dia", emoji: "🌅" }, { word: "Obrigado", emoji: "🙏" }, { word: "Por favor", emoji: "🤲" }, { word: "Adeus", emoji: "🚪" }] },
  nl: { label: "Nederlands", words: [{ word: "Hallo", emoji: "👋" }, { word: "Goedemorgen", emoji: "🌅" }, { word: "Dank je", emoji: "🙏" }, { word: "Alsjeblieft", emoji: "🤲" }, { word: "Tot ziens", emoji: "🚪" }] },
  zh: { label: "中文", words: [{ word: "你好", emoji: "👋" }, { word: "早上好", emoji: "🌅" }, { word: "谢谢", emoji: "🙏" }, { word: "请", emoji: "🤲" }, { word: "再见", emoji: "🚪" }] },
  ko: { label: "한국어", words: [{ word: "안녕하세요", emoji: "👋" }, { word: "좋은 아침", emoji: "🌅" }, { word: "감사합니다", emoji: "🙏" }, { word: "부탁합니다", emoji: "🤲" }, { word: "안녕히 가세요", emoji: "🚪" }] },
};

export const DEMO_PUBLICATIONS: Publication[] = Object.entries(DEMO_GREETINGS).flatMap(
  ([languageId, group], languageIndex) =>
    group.words.map((item, index) => ({
      id: `demo-${languageId}-${index + 1}`,
      languageId,
      level: "A1" as Level,
      topicId: "A1-2",
      imageUrl: demoCardImage(item.word, item.emoji),
      createdAt: new Date(Date.UTC(2026, 0, 6, 12 - languageIndex, 30 - index * 5)).toISOString(),
    })),
);
