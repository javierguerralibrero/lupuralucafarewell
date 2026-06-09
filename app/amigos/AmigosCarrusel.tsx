"use client";

import { useState, useEffect, useCallback } from "react";

interface FriendCard {
  name: string;
  slug: string;
  message: string;
  mediaUrls: string[];
}

interface Props {
  friends: FriendCard[];
}

export default function AmigosCarrusel({ friends }: Props) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  const go = useCallback((i: number) => {
    setFade(false);
    setPhotoIdx(0);
    setTimeout(() => { setIndex(i); setFade(true); }, 280);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go((index + 1) % friends.length);
      if (e.key === "ArrowLeft") go((index - 1 + friends.length) % friends.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, friends.length, go]);

  if (!friends.length) {
    return (
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <p style={{ color: "#444", fontStyle: "italic", fontFamily: "Georgia, serif", marginBottom: "28px" }}>
          El muro está esperando su primera felicitación.
        </p>
        <a href="/crear" style={{ display: "inline-block", background: "#e94560", color: "#fff", padding: "14px 36px", borderRadius: "4px", fontFamily: "Impact, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "1rem" }}>
          Crear mi despedida
        </a>
      </div>
    );
  }

  const friend = friends[index];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px 60px" }}>
      <style>{`
        .nav-btn { background: rgba(0,0,0,0.7); border: 1px solid #2a2a2a; color: #888; width: 48px; height: 48px; border-radius: 50%; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .nav-btn:hover { border-color: #e94560; color: #e94560; }
        .friend-dot { background: none; border: none; cursor: pointer; font-family: sans-serif; font-size: 0.75rem; padding: 4px 8px; transition: color 0.2s; }
        @keyframes kbzoom { from { transform: scale(1); } to { transform: scale(1.06); } }
      `}</style>

      {/* Card + arrows */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button className="nav-btn" onClick={() => go((index - 1 + friends.length) % friends.length)}>‹</button>

        <div style={{ flex: 1, opacity: fade ? 1 : 0, transition: "opacity 0.28s ease" }}>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", overflow: "hidden" }}>
            {/* Photos */}
            {friend.mediaUrls.length > 0 && (
              <div style={{ position: "relative", overflow: "hidden", background: "#000" }}>
                <img
                  key={`${index}-${photoIdx}`}
                  src={friend.mediaUrls[photoIdx]}
                  alt=""
                  style={{ width: "100%", maxHeight: "56vh", objectFit: "cover", display: "block", animation: "kbzoom 12s ease-out forwards" }}
                />
                {friend.mediaUrls.length > 1 && (
                  <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "7px" }}>
                    {friend.mediaUrls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        style={{ width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.3)" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            <div style={{ padding: "28px 32px 32px" }}>
              <p style={{ fontFamily: "Impact, sans-serif", fontSize: "1.5rem", letterSpacing: "0.1em", color: "#e94560", margin: "0 0 18px", textTransform: "uppercase" }}>
                {friend.name}
              </p>
              <p style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontStyle: "italic", color: "#ccc", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                "{friend.message}"
              </p>
            </div>
          </div>
        </div>

        <button className="nav-btn" onClick={() => go((index + 1) % friends.length)}>›</button>
      </div>

      {/* Counter */}
      <p style={{ textAlign: "center", color: "#333", fontSize: "0.72rem", fontFamily: "sans-serif", margin: "14px 0 8px" }}>
        {index + 1} / {friends.length} · ← → para navegar
      </p>

      {/* Name pills */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", marginTop: "8px" }}>
        {friends.map((f, i) => (
          <button
            key={i}
            className="friend-dot"
            onClick={() => go(i)}
            style={{ color: i === index ? "#e94560" : "#333" }}
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}
