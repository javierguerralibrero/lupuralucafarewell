import { NextRequest, NextResponse } from "next/server";
import { list } from "@/lib/r2";

interface FriendEntry {
  name: string;
  slug: string;
  createdAt: string;
  pageUrl: string;
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { blobs } = await list({ prefix: `meta/${slug}.json` });

    if (!blobs.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const res = await fetch(blobs[0].url);
    const entry: FriendEntry = await res.json();

    return NextResponse.json(entry);
  } catch (err) {
    console.error("Page lookup error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
