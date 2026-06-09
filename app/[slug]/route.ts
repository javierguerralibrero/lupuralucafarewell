import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const { blobs } = await list({ prefix: `meta/${slug}.json` });

    if (!blobs.length) {
      return new NextResponse(
        `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>No encontrado</title>
<style>body{background:#0a0a0a;color:#fff;font-family:Georgia,serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:20px;margin:0}</style>
</head><body><p style="color:#555;font-size:1.2rem">Esta página no existe todavía.</p>
<a href="/" style="color:#e94560;font-size:0.9rem">← Volver al muro</a></body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const metaRes = await fetch(blobs[0].url);
    const meta = await metaRes.json();

    if (!meta.pageUrl) {
      return new NextResponse("Not found", { status: 404 });
    }

    const htmlRes = await fetch(meta.pageUrl);
    if (!htmlRes.ok) {
      return new NextResponse("Not found", { status: 404 });
    }

    let html = await htmlRes.text();

    // Inject edit bar directly into the HTML so it scrolls with the page
    const editBar = `<div style="position:fixed;top:0;right:0;z-index:2147483647;padding:7px 16px;border-bottom-left-radius:8px;background:rgba(10,10,10,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.4);">
<a href="/editar/${slug}" style="color:#aaa;font-size:0.8rem;text-decoration:none;font-family:sans-serif;white-space:nowrap;">✏️ Editar esta página</a>
</div>`;
    html = html.replace(/<body[^>]*>/, (m) => `${m}\n${editBar}`);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
