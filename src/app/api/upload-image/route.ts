import { put } from "@vercel/blob";
import { makeId } from "@/lib/client-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    // Token kontrolü: sunucuda tanımlı mı?
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not set in Vercel environment");
      return Response.json(
        { ok: false, error: "Sunucu yapılandırması eksik: BLOB_READ_WRITE_TOKEN" },
        { status: 500 }
      );
    }

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

    // Dosya adındaki özel karakterleri temizle (blob path sorunlarını önler)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const blob = await put(`engin-hafiza/${makeId("img")}-${safeFileName}`, file, {
      access: "public",
      cacheControlMaxAge: 31536000,
      contentType: file.type,
      addRandomSuffix: true,
    });

    return Response.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (error: any) {
    // Gerçek hata mesajını konsola ve yanıta yaz (debug için)
    const message = error?.message || String(error || "Bilinmeyen hata");
    console.error("Engin Hafıza: upload-image hata:", message);
    return Response.json(
      { ok: false, error: `Sunucu hatası: ${message}` },
      { status: 500 }
    );
  }
}
