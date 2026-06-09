import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
