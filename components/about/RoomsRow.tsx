"use client";

import { useRef } from "react";
import { sound } from "@/lib/sound";

type Room = { name: string; src: string; width: number; tone: number };

/**
 * "Hear the rooms" (Figma 7398:4986, Media/Room 7356:5108): a horizontal row that bleeds off the
 * right edge. Hold and drag to move through it (cursor tag "hold"); hovering a room plays its sound.
 * Wheel/trackpad scrolling sideways works too.
 */
export function RoomsRow({ rooms }: { rooms: Room[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;

  return (
    <div
      ref={ref}
      data-cursor="hold"
      data-lenis-prevent
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, left: ref.current!.scrollLeft };
        ref.current!.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        ref.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x) / scale();
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      className="flex h-full w-[1440px] cursor-grab touch-pan-x items-center gap-4 overflow-x-auto overflow-y-hidden select-none active:cursor-grabbing [scrollbar-width:none]"
    >
      {rooms.map((r) => (
        <div
          key={r.name}
          onPointerEnter={() => sound.cue("step")}
          className="relative h-full shrink-0"
          style={{ width: r.width }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.src} alt={r.name} draggable={false} className="absolute inset-0 size-full object-cover" />
        </div>
      ))}
    </div>
  );
}
