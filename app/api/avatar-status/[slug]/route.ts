import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { blobs } = await list({ prefix: `meta/${slug}` });
    if (!blobs.length) return NextResponse.json({ status: "none" });

    const meta = await fetch(blobs[0].url, { cache: "no-store" }).then((r) =>
      r.json()
    );

    if (!meta.avatarStatus) return NextResponse.json({ status: "none" });

    return NextResponse.json({
      status: meta.avatarStatus,
      ...(meta.avatarStatus === "ready"
        ? { danVideoUrl: meta.danVideoUrl, ralucaVideoUrl: meta.ralucaVideoUrl }
        : {}),
    });
  } catch {
    return NextResponse.json({ status: "none" });
  }
}
