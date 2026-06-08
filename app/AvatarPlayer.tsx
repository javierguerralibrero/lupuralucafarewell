"use client";

import { useRef, useState } from "react";

interface Props {
  prefix: string;
  count: number;
  borderColor: string;
  circular?: boolean;
}

export default function AvatarPlayer({ prefix, count, borderColor, circular }: Props) {
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnded() {
    setCurrent((prev) => (prev + 1) % count);
  }

  if (circular) {
    return (
      <div style={{
        width: "100%",
        aspectRatio: "1",
        borderRadius: "50%",
        overflow: "hidden",
        border: `3px solid ${borderColor}`,
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
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", display: "block" }}
        />
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
