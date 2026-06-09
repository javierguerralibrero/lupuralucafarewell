import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { blobs } = await list({ prefix: `meta/${slug}.json` });

    if (!blobs.length) {
      return new NextResponse("Not found", { status: 404 });
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

    const html = await htmlRes.text();

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Render error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
