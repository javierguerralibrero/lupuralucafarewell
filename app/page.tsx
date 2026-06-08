import Link from "next/link";

interface Friend {
  name: string;
  slug: string;
  createdAt: string;
}

async function getFriends(): Promise<Friend[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/friends`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const danJokes = [
  "Mama always said life is like a marathon — you never know what finish line you're gonna get.",
  "Mama always said moving to France is like a box of croissants — you never know which one's buttery enough.",
  "Mama always said you've got to put the past behind you before you can move forward… to the Côte d'Azur.",
  "Mama always said stupid is as stupid does — but moving to the French Riviera ain't stupid at all.",
];

const ralucaJokes = [
  "¡Fistro! ¡Nos vamos a Francia, pecador! ¡Cobarde de la calzada!",
  "¡No puedor creer! ¡Nos mudamos a la Costa Azul, jarl! ¡Qué nivel, macho!",
  "¡Amigo del señor! ¡Madrid nos querrá, pero Francia nos necesita, pecador!",
  "¡Fistro! ¡La gente de Madrid llora, pecador! ¡Hasta luego, maricón!",
];

const sizeClasses = ["text-2xl", "text-lg", "text-base", "text-xl", "text-sm", "text-2xl", "text-lg", "text-base"];

export default async function HomePage() {
  const friends = await getFriends();

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @keyframes jokeRotate {
          0%, 20% { opacity: 1; }
          25%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        .joke-0 { animation: jokeRotate 16s infinite 0s; }
        .joke-1 { animation: jokeRotate 16s infinite 4s; }
        .joke-2 { animation: jokeRotate 16s infinite 8s; }
        .joke-3 { animation: jokeRotate 16s infinite 12s; }

        .bubble {
          position: relative;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 16px;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-size: 0.85rem;
          line-height: 1.4;
          color: #ddd;
        }
        .bubble::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid #1a1a1a;
        }
        .joke-wrapper {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          opacity: 0;
        }
        .friend-tile {
          display: inline-block;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 12px 20px;
          transition: background 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .friend-tile:hover {
          background: #1a1a1a;
          border-color: #e94560;
          color: #e94560;
        }
      `}</style>

      {/* Header */}
      <header style={{ textAlign: "center", padding: "40px 20px 20px" }}>
        <p style={{ color: "#e94560", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
          lupuralucafarewell.com
        </p>
        <h1 style={{ fontFamily: "Impact, Arial Black, sans-serif", fontSize: "clamp(3rem, 10vw, 7rem)", letterSpacing: "0.05em", margin: 0, lineHeight: 1 }}>
          LUPU &amp; RALUCA
        </h1>
        <p style={{ color: "#f5c97a", fontSize: "1rem", marginTop: "12px", letterSpacing: "0.1em" }}>
          Madrid → Côte d'Azur · Junio 2026
        </p>
      </header>

      {/* Avatars */}
      <section style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", display: "flex", gap: "40px", justifyContent: "center", flexWrap: "wrap" }}>
        {/* Dan */}
        <div style={{ flex: "1", minWidth: "280px", maxWidth: "340px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div className="bubble" style={{ width: "100%", minHeight: "96px", position: "relative" }}>
            {danJokes.map((joke, i) => (
              <span key={i} className={`joke-wrapper joke-${i}`}>{joke}</span>
            ))}
          </div>
          <div style={{
            width: "100px", height: "100px", borderRadius: "50%",
            border: "3px solid #e94560",
            background: "#1a1a1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "3rem"
          }}>
            🏃‍♂️
          </div>
          <p style={{ fontFamily: "Impact, sans-serif", fontSize: "1.4rem", letterSpacing: "0.1em", color: "#fff", margin: 0 }}>DAN LUPU</p>
        </div>

        {/* Raluca */}
        <div style={{ flex: "1", minWidth: "280px", maxWidth: "340px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div className="bubble" style={{ width: "100%", minHeight: "96px", position: "relative" }}>
            {ralucaJokes.map((joke, i) => (
              <span key={i} className={`joke-wrapper joke-${i}`}>{joke}</span>
            ))}
          </div>
          <div style={{
            width: "100px", height: "100px", borderRadius: "50%",
            border: "3px solid #f5c97a",
            background: "#1a1a1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "3rem"
          }}>
            💃
          </div>
          <p style={{ fontFamily: "Impact, sans-serif", fontSize: "1.4rem", letterSpacing: "0.1em", color: "#fff", margin: 0 }}>RALUCA</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "40px 20px" }}>
        <p style={{ fontSize: "1.2rem", color: "#aaa", marginBottom: "20px" }}>
          ¿Quieres dejarles un mensaje?
        </p>
        <Link href="/crear" style={{
          display: "inline-block",
          background: "#e94560",
          color: "#fff",
          padding: "16px 40px",
          borderRadius: "4px",
          fontSize: "1.1rem",
          fontFamily: "Impact, sans-serif",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          transition: "background 0.2s"
        }}>
          CREAR MI DESPEDIDA
        </Link>
      </section>

      {/* Friends Wall */}
      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 20px 60px" }}>
        <h2 style={{ fontFamily: "Impact, sans-serif", fontSize: "1.5rem", letterSpacing: "0.15em", color: "#555", textAlign: "center", marginBottom: "30px", textTransform: "uppercase" }}>
          El Muro de los Amigos
        </h2>
        {friends.length === 0 ? (
          <p style={{ textAlign: "center", color: "#444", fontStyle: "italic" }}>
            Sé el primero en dejar tu mensaje — el muro está esperando.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {friends.map((friend, i) => (
              <Link key={friend.slug} href={`/${friend.slug}`} className="friend-tile">
                <span className={sizeClasses[i % sizeClasses.length]}>{friend.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
