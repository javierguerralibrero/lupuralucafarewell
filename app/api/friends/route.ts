import { NextResponse } from "next/server";
import { list } from "@/lib/r2";

interface FriendEntry {
  name: string;
  slug: string;
  createdAt: string;
  pageUrl: string;
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "meta/" });

    const friends: FriendEntry[] = await Promise.all(
      blobs.map(async (blob) => {
        const res = await fetch(blob.url);
        return res.json() as Promise<FriendEntry>;
      })
    );

    friends.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(friends);
  } catch (err) {
    console.error("Friends error:", err);
    return NextResponse.json([]);
  }
}
