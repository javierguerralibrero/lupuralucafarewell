const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!;
const BASE = "https://api.heygen.com";

export const DAN_ASSET_ID = "af38cb98784c41dfa404d9fc60f1d454";
export const RALUCA_ASSET_ID = "332096014c89414e8928efcf3f6d6922";
export const DAN_VOICE_ID = "31e2fd6e7c924bc9be987ac4cfaac5e8";
export const RALUCA_VOICE_ID = "e85822bd14e144e8b6fe73da2fb1085c";

export async function submitHeyGenVideo(
  assetId: string,
  script: string,
  voiceId: string
): Promise<string | null> {
  const res = await fetch(`${BASE}/v3/videos`, {
    method: "POST",
    headers: {
      "x-api-key": HEYGEN_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      type: "image",
      image: { type: "asset_id", asset_id: assetId },
      script,
      voice_id: voiceId,
      background_color: "#0a0a0a",
    }),
  });
  const data = await res.json();
  return data?.data?.video_id ?? null;
}

export async function pollHeyGenVideo(
  videoId: string,
  timeoutMs = 90000
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${BASE}/v3/videos/${videoId}`, {
      headers: { "x-api-key": HEYGEN_API_KEY, accept: "application/json" },
    });
    const data = await res.json();
    const status = data?.data?.status;
    if (status === "completed") return data.data.video_url as string;
    if (status === "failed" || status === "error") return null;
  }
  return null;
}
