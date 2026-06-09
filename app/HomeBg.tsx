"use client";

import { useState, useEffect } from "react";

// Two-layer crossfade: layer A and B alternate so there's never a black flash
export default function HomeBg({ urls }: { urls: string[] }) {
  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(1);
  const [showA, setShowA] = useState(true);
  const n = urls.length;

  useEffect(() => {
    if (n < 2) return;
    const interval = setInterval(() => {
      setShowA((prev) => {
        if (prev) {
          // A is visible → fade in B with next image, then A will be hidden
          setIndexB((b) => (b + 2) % n);
        } else {
          setIndexA((a) => (a + 2) % n);
        }
        return !prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [n]);

  if (!n) return null;

  const layerStyle = (img: string, opacity: number) => ({
    position: "fixed" as const,
    inset: 0,
    zIndex: 0,
    backgroundImage: `url(${img})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity,
    transition: "opacity 0.8s ease",
    pointerEvents: "none" as const,
  });

  return (
    <>
      <div style={layerStyle(urls[indexA], showA ? 0.15 : 0)} />
      <div style={layerStyle(urls[indexB], showA ? 0 : 0.15)} />
    </>
  );
}
