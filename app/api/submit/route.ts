import { NextRequest, NextResponse } from "next/server";
import { put, del, list } from "@vercel/blob";
import { generateFriendPage } from "@/lib/claude";

export const maxDuration = 60;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const message = formData.get("message") as string;
    const instructions = formData.get("instructions") as string;
    const avatarPrompt = (formData.get("avatarPrompt") as string) || "";
    const files = formData.getAll("files") as File[];
    const existingMediaUrlsRaw = formData.get("existingMediaUrls") as string | null;
    const existingMediaUrls: string[] = existingMediaUrlsRaw ? JSON.parse(existingMediaUrlsRaw) : [];

    if (!name || !message) {
      return NextResponse.json({ error: "Nombre y mensaje son obligatorios" }, { status: 400 });
    }

    const slug = toSlug(name);
    if (!slug) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }

    // Upload all files to Vercel Blob, continuing index from existing files
    const mediaUrls: string[] = [];
    const validFiles = files.filter((f) => f && f.size > 0);
    const offset = existingMediaUrls.length;
    await Promise.all(
      validFiles.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop() || "bin";
        const blob = await put(`uploads/${slug}/file-${offset + i}.${ext}`, buffer, {
          access: "public",
          contentType: file.type,
          allowOverwrite: true,
        });
        mediaUrls[i] = blob.url;
      })
    );

    // Merge existing URLs with newly uploaded ones
    const allMediaUrls = [...existingMediaUrls, ...mediaUrls];

    // Generate HTML with Claude
    const html = await generateFriendPage(
      name,
      message,
      allMediaUrls,
      instructions || undefined,
      avatarPrompt || undefined,
      slug
    );

    // Store HTML and metadata
    const pageBlob = await put(`pages/${slug}.html`, html, {
      access: "public",
      contentType: "text/html",
      allowOverwrite: true,
    });

    const meta: Record<string, unknown> = {
      name,
      slug,
      createdAt: new Date().toISOString(),
      pageUrl: pageBlob.url,
      message,
      mediaUrls: allMediaUrls,
      instructions: instructions || "",
      ...(avatarPrompt ? { avatarPrompt, avatarStatus: "pending" } : {}),
    };
    await put(`meta/${slug}.json`, JSON.stringify(meta), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });

    // Fire-and-forget avatar generation if prompt was provided
    if (avatarPrompt) {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      fetch(`${baseUrl}/api/generate-avatars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch(() => {});
    }

    // Invalidate slideshow captions cache so it regenerates with the new friend
    const { blobs: cacheBlobs } = await list({ prefix: "slideshow/captions.json" });
    if (cacheBlobs.length) await del(cacheBlobs[0].url);

    return NextResponse.json({ slug });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Error generando la página. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
