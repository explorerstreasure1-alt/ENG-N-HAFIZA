import { createPublication, deletePublication, getPublications, updatePublication } from "@/lib/publications";
import { LANGUAGE_SEEDS, TOPICS } from "@/lib/seed";
import { LEVELS, type Level, type Publication } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getPublications();
  return Response.json(items, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Publication>;
    const validLanguage = LANGUAGE_SEEDS.some((language) => language.id === body.languageId);
    const validTopic = TOPICS.some((topic) => topic.id === body.topicId && topic.level === body.level);
    const validLevel = LEVELS.includes(body.level as Level);

    if (!body.id || !validLanguage || !validTopic || !validLevel || !body.imageUrl) {
      return Response.json({ ok: false, error: "Geçersiz yayın bilgisi" }, { status: 400 });
    }
    if (
      !body.imageUrl.startsWith("data:image/") &&
      !body.imageUrl.startsWith("/images/memory/") &&
      !body.imageUrl.startsWith("http")
    ) {
      return Response.json({ ok: false, error: "Geçersiz görsel" }, { status: 400 });
    }
    if (body.imageUrl.length > 5_000_000) {
      return Response.json({ ok: false, error: "Görsel çok büyük" }, { status: 400 });
    }

    const publication = await createPublication({
      id: body.id.slice(0, 120),
      languageId: body.languageId!,
      level: body.level as Level,
      topicId: body.topicId!,
      imageUrl: body.imageUrl,
      createdAt: body.createdAt,
    });
    console.log("Engin Hafıza: publication created:", publication.id);
    return Response.json({ ok: true, publication });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Engin Hafıza: yayın sunucuya kaydedilemedi.", message, error);
    // FIX #7: Hata durumunda 500 dön (200 dönmemeli) ki client fallback yapmasın
    // FIX #10: gerçek hata mesajını da dön ki client gösterebilsin
    return Response.json(
      { ok: false, error: `Sunucuya kaydedilemedi: ${message}` },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id: string;
      languageId?: string;
      topicId?: string;
      level?: Level;
    };
    if (!body.id) {
      return Response.json({ ok: false, error: "Yayın ID gerekli" }, { status: 400 });
    }
    const publication = await updatePublication(body.id, {
      languageId: body.languageId,
      topicId: body.topicId,
      level: body.level,
    });
    console.log("Engin Hafıza: publication updated:", publication.id, publication);
    return Response.json({ ok: true, publication });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Engin Hafıza: yayın güncellenemedi.", message, error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false }, { status: 400 });
  try {
    await deletePublication(id);
    console.log("Engin Hafıza: publication deleted:", id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Engin Hafıza: publication silinemedi:", id, error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
