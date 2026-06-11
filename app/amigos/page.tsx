import { list } from "@/lib/r2";
import AmigosCarrusel from "./AmigosCarrusel";

interface FriendMeta {
  name: string;
  slug: string;
  message: string;
  mediaUrls: string[];
}

async function getFriends(): Promise<FriendMeta[]> {
  try {
    const { blobs } = await list({ prefix: "meta/" });
    if (!blobs.length) return [];
    const friends: FriendMeta[] = await Promise.all(
      blobs.map((b) => fetch(b.url, { cache: "no-store" }).then((r) => r.json()))
    );
    return friends
      .filter((f) => f?.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export default async function AmigosPage() {
  const friends = await getFriends();

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <header style={{ textAlign: "center", padding: "32px 20px 16px" }}>
        <a href="/" style={{ color: "#444", fontSize: "0.75rem", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: "0.1em" }}>
          ← Home
        </a>
        <h1 style={{ fontFamily: "Impact, sans-serif", fontSize: "clamp(2rem,5vw,3rem)", letterSpacing: "0.1em", margin: "12px 0 4px", textTransform: "uppercase" }}>
          Felicitaciones
        </h1>
        <p style={{ color: "#444", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "sans-serif" }}>
          {friends.length} {friends.length === 1 ? "amigo" : "amigos"} han dejado su mensaje
        </p>
      </header>

      <AmigosCarrusel friends={friends} />
    </div>
  );
}
