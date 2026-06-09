import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 });

    // Find and delete all blobs for this slug
    const [metaBlobs, pageBlobs, uploadBlobs] = await Promise.all([
      list({ prefix: `meta/${slug}.json` }),
      list({ prefix: `pages/${slug}.html` }),
      list({ prefix: `uploads/${slug}/` }),
    ]);

    const urls = [
      ...metaBlobs.blobs.map((b) => b.url),
      ...pageBlobs.blobs.map((b) => b.url),
      ...uploadBlobs.blobs.map((b) => b.url),
    ];

    if (urls.length > 0) {
      await del(urls);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete page error:", err);
    return NextResponse.json({ error: "Error borrando la página" }, { status: 500 });
  }
}
