"use client";

import { useRef, useState } from "react";

interface Props {
  prefix: string;
  count: number;
  borderColor: string;
}

export default function AvatarPlayer({ prefix, count, borderColor }: Props) {
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnded() {
    setCurrent((prev) => (prev + 1) % count);
  }

  return (
    <div style={{
      width: "100%",
      position: "relative",
      borderRadius: "12px",
      overflow: "hidden",
      border: `2px solid ${borderColor}`,
      background: "#111",
      aspectRatio: "9/16",
    }}>
      <video
        ref={videoRef}
        key={current}
        src={`/avatars/${prefix}_${current}.mp4`}
        autoPlay
        playsInline
        onEnded={handleEnded}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
