"use client";

import { useEffect, useRef } from "react";
import { sound } from "@/lib/sound";

/** Media/Reel: the full-screen reel. On the sound bus, so the gate, mute and overlays control it. */
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
      muted
      preload="auto"
      className="absolute inset-0 size-full object-cover"
    />
  );
}
