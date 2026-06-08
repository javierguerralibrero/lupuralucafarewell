import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

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
    const raw = await kv.hget<string>("friends", slug);

    if (!raw) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const entry: FriendEntry = typeof raw === "string" ? JSON.parse(raw) : raw;

    return NextResponse.json(entry);
  } catch (err) {
    console.error("Page lookup error:", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
