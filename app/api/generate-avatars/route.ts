import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@/lib/r2";
import { generateAvatarScripts } from "@/lib/claude";
import {
  DAN_ASSET_ID,
  RALUCA_ASSET_ID,
  DAN_VOICE_ID,
  RALUCA_VOICE_ID,
  submitHeyGenVideo,
  pollHeyGenVideo,
} from "@/lib/heygen";

export const maxDuration = 120;

async function readMeta(slug: string): Promise<Record<string, unknown> | null> {
  const { blobs } = await list({ prefix: `meta/${slug}` });
  if (!blobs.length) return null;
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  return res.json();
}

async function writeMeta(slug: string, meta: Record<string, unknown>) {
  await put(`meta/${slug}.json`, JSON.stringify(meta), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function POST(req: NextRequest) {
  let slug = "";
  let meta: Record<string, unknown> | null = null;

  try {
    const body = await req.json();
    slug = body.slug as string;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    meta = await readMeta(slug);
    if (!meta?.avatarPrompt) return NextResponse.json({ ok: true });

    // Generate in-character scripts with Claude
    const { danScript, ralucaScript } = await generateAvatarScripts(
      meta.name as string,
      meta.avatarPrompt as string
    );

    // Submit both HeyGen jobs in parallel
    const [danVideoId, ralucaVideoId] = await Promise.all([
      submitHeyGenVideo(DAN_ASSET_ID, danScript, DAN_VOICE_ID),
      submitHeyGenVideo(RALUCA_ASSET_ID, ralucaScript, RALUCA_VOICE_ID),
    ]);

    if (!danVideoId || !ralucaVideoId) {
      await writeMeta(slug, { ...meta, avatarStatus: "failed" });
      return NextResponse.json({ ok: false });
    }

    // Poll both until complete
    const [danDownloadUrl, ralucaDownloadUrl] = await Promise.all([
      pollHeyGenVideo(danVideoId),
      pollHeyGenVideo(ralucaVideoId),
    ]);

    if (!danDownloadUrl || !ralucaDownloadUrl) {
      await writeMeta(slug, { ...meta, avatarStatus: "failed" });
      return NextResponse.json({ ok: false });
    }

    // Download and store in Vercel Blob
    const [danBlob, ralucaBlob] = await Promise.all([
      fetch(danDownloadUrl)
        .then((r) => r.arrayBuffer())
        .then((buf) =>
          put(`avatars/${slug}/dan.mp4`, Buffer.from(buf), {
            access: "public",
            contentType: "video/mp4",
            allowOverwrite: true,
          })
        ),
      fetch(ralucaDownloadUrl)
        .then((r) => r.arrayBuffer())
        .then((buf) =>
          put(`avatars/${slug}/raluca.mp4`, Buffer.from(buf), {
            access: "public",
            contentType: "video/mp4",
            allowOverwrite: true,
          })
        ),
    ]);

    await writeMeta(slug, {
      ...meta,
      avatarStatus: "ready",
      danVideoUrl: danBlob.url,
      ralucaVideoUrl: ralucaBlob.url,
      danScript,
      ralucaScript,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("generate-avatars error:", err);
    if (slug && meta) {
      try {
        await writeMeta(slug, { ...meta, avatarStatus: "failed" });
      } catch {}
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
