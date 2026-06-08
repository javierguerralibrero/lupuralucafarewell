import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { generateFriendPage } from "@/lib/claude";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove accents
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
    const file = formData.get("file") as File | null;

    if (!name || !message) {
      return NextResponse.json({ error: "Nombre y mensaje son obligatorios" }, { status: 400 });
    }

    const slug = toSlug(name);

    if (!slug) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }

    // Upload file to Vercel Blob if provided
    let fileUrl: string | undefined;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "bin";
      const blob = await put(`uploads/${slug}/file.${ext}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      fileUrl = blob.url;
    }

    // Generate HTML with Claude
    const html = await generateFriendPage(name, message, fileUrl);

    // Store HTML in Vercel Blob
    const pageBlob = await put(`pages/${slug}.html`, html, {
      access: "public",
      contentType: "text/html",
    });

    // Store metadata in KV
    await kv.hset("friends", {
      [slug]: JSON.stringify({
        name,
        slug,
        createdAt: new Date().toISOString(),
        pageUrl: pageBlob.url,
      }),
    });

    return NextResponse.json({ slug });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Error generando la página. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
