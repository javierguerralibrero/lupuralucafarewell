import { list, put } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";
import SlideshowPlayer from "./SlideshowPlayer";

export const maxDuration = 60;

interface FriendMeta {
  name: string;
  slug: string;
  message: string;
  mediaUrls: string[];
}

interface ManifestPhoto {
  folder: string;
  file: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Friend data (submitted pages)
// ---------------------------------------------------------------------------
async function getFriendData(client: Anthropic, currentFriendKey: string) {
  const { blobs: metaBlobs } = await list({ prefix: "meta/" });
  if (!metaBlobs.length) return { friends: [], captions: {} as Record<string, string> };

  const friends: FriendMeta[] = (
    await Promise.all(metaBlobs.map((b) => fetch(b.url).then((r) => r.json())))
  ).filter((f) => f?.name && f?.mediaUrls?.length > 0);

  if (!friends.length) return { friends: [], captions: {} as Record<string, string> };

  let captions: Record<string, string> = {};
  const { blobs: cacheBlobs } = await list({ prefix: "slideshow/captions.json" });
  if (cacheBlobs.length) {
    const cache = await fetch(cacheBlobs[0].url).then((r) => r.json());
    if (cache.friendSlugs === currentFriendKey) captions = cache.captions;
  }

  if (!Object.keys(captions).length) {
    const friendsList = friends
      .map((f) => `- ${f.name}: "${f.message || "A friend who loves you"}"`)
      .join("\n");

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are the narrator of a funny, warm farewell slideshow. Dan Lupu is a Romanian ultramarathon runner moving from Madrid to the French Riviera with his partner Raluca.

For each friend below, write ONE witty English caption (2-3 short sentences). Style: warm documentary narrator — a bit absurd, loving, with dry humor. Occasionally reference Dan's running obsession or the move to France.

Friends:
${friendsList}

Return ONLY valid JSON: { "Friend Name": "caption text", ... }`,
      }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    try {
      captions = JSON.parse(text.replace(/^```json?\n?/, "").replace(/\n?```$/, ""));
    } catch {
      friends.forEach((f) => { captions[f.name] = `${f.name} loves you both more than words.`; });
    }

    await put("slideshow/captions.json", JSON.stringify({ friendSlugs: currentFriendKey, captions }), {
      access: "public", contentType: "application/json", allowOverwrite: true,
    });
  }

  return { friends, captions };
}

// ---------------------------------------------------------------------------
// Madrid photos — all URLs for ambient background cycling
// ---------------------------------------------------------------------------
async function getMadridPhotoUrls(): Promise<string[]> {
  try {
    const { blobs: manifestBlobs } = await list({ prefix: "madrid-photos/manifest.json" });
    if (!manifestBlobs.length) return [];

    const manifest: { photos: ManifestPhoto[] } = await fetch(manifestBlobs[0].url).then((r) => r.json());
    if (!manifest?.photos?.length) return [];

    // Shuffle so each visit shows photos in different order
    const urls = manifest.photos.map((p) => p.url);
    for (let i = urls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [urls[i], urls[j]] = [urls[j], urls[i]];
    }
    return urls;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function SlideshowPage() {
  const client = new Anthropic();

  const { blobs: metaBlobs } = await list({ prefix: "meta/" }).catch(() => ({ blobs: [] }));
  const currentFriendKey = metaBlobs.map((b) => b.pathname.replace("meta/", "").replace(".json", "")).sort().join(",");

  const [{ friends, captions }, bgPhotoUrls] = await Promise.all([
    getFriendData(client, currentFriendKey),
    getMadridPhotoUrls(),
  ]);

  const friendData = friends.map((f) => ({
    friendName: f.name,
    photos: [...new Set(f.mediaUrls)],
    caption: captions[f.name] || `${f.name} loves you both.`,
  }));

  return <SlideshowPlayer friendData={friendData} bgPhotoUrls={bgPhotoUrls} />;
}
