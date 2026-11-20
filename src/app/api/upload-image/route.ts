import { put } from "@vercel/blob";
import { makeId } from "@/lib/client-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ ok: false, error: "Dosya bulunamadı." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ ok: false, error: "Lütfen bir görsel dosyası seçin." }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return Response.json({ ok: false, error: "Görsel en fazla 12 MB olabilir." }, { status: 400 });
    }

    // İstemci tarafında sıkıştırılmışsa zaten küçük ham dosya geliyor; doğrudan blob'a ata.
    const blob = await put(`engin-hafiza/${makeId("img")}-${file.name}`, file, {
      access: "public",
      cacheControlMaxAge: 31536000,
      contentType: file.type,
    });

    return Response.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (error) {
    console.error("Engin Hafıza: görsel yüklenemedi.", error);
    return Response.json({ ok: false, error: "Görsel yüklenemedi." }, { status: 500 });
  }
}
