import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm", "video/mov"];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { key, contentType } = await request.json();
    if (!key || !contentType) {
      return NextResponse.json({ error: "key and contentType required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Content type not allowed" }, { status: 400 });
    }
    const url = await getPresignedUploadUrl(key, contentType);
    return NextResponse.json({ url, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
