import { del, get, put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Teşhis endpoint'i: /api/health
 * Token varlığını, metadata okumayı ve yazmayı test eder.
 * Hata varsa gerçek mesajı döner.
 */
export async function GET(): Promise<Response> {
  const result: Record<string, unknown> = {
    hasToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN
      ? `${process.env.BLOB_READ_WRITE_TOKEN.slice(0, 12)}...`
      : null,
  };

  // 1) Okuma testi
  try {
    const meta = await get("engin-hafiza/publications.json", { access: "private" });
    result.read = meta
      ? { status: meta.statusCode, hasStream: Boolean(meta.stream) }
      : { status: "null" };
  } catch (error) {
    result.readError = error instanceof Error ? error.message : String(error);
  }

  // 2) Yazma testi (benzersiz test dosyası, sonra silinir)
  const testPath = `engin-hafiza/__health_${Date.now()}.json`;
  try {
    const written = await put(testPath, JSON.stringify({ ok: true, at: Date.now() }), {
      access: "private",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
    });
    result.write = { url: written.url, pathname: written.pathname };
    await del(testPath).catch(() => undefined);
    result.writeCleanedUp = true;
  } catch (error) {
    result.writeError = error instanceof Error ? error.message : String(error);
  }

  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
