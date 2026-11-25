"use client";

import { useEffect, useRef } from "react";
import { sound } from "@/lib/sound";

/**
 * Media/Reel: the full-screen reel. On the sound bus, so the gate, mute and overlays control it.
 * It plays under the gate (a band of it shows below the panel) and keeps playing as the gate swings away: no
 * restart, so opening the gate reads as one continuous shot.
 */
export function HomeReel({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // React does not serialize `muted`; force it so autoplay is allowed before the gate unlocks audio.
    el.muted = true;
    const off = sound.registerMedia(el);
    el.play().catch(() => {});
    return off;
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      loop
      playsInline
      preload="auto"
      className="absolute inset-0 size-full object-cover"
    />
  );
}
