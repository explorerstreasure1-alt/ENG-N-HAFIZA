import { del, get, put } from "@vercel/blob";
import { DEMO_PUBLICATIONS } from "./seed";
import { LEVELS, type Level, type Publication } from "./types";

const METADATA_PATH = "engin-hafiza/publications.json";

function asLevel(value: string): Level {
  return LEVELS.includes(value as Level) ? (value as Level) : "A1";
}

async function readMetadata(): Promise<Publication[]> {
  try {
    const result = await get(METADATA_PATH, { access: "public" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return [...DEMO_PUBLICATIONS];
    }
    const text = await new Response(result.stream as unknown as BodyInit).text();
    const data = JSON.parse(text) as Publication[];
    return data.map((item) => ({
      ...item,
      level: asLevel(item.level),
    }));
  } catch {
    return [...DEMO_PUBLICATIONS];
  }
}

async function writeMetadata(publications: Publication[]): Promise<void> {
  await put(METADATA_PATH, JSON.stringify(publications, null, 2), {
    access: "public",
    cacheControlMaxAge: 60,
    contentType: "application/json",
  });
}

export async function getPublications(): Promise<Publication[]> {
  try {
    const rows = await readMetadata();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error("Engin Hafıza: yayınlar okunamadı, demo görseller kullanılıyor.", error);
    return [...DEMO_PUBLICATIONS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

interface CreatePublicationInput {
  id: string;
  languageId: string;
  level: Level;
  topicId: string;
  imageUrl: string;
  createdAt?: string;
}

export async function createPublication(input: CreatePublicationInput): Promise<Publication> {
  const current = await readMetadata();
  const item: Publication = {
    id: input.id,
    languageId: input.languageId,
    level: input.level,
    topicId: input.topicId,
    imageUrl: input.imageUrl,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  const next = [item, ...current];
  await writeMetadata(next);
  return item;
}

export async function deletePublication(id: string): Promise<void> {
  const current = await readMetadata();
  const item = current.find((p) => p.id === id);
  const next = current.filter((p) => p.id !== id);
  await writeMetadata(next);
  if (item) {
    try {
      await del(item.imageUrl);
    } catch {
      // sessis
    }
  }
}
