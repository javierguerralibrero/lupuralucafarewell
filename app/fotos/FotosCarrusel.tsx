"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Props {
  photos: string[];
}

const TRANSITIONS = [
  { name: "tr-fade",        dur: 1000 },
  { name: "tr-slide-left",  dur: 800  },
  { name: "tr-slide-right", dur: 800  },
  { name: "tr-slide-up",    dur: 800  },
  { name: "tr-zoom-in",     dur: 900  },
  { name: "tr-zoom-out",    dur: 900  },
  { name: "tr-kb-left",     dur: 7000 },
  { name: "tr-kb-right",    dur: 7000 },
  { name: "tr-kb-up",       dur: 7000 },
] as const;

type TrName = (typeof TRANSITIONS)[number]["name"];

function pick(): (typeof TRANSITIONS)[number] {
  return TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
}

// speed slider: 1 (fast, 1.5s) to 5 (slow, 10s)
const SPEED_MS = [1500, 3000, 5000, 7000, 10000];

const LS_KEY = "fotos-position";

export default function FotosCarrusel({ photos }: Props) {
  const [cur,  setCur]  = useState(() => {
    try { const s = localStorage.getItem(LS_KEY); return s ? Math.min(Number(s), photos.length - 1) : 0; } catch { return 0; }
  });
  const [prev, setPrev] = useState<number | null>(null);
  const [tr,   setTr]   = useState<TrName>("tr-fade");
  const [trDur, setTrDur] = useState(1000);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(2); // index into SPEED_MS, default 5s
  const autoMs = SPEED_MS[speed];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((next: number) => {
    const chosen = pick();
    setCur(c  => { setPrev(c); return next; });
    setTr(chosen.name);
    setTrDur(chosen.dur);
  }, []);

  // persist position
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(cur)); } catch {}
  }, [cur]);

  // auto-advance
  useEffect(() => {
    if (!playing || photos.length < 2) return;
    timerRef.current = setTimeout(() => go((cur + 1) % photos.length), autoMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cur, playing, photos.length, go, autoMs]);

  // keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go((cur + 1) % photos.length);
      if (e.key === "ArrowLeft")  go((cur - 1 + photos.length) % photos.length);
      if (e.key === " ")          { setPlaying(p => !p); e.preventDefault(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [cur, photos.length, go]);

  if (!photos.length) return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#444" }}>No hay fotos todavía.</p>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>
      <style>{`
        /* layers */
        .fl { position: absolute; inset: 0; }
        .fl img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* entering */
        .fl-enter { animation-name: var(--tr); animation-duration: var(--dur); animation-timing-function: ease-out; animation-fill-mode: both; z-index: 2; }

        /* exiting */
        .fl-exit  { animation: fl-fadeout 0.7s ease-out both; z-index: 1; }
        @keyframes fl-fadeout { to { opacity: 0; } }

        /* transition keyframes */
        @keyframes tr-fade        { from { opacity: 0; }                                    to { opacity: 1; } }
        @keyframes tr-slide-left  { from { opacity: 0; transform: translateX(5%); }         to { opacity: 1; transform: translateX(0); } }
        @keyframes tr-slide-right { from { opacity: 0; transform: translateX(-5%); }        to { opacity: 1; transform: translateX(0); } }
        @keyframes tr-slide-up    { from { opacity: 0; transform: translateY(4%); }         to { opacity: 1; transform: translateY(0); } }
        @keyframes tr-zoom-in     { from { opacity: 0; transform: scale(1.1); }             to { opacity: 1; transform: scale(1); } }
        @keyframes tr-zoom-out    { from { opacity: 0; transform: scale(0.92); }            to { opacity: 1; transform: scale(1); } }
        @keyframes tr-kb-left     { from { transform: scale(1.15) translate(3%, 1%); }      to { transform: scale(1)    translate(0, 0); } }
        @keyframes tr-kb-right    { from { transform: scale(1.15) translate(-3%, 1%); }     to { transform: scale(1)    translate(0, 0); } }
        @keyframes tr-kb-up       { from { transform: scale(1.15) translate(0, 3%); }       to { transform: scale(1)    translate(0, 0); } }

        /* nav buttons */
        .fbn { position: absolute; top: 50%; transform: translateY(-50%); z-index: 20; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); width: 52px; height: 52px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .fbn:hover { background: rgba(0,0,0,0.7); border-color: #e94560; color: #e94560; }

        /* progress bar */
        @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .fprog { transform-origin: left; animation: progress ${autoMs}ms linear; }
      `}</style>

      {/* exiting layer */}
      {prev !== null && prev !== cur && (
        <div className="fl fl-exit" key={`e-${prev}`}>
          <img src={photos[prev]} alt="" />
        </div>
      )}

      {/* entering layer */}
      <div
        className="fl fl-enter"
        key={`c-${cur}`}
        style={{ "--tr": tr, "--dur": `${trDur}ms` } as React.CSSProperties}
      >
        <img src={photos[cur]} alt="" />
      </div>

      {/* dark gradient overlay at bottom for controls legibility */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.35) 100%)", zIndex: 5, pointerEvents: "none" }} />

      {/* progress bar */}
      {playing && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.08)", zIndex: 20 }}>
          <div key={cur} className="fprog" style={{ height: "100%", background: "rgba(255,255,255,0.4)" }} />
        </div>
      )}

      {/* top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
        <a href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", fontFamily: "sans-serif", textDecoration: "none", letterSpacing: "0.12em" }}>
          ← Home
        </a>
        <span style={{ fontFamily: "Impact, sans-serif", fontSize: "0.9rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
          Fotos · Madrid
        </span>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", fontFamily: "sans-serif" }}>
          {cur + 1} / {photos.length}
        </span>
      </div>

      {/* left arrow */}
      <button
        className="fbn"
        style={{ left: "16px" }}
        onClick={() => go((cur - 1 + photos.length) % photos.length)}
      >‹</button>

      {/* right arrow */}
      <button
        className="fbn"
        style={{ right: "16px" }}
        onClick={() => go((cur + 1) % photos.length)}
      >›</button>

      {/* bottom controls */}
      <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={() => setPlaying(p => !p)}
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", borderRadius: "24px", padding: "6px 20px", fontSize: "0.78rem", cursor: "pointer", fontFamily: "sans-serif", letterSpacing: "0.08em" }}
        >
          {playing ? "⏸ Pausa" : "▶ Play"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "6px 14px" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontFamily: "sans-serif" }}>🐢</span>
          <input
            type="range" min={0} max={4} step={1} value={4 - speed}
            onChange={e => setSpeed(4 - Number(e.target.value))}
            style={{ width: "72px", accentColor: "#e94560", cursor: "pointer" }}
          />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontFamily: "sans-serif" }}>🐇</span>
        </div>
      </div>
    </div>
  );
}
