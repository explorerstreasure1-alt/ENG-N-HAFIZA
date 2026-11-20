export const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;

export type Level = (typeof LEVELS)[number];

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  icon: string;
  /** Dil kapak görseli (public/kapaklar altında) */
  cover?: string;
}

export interface Topic {
  id: string;
  level: Level;
  title: string;
  order: number;
}

export interface Publication {
  id: string;
  languageId: string;
  level: Level;
  topicId: string;
  imageUrl: string;
  createdAt: string;
}

export const STORAGE_KEY = "engin-hafiza-simple-v2";

/**
 * Private Vercel Blob store'dan gelen URL'leri, sunucu tarafindaki /api/image-proxy'ye
 * yonlendirir ki tarayici duzgun gosterebilsin (403 hatasi yok olur).
 * data:image/ veya / ile baslayan yerel/demo URL'ler degistirilmez.
 */
export function toViewableUrl(imageUrl: string): string {
  if (!imageUrl || imageUrl.startsWith("data:") || imageUrl.startsWith("/")) return imageUrl;
  // Görseller public olarak yüklendiği için doğrudan URL döndürülür
  return imageUrl;
}

/** Görsel bulunamazsa gösterilecek yer tutucu (harici dosya gerektirmez). */
export const DEFAULT_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="880" viewBox="0 0 1000 880">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2a4a"/>
      <stop offset="0.6" stop-color="#101c33"/>
      <stop offset="1" stop-color="#3b0a0a"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="880" fill="url(#bg)"/>
  <rect x="30" y="30" width="940" height="820" rx="46" fill="none" stroke="#8b0000" stroke-width="14"/>
  <text x="500" y="470" font-family="Segoe UI, Arial, sans-serif" font-size="130" font-weight="bold" fill="#ffffff" text-anchor="middle">EH</text>
  <text x="500" y="590" font-family="Segoe UI, Arial, sans-serif" font-size="30" letter-spacing="10" fill="#ffffff" fill-opacity="0.6" text-anchor="middle">ENGIN HAFIZA</text>
</svg>`,
)}`;
