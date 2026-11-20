import { STORAGE_KEY, type Publication } from "./types";
import { del, put, list } from "@vercel/blob";

export interface LocalState {
  publications: Publication[];
  languageId: string;
  topicId: string;
}

export function createInitialState(publications: Publication[]): LocalState {
  return { publications, languageId: "en", topicId: "A1-2" };
}

export function loadState(fallbackPublications: Publication[]): LocalState {
  if (typeof window === "undefined") return createInitialState(fallbackPublications);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState(fallbackPublications);
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    if (!Array.isArray(parsed.publications)) return createInitialState(fallbackPublications);
    return {
      publications: parsed.publications,
      languageId: parsed.languageId || "en",
      topicId: parsed.topicId || "A1-2",
    };
  } catch {
    return createInitialState(fallbackPublications);
  }
}

export function persistState(state: LocalState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function uploadToBlob(file: File): Promise<{ url: string; pathname: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Lütfen bir görsel dosyası seçin.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Görsel en fazla 12 MB olabilir.");

  const blob = await put(`engin-hafiza/${makeId("img")}-${file.name}`, file, {
    access: "public",
    cacheControlMaxAge: 31536000,
    contentType: file.type,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteFromBlob(pathname: string) {
  try {
    await del(pathname);
  } catch {
    // sessis
  }
}

export async function listBlobs() {
  try {
    const { blobs } = await list({ prefix: "engin-hafiza/" });
    return blobs;
  } catch {
    return [];
  }
}

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  // Gerçek dosya blob'a yüklenir; önizleme için ObjectURL döndürülür.
  const objectUrl = URL.createObjectURL(file);
  return objectUrl;
}
