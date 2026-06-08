"use client";

import { useRef, useState } from "react";

interface Props {
  prefix: string;
  count: number;
  borderColor: string;
  circular?: boolean;
  startIndex?: number;
}

export default function AvatarPlayer({ prefix, count, borderColor, circular, startIndex = 0 }: Props) {
  const [current, setCurrent] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnded() {
    setCurrent((prev) => startIndex + (prev - startIndex + 1) % count);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) v.play();
    setMuted(next);
  }

  if (circular) {
    return (
      <div
        onClick={toggleMute}
        style={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${borderColor}`,
          background: "#111",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <video
          ref={videoRef}
          key={current}
          src={`/avatars/${prefix}_${current}.mp4`}
          autoPlay
          muted
          playsInline
          onEnded={handleEnded}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", display: "block" }}
        />
        <div style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          background: "rgba(0,0,0,0.55)",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          pointerEvents: "none",
        }}>
          {muted ? "🔇" : "🔊"}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      position: "relative",
      borderRadius: "12px",
      overflow: "hidden",
      border: `2px solid ${borderColor}`,
      background: "#111",
    }}>
      <video
        ref={videoRef}
        key={current}
        src={`/avatars/${prefix}_${current}.mp4`}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}
