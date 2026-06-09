import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface FriendMeta {
  name: string;
  slug: string;
  message: string;
  mediaUrls: string[];
}

interface CaptionsCache {
  friendSlugs: string;
  captions: Record<string, string>;
}

export async function GET() {
  try {
    const { blobs: metaBlobs } = await list({ prefix: "meta/" });
    if (!metaBlobs.length) return NextResponse.json({ slides: [] });

    const friends: FriendMeta[] = (
      await Promise.all(metaBlobs.map((b) => fetch(b.url).then((r) => r.json())))
    ).filter((f) => f?.name && f?.mediaUrls?.length > 0);

    if (!friends.length) return NextResponse.json({ slides: [] });

    const currentKey = friends
      .map((f) => f.slug)
      .sort()
      .join(",");

    // Try cache
    let captions: Record<string, string> = {};
    const { blobs: cacheBlobs } = await list({ prefix: "slideshow/captions.json" });
    if (cacheBlobs.length) {
      const cache: CaptionsCache = await fetch(cacheBlobs[0].url).then((r) => r.json());
      if (cache.friendSlugs === currentKey) captions = cache.captions;
    }

    // Generate if cache miss
    if (!Object.keys(captions).length) {
      const client = new Anthropic();
      const friendsList = friends
        .map((f) => `- ${f.name}: "${f.message || "A friend who loves you"}"`)
        .join("\n");

      const res = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are the narrator of a funny, warm farewell slideshow. Dan Lupu is a Romanian ultramarathon runner moving from Madrid to the French Riviera with his partner Raluca.

For each friend below, write ONE witty English caption (2-3 short sentences). Style: warm documentary narrator — a bit absurd, loving, with dry humor. Occasionally reference Dan's running obsession or the move to France.

Friends:
${friendsList}

Return ONLY valid JSON: { "Friend Name": "caption text", ... }`,
          },
        ],
      });

      const text = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      try {
        const cleaned = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        captions = JSON.parse(cleaned);
      } catch {
        friends.forEach((f) => {
          captions[f.name] = `${f.name} loves you both more than words can express.`;
        });
      }

      await put(
        "slideshow/captions.json",
        JSON.stringify({ friendSlugs: currentKey, captions }),
        { access: "public", contentType: "application/json", allowOverwrite: true }
      );
    }

    const slides = friends.map((f) => ({
      friendName: f.name,
      photos: [...new Set(f.mediaUrls)], // deduplicate
      caption: captions[f.name] || `${f.name} loves you both.`,
    }));

    return NextResponse.json({ slides });
  } catch (err) {
    console.error("Slideshow data error:", err);
    return NextResponse.json({ slides: [] });
  }
}
