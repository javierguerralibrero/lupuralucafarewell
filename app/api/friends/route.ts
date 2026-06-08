import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

interface FriendEntry {
  name: string;
  slug: string;
  createdAt: string;
  pageUrl: string;
}

export async function GET() {
  try {
    const raw = await kv.hgetall<Record<string, string>>("friends");
    if (!raw) {
      return NextResponse.json([]);
    }

    const friends: FriendEntry[] = Object.values(raw).map((val) => {
      if (typeof val === "string") {
        return JSON.parse(val) as FriendEntry;
      }
      return val as unknown as FriendEntry;
    });

    friends.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(friends);
  } catch (err) {
    console.error("Friends error:", err);
    return NextResponse.json([]);
  }
}
