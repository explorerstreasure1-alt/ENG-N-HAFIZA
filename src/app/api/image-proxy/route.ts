import { get } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  let path = searchParams.get("path");
  if (!path) {
    return new Response("Missing path", { status: 400 });
  }
  if (path.startsWith("/")) path = path.slice(1);

  try {
    const blob = await get(path, { access: "public" });
    if (!blob || !blob.stream) {
      console.warn("Engin Hafıza: image-proxy blob not found:", path);
      return new Response("Not found", { status: 404 });
    }
    const contentType = blob.headers?.get("content-type") || "application/octet-stream";
    return new Response(blob.stream as unknown as BodyInit, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers": "Range",
      },
    });
  } catch (error) {
    console.error("Engin Hafıza: image-proxy hata:", path, error);
    return new Response("Proxy error", { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "Range",
    },
  });
}
