import { NextResponse } from "next/server";
import { put } from "@/lib/r2";
import { readFile, readdir } from "fs/promises";
import { join, extname, basename } from "path";

// One-time endpoint — only works in local dev (vercel dev), not in production
const PHOTOS_DIR = "/Users/javierguerra-librero/LupuRaluca";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"]);

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const folders = await readdir(PHOTOS_DIR, { withFileTypes: true });
    const photoDirs = folders.filter((d) => d.isDirectory()).map((d) => d.name);

    const manifest: { folder: string; file: string; url: string }[] = [];
    let uploaded = 0;
    let failed = 0;

    for (const folder of photoDirs) {
      const folderPath = join(PHOTOS_DIR, folder);
      const files = (await readdir(folderPath)).filter((f) => IMAGE_EXTS.has(extname(f)));

      for (const file of files) {
        const filePath = join(folderPath, file);
        const ext = extname(file).toLowerCase().replace(".", "");
        const safeName = basename(file).replace(/[^a-zA-Z0-9._-]/g, "_");
        const safeFolder = folder.replace(/[^a-zA-Z0-9._-]/g, "_");
        const blobPath = `madrid-photos/${safeFolder}/${safeName}`;

        try {
          const buffer = await readFile(filePath);
          const contentType = ext === "png" ? "image/png" : "image/jpeg";
          const blob = await put(blobPath, buffer, {
            access: "public",
            contentType,
            allowOverwrite: true,
          });
          manifest.push({ folder, file, url: blob.url });
          uploaded++;
        } catch {
          failed++;
        }
      }
    }

    await put(
      "madrid-photos/manifest.json",
      JSON.stringify({ uploadedAt: new Date().toISOString(), total: manifest.length, photos: manifest }, null, 2),
      { access: "public", contentType: "application/json", allowOverwrite: true }
    );

    return NextResponse.json({ ok: true, uploaded, failed, total: manifest.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
