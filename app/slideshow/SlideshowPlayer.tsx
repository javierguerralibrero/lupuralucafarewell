"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface FriendSlide {
  friendName: string;
  photos: string[];
  caption: string;
}

interface Props {
  friendData: FriendSlide[];
  bgPhotoUrls?: string[];
}

type Slide =
  | { type: "text"; text: string; subtext?: string; emoji?: string }
  | { type: "photo"; url: string; label: string; caption: string; kenDir?: "left" | "right" | "up" };

const INTRO: Slide[] = [
  { type: "text", text: "This is a story", subtext: "about two people who decided\nMadrid wasn't enough.", emoji: "🏙️" },
  { type: "text", text: "Dan", subtext: "Who runs ultramarathons. For fun.\nHundreds of kilometres. For fun.", emoji: "🏃‍♂️" },
  { type: "text", text: "And Raluca", subtext: "Who somehow loves him anyway.", emoji: "❤️" },
  { type: "text", text: "They're leaving.", subtext: "For the French Riviera.\nThe absolute legends.", emoji: "🌊" },
];

const MADRID_INTRO: Slide[] = [
  { type: "text", text: "Before the goodbye...", subtext: "A few moments we couldn't forget." },
  { type: "text", text: "Your years in Madrid.", subtext: "The dinners. The miles. The people.\nThe life you built here.", emoji: "🇪🇸" },
];

const FRIENDS_INTRO: Slide[] = [
  { type: "text", text: "And then there were your people.", subtext: "Who had a few things\nthey wanted to say.", emoji: "🎤" },
];

const OUTRO: Slide[] = [
  { type: "text", text: "Dan & Raluca", emoji: "🇫🇷" },
  { type: "text", text: "We love you", subtext: "More than words, more than miles,\nmore than a very dramatic farewell speech." },
  { type: "text", text: "We'll miss you every single day", emoji: "🥹" },
  { type: "text", text: "Dan", subtext: "May every road lead to the sea 🌊\nAnd may the sea be worth the run.", emoji: "🏃‍♂️" },
  { type: "text", text: "Raluca", subtext: "May the French learn your name.\nOn the first try.", emoji: "😅" },
  { type: "text", text: "Until Thanksgiving", subtext: "In France. Yes, we're coming.\nYou literally cannot stop us.", emoji: "🍂🇫🇷" },
  { type: "text", text: "Cu drag,", subtext: "Your Madrid family ❤️" },
];

const KEN_DIRS: Array<"left" | "right" | "up"> = ["left", "right", "up"];

function buildSlides(friendData: FriendSlide[]): Slide[] {
  const friendSlides: Slide[] = friendData.flatMap((f) =>
    f.photos.map((url, i) => ({
      type: "photo" as const,
      url,
      label: f.friendName,
      caption: f.caption,
      kenDir: KEN_DIRS[i % KEN_DIRS.length],
    }))
  );

  const hasFriends = friendSlides.length > 0;

  return [
    ...INTRO,
    ...MADRID_INTRO,
    ...(hasFriends ? [...FRIENDS_INTRO, ...friendSlides] : []),
    ...OUTRO,
  ];
}

const MUSIC_URL = process.env.NEXT_PUBLIC_SLIDESHOW_MUSIC_URL || "";

export default function SlideshowPlayer({ friendData, bgPhotoUrls = [] }: Props) {
  const [slides] = useState(() => buildSlides(friendData));
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [started, setStarted] = useState(false);
  const [kenKey, setKenKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ambient background cycling (all Madrid photos)
  const [bgIndex, setBgIndex] = useState(0);
  const [bgVisible, setBgVisible] = useState(true);

  useEffect(() => {
    if (!bgPhotoUrls.length) return;
    const interval = setInterval(() => {
      setBgVisible(false);
      setTimeout(() => {
        setBgIndex((i) => (i + 1) % bgPhotoUrls.length);
        setBgVisible(true);
      }, 1200);
    }, 5000);
    return () => clearInterval(interval);
  }, [bgPhotoUrls.length]);

  const goTo = useCallback((index: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(index);
      setKenKey((k) => k + 1);
      setFade(true);
    }, 600);
  }, []);

  useEffect(() => {
    if (!started) return;
    const slide = slides[current];
    const duration = slide.type === "photo" ? 7000 : 5000;
    timerRef.current = setTimeout(() => {
      goTo((current + 1) % slides.length);
    }, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, started, slides, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo((current + 1) % slides.length);
      if (e.key === "ArrowLeft") goTo((current - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, slides.length, goTo]);

  const slide = slides[current];

  if (!started) {
    return (
      <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px", position: "relative", overflow: "hidden" }}>
        {/* Ambient background on start screen too */}
        {bgPhotoUrls.length > 0 && (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${bgPhotoUrls[bgIndex]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: bgVisible ? 0.15 : 0,
            transition: "opacity 1.2s ease",
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <p style={{ color: "#555", fontSize: "0.85rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "24px", fontFamily: "sans-serif" }}>
            Dan & Raluca · Madrid → Côte d'Azur
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem,6vw,4rem)", color: "#fff", fontWeight: 300, marginBottom: "12px" }}>
            A Farewell
          </h1>
          <p style={{ color: "#555", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.1rem" }}>
            {bgPhotoUrls.length} moments · {friendData.length} friends
          </p>
        </div>
        <button
          onClick={() => { setStarted(true); audioRef.current?.play().catch(() => {}); }}
          style={{ position: "relative", zIndex: 1, background: "none", border: "1px solid #555", borderRadius: "40px", padding: "14px 40px", color: "#aaa", fontSize: "1rem", fontFamily: "sans-serif", cursor: "pointer", letterSpacing: "0.1em", transition: "all 0.3s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#555"; (e.currentTarget as HTMLButtonElement).style.color = "#aaa"; }}
        >
          ▶ Play
        </button>
        <p style={{ position: "relative", zIndex: 1, color: "#333", fontSize: "0.75rem", fontFamily: "sans-serif" }}>← → arrow keys to navigate</p>
        {MUSIC_URL && <audio ref={audioRef} src={MUSIC_URL} loop style={{ display: "none" }} />}
      </div>
    );
  }

  const kenAnim = slide.type === "photo" && slide.kenDir === "right"
    ? "kenburns-right"
    : slide.type === "photo" && slide.kenDir === "up"
    ? "kenburns-up"
    : "kenburns-left";

  const isPhotoSlide = slide.type === "photo";

  return (
    <div
      style={{ background: "#000", minHeight: "100vh", position: "relative", overflow: "hidden", cursor: "pointer" }}
      onClick={() => goTo((current + 1) % slides.length)}
    >
      {MUSIC_URL && <audio ref={audioRef} src={MUSIC_URL} loop style={{ display: "none" }} />}

      {/* Ambient background — all 206 Madrid photos cycling */}
      {bgPhotoUrls.length > 0 && (
        <div style={{
          position: "fixed", inset: 0,
          backgroundImage: `url(${bgPhotoUrls[bgIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: bgVisible ? 0.18 : 0,
          transition: "opacity 1.2s ease",
          zIndex: 0,
        }} />
      )}

      {/* Friend photo (full-screen, on top of ambient) */}
      {isPhotoSlide && (
        <div
          key={kenKey}
          style={{
            position: "fixed", inset: 0,
            backgroundImage: `url(${(slide as Extract<typeof slide, { type: "photo" }>).url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            animation: `${kenAnim} 9s ease-out forwards`,
            zIndex: 1,
          }}
        />
      )}

      {/* Overlay — darker for text slides, gradient for photo slides */}
      <div style={{
        position: "fixed", inset: 0,
        background: isPhotoSlide
          ? "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.3) 100%)"
          : "rgba(0,0,0,0.72)",
        zIndex: 2,
      }} />

      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", gap: "3px", padding: "10px 14px" }}>
        {slides.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "2px",
              background: i < current ? "rgba(255,255,255,0.7)" : i === current ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)",
              borderRadius: "2px",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>

      {/* Back to wall */}
      <a
        href="/"
        style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 100, color: "#333", fontSize: "0.75rem", fontFamily: "sans-serif", textDecoration: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        ← Muro
      </a>

      {/* Counter */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 100, color: "#333", fontSize: "0.75rem", fontFamily: "sans-serif" }}>
        {current + 1} / {slides.length}
      </div>

      {/* Slide content */}
      <div style={{ opacity: fade ? 1 : 0, transition: "opacity 0.6s ease", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10 }}>
        {isPhotoSlide ? (
          <div style={{ textAlign: "center", padding: "0 32px", maxWidth: "700px", marginTop: "auto", paddingBottom: "80px" }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: "10px" }}>
              {(slide as Extract<typeof slide, { type: "photo" }>).label}
            </p>
            <p style={{ color: "#fff", fontFamily: "Georgia, serif", fontSize: "clamp(1rem,3vw,1.35rem)", fontStyle: "italic", lineHeight: 1.65, fontWeight: 300 }}>
              "{(slide as Extract<typeof slide, { type: "photo" }>).caption}"
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "0 40px", maxWidth: "700px" }}>
            {(slide as Extract<typeof slide, { type: "text" }>).emoji && (
              <p style={{ fontSize: "clamp(2rem,6vw,3.5rem)", marginBottom: "20px" }}>
                {(slide as Extract<typeof slide, { type: "text" }>).emoji}
              </p>
            )}
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem,7vw,5rem)", color: "#fff", fontWeight: 300, lineHeight: 1.2, marginBottom: (slide as Extract<typeof slide, { type: "text" }>).subtext ? "24px" : 0 }}>
              {(slide as Extract<typeof slide, { type: "text" }>).text}
            </h2>
            {(slide as Extract<typeof slide, { type: "text" }>).subtext && (
              <p style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "clamp(1rem,3vw,1.25rem)", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {(slide as Extract<typeof slide, { type: "text" }>).subtext}
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes kenburns-left {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.13) translate(-2.5%, -1%); }
        }
        @keyframes kenburns-right {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.13) translate(2.5%, -1%); }
        }
        @keyframes kenburns-up {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.13) translate(0%, -2.5%); }
        }
      `}</style>
    </div>
  );
}
