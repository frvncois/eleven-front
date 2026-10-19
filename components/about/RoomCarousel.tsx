"use client";

import { useEffect, useRef, useState } from "react";
import { sound, type RoomHandle, type RoomPreset } from "@/lib/sound";

type Room = { room: string; photo: string; preset: string; audio: string | null; height: number };

const W = 622; // Figma card width
const GAP = 8;
const DRIFT = 28; // design px per second, right to left
const COPIES = 3; // enough sets to cover the screen while one wraps
const FRICTION = 0.92; // throw decay per frame after a drag or a swipe

/**
 * Rooms (Figma V2 · 09 · About, carousel-img, revisions Oct 19): an endless banner of the studio, one
 * view per space (max 5), 622 wide, mixed heights hanging from the top. It drifts slowly right to left
 * on its own; drag it or scroll sideways (trackpad swipe, shift + wheel) to move it, with a little
 * throw, and it loops forever. Vertical wheel still scrolls the page. Hovering a photo shows the
 * UNMUTE cursor tag; clicking turns the site's sound on and plays that space, clicking again mutes it.
 * Nothing plays on its own. Leaving the section stops the room. Reduced motion: no drift.
 */
export function RoomCarousel({ items }: { items: Room[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const handle = useRef<{ room: string; h: RoomHandle } | null>(null);
  const x = useRef(0);
  const throwV = useRef(0);
  const drag = useRef<{ x: number; last: number; t: number; moved: boolean } | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const set = items.length * (W + GAP);

  const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;

  const stop = () => {
    handle.current?.h.stop();
    handle.current = null;
    setPlaying(null);
  };

  const toggle = (r: Room) => {
    if (handle.current?.room === r.room) return stop();
    // The click is the deliberate "unmute" the cursor offers.
    sound.setMuted(false);
    sound.unlock();
    handle.current?.h.stop();
    const h = sound.ambience(r.preset as RoomPreset, r.audio);
    h.setNear(0.6);
    handle.current = { room: r.room, h };
    setPlaying(r.room);
  };

  // The loop: drift + throw, wrapped into one set's width so it never runs out.
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!drag.current) {
        x.current -= (still ? 0 : DRIFT * dt) + throwV.current;
        throwV.current *= FRICTION;
        if (Math.abs(throwV.current) < 0.01) throwV.current = 0;
      }
      x.current = ((x.current % set) - set) % set; // keep in (-set, 0]
      if (track.current) track.current.style.transform = `translate3d(${x.current}px, 0, 0)`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [set]);

  // Sideways wheel / trackpad swipe moves the banner; vertical wheel is left to the page.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      e.stopPropagation();
      x.current -= dx / scale();
    };
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  // Stop the room when the section leaves the screen, and on unmount.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && handle.current && stop(), { threshold: 0.2 });
    if (section.current) io.observe(section.current);
    return () => {
      io.disconnect();
      handle.current?.h.stop();
    };
  }, []);

  // Muting from the sound toggle mutes the room too; reflect it in the cursor.
  useEffect(() => sound.subscribe(() => sound.muted && handle.current && stop()), []);

  return (
    <section ref={section} className="overflow-hidden pt-margin pb-[120px] select-none">
      <div
        className="cursor-grab touch-pan-y px-margin active:cursor-grabbing"
        onPointerDown={(e) => {
          // Dragging the banner never starts a text selection or an image drag (Amélie, Oct 19).
          if (e.pointerType === "mouse") e.preventDefault();
          window.getSelection()?.removeAllRanges();
          drag.current = { x: e.clientX, last: e.clientX, t: performance.now(), moved: false };
          throwV.current = 0;
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (Math.abs(e.clientX - d.x) > 4 && !d.moved) {
            d.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          const step = (e.clientX - d.last) / scale();
          x.current += step;
          throwV.current = -step; // last step becomes the throw on release
          d.last = e.clientX;
        }}
        onDragStart={(e) => e.preventDefault()}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerCancel={() => (drag.current = null)}
      >
        <div ref={track} className="flex w-max items-start gap-2 will-change-transform">
          {Array.from({ length: COPIES }, (_, c) =>
            items.map((r) => (
              <button
                key={`${c}-${r.photo}`}
                type="button"
                tabIndex={c ? -1 : 0}
                aria-hidden={c ? true : undefined}
                aria-label={playing === r.room ? `Mute ${r.room}` : `Hear ${r.room}`}
                aria-pressed={playing === r.room}
                data-cursor={playing === r.room ? "mute" : "unmute"}
                data-sound="off"
                onClick={() => !drag.current?.moved && toggle(r)}
                className="relative block shrink-0 cursor-pointer overflow-hidden"
                style={{ width: W, height: r.height }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.photo} alt={c ? "" : r.room} draggable={false} className="block size-full object-cover" />
              </button>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
