"use client";

import { useEffect, useRef, useState } from "react";
import { sound, type RoomHandle, type RoomPreset } from "@/lib/sound";
import { usePhone, appScale } from "@/lib/device";
import { prefersReducedMotion } from "@/lib/motion";
import { lerpQuad, quadVisible, rectToQuadCss, taperField, type Quad } from "@/lib/perspective";

type Room = { room: string; photo: string; preset: string; audio: string | null; height: number };

const W = 610; // 4 columns of the 9-col grid
const GAP = 16; // the grid gutter
const DATA_W = 622; // card width the heights in about.json were measured at
const DRIFT = 28; // design px per second, right to left
const COPIES = 3; // enough sets to cover the screen while one wraps
const FRICTION = 0.92; // throw decay per frame after a drag or a swipe
// Phone: the rooms stay big, 390/1440 × 1.6 of the desktop size, 8 apart.
const PHONE_W = Math.round(W * (390 / 1440) * 1.6);
const PHONE_GAP = 8;
// Warp: the mixer carousel's bend. Flat at rest and while drifting; speed (drag,
// throw, sideways swipe) bends the banner into the ELEVEN wordmark taper, the vanishing point on the side it heads to.
// Phone: the phone mixer strip's gentler values (MixerMobile), over the 390 screen (Oct 23, it was flat on the phone).
const WARP = { depth: 1, grow: 1.2, full: 22, bendIn: 0.12, bendOut: 0.05 };
const PHONE_WARP = { depth: 1, grow: 1.3, full: 18, bendIn: 0.12, bendOut: 0.05 };

/**
 * Rooms: an endless banner of the studio, one
 * view per space (max 5), 4 cols (610) wide with a 16 gutter, mixed heights hanging from the top. It drifts slowly right to left
 * on its own; drag it or scroll sideways (trackpad swipe, shift + wheel) to move it, with a little
 * throw, and it loops forever. Vertical wheel still scrolls the page. Hovering a photo shows the
 * UNMUTE cursor tag; clicking turns the site's sound on and plays that space, clicking again mutes it.
 * Nothing plays on its own. Leaving the section stops the room. Reduced motion: no drift.
 * Phone: 264 wide, a finger drags it; each room has a small pink sound tag bottom left (muted speaker / playing waves).
 * Tapping a room brings it to the middle of the screen and plays it; the banner holds still while it plays.
 * Moving it fast bends it like the mixer carousel (WARP, PHONE_WARP on the phone); each room sits on its own matrix3d.
 */
export function RoomCarousel({ items }: { items: Room[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const handle = useRef<{ room: string; h: RoomHandle } | null>(null);
  const x = useRef(0);
  const throwV = useRef(0);
  const drag = useRef<{ x: number; last: number; t: number; moved: boolean } | null>(null);
  // Phone: the banner offset that brings the room just played to the middle of the screen (eased by the loop).
  const centre = useRef<number | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const phone = usePhone();
  const w = phone ? PHONE_W : W;
  const set = items.length * (w + (phone ? PHONE_GAP : GAP));
  const heights = items.map((r) => (r.height * w) / DATA_W);
  const tallest = Math.max(...heights);


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
    const still = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    // Warp: each card's flat spot on the stage (track x = stage x), bent by the banner's speed.
    const bend = phone ? PHONE_WARP : WARP;
    const screen = phone ? 390 : 1440;
    const margin = phone ? 16 : 24;
    const fieldOpts = { midY: tallest / 2, hLeft: tallest * bend.grow, depth: bend.depth, width: screen };
    const fwd = taperField(fieldOpts);
    const back = taperField({ ...fieldOpts, mirror: true });
    const warp = { amount: 0, dir: 1 };
    const pitch = w + (phone ? PHONE_GAP : GAP);
    let prev = x.current;
    const place = () => {
      for (let k = 0; k < cards.current.length; k++) {
        const el = cards.current[k];
        if (!el) continue;
        const h = heights[k % items.length];
        const x0 = margin + x.current + k * pitch;
        const x1 = x0 + w;
        if (warp.amount === 0) {
          el.style.visibility = x1 < -40 || x0 > screen + 40 ? "hidden" : "visible";
          el.style.transform = `translate3d(${x0}px, 0, 0)`;
          continue;
        }
        // The card hangs from the top: its share of the field's height, from v 0 down to v = h / tallest.
        const vb = h / tallest;
        const sub = (f: typeof fwd): Quad => [f.at(x0, 0), f.at(x1, 0), f.at(x1, vb), f.at(x0, vb)];
        const flat: Quad = [[x0, 0], [x1, 0], [x1, h], [x0, h]];
        const q = lerpQuad(flat, lerpQuad(sub(back), sub(fwd), (warp.dir + 1) / 2), warp.amount);
        if (!quadVisible(q)) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        el.style.transform = rectToQuadCss(w, h, q);
      }
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!drag.current) {
        if (centre.current !== null) {
          x.current += (centre.current - x.current) * 0.12;
          if (Math.abs(centre.current - x.current) < 0.5) {
            x.current = centre.current;
            centre.current = null;
          }
        } else {
          // While a room plays the banner holds still, so the room stays in the middle.
          x.current -= (still || handle.current ? 0 : DRIFT * dt) + throwV.current;
          throwV.current *= FRICTION;
          if (Math.abs(throwV.current) < 0.01) throwV.current = 0;
        }
      }
      // Speed in stage px per frame, positive heading left (measured before the wrap's jump).
      const speed = prev - x.current;
      const wrapped = ((x.current % set) - set) % set; // keep in (-set, 0]
      if (centre.current !== null) centre.current += wrapped - x.current;
      x.current = wrapped;
      prev = wrapped;
      // The slow drift (~0.5 px a frame) stays flat: only a drag, throw or swipe bends it.
      const target = still || Math.abs(speed) < 1.5 ? 0 : Math.min(1, Math.abs(speed) / bend.full);
      warp.amount += (target - warp.amount) * (target > warp.amount ? bend.bendIn : bend.bendOut);
      if (warp.amount < 0.002) warp.amount = 0;
      if (Math.abs(speed) > 0.8) warp.dir += (Math.sign(speed) - warp.dir) * 0.08;
      place();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- heights follow items + w, already covered by set
  }, [set, phone, tallest]);

  // Sideways wheel / trackpad swipe moves the banner; vertical wheel is left to the page.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      e.stopPropagation();
      x.current -= dx / appScale();
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
    // overflow-x-clip, not hidden: the bent near side may rise above the banner's top.
    <section ref={section} className="overflow-x-clip pt-margin pb-[120px] select-none">
      <div
        className="cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={(e) => {
          // Dragging the banner never starts a text selection or an image drag.
          if (e.pointerType === "mouse") e.preventDefault();
          window.getSelection()?.removeAllRanges();
          drag.current = { x: e.clientX, last: e.clientX, t: performance.now(), moved: false };
          throwV.current = 0;
          centre.current = null;
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (Math.abs(e.clientX - d.x) > 4 && !d.moved) {
            d.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          const step = (e.clientX - d.last) / appScale();
          x.current += step;
          throwV.current = -step; // last step becomes the throw on release
          d.last = e.clientX;
        }}
        onDragStart={(e) => e.preventDefault()}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* Each room placed on its own (Warp), on both devices; the row only holds the height. */}
        <div ref={track} className="relative" style={{ height: tallest }}>
          {Array.from({ length: COPIES }, (_, c) =>
            items.map((r) => (
              <button
                key={`${c}-${r.photo}`}
                ref={(el) => {
                  cards.current[c * items.length + items.indexOf(r)] = el;
                }}
                type="button"
                tabIndex={c ? -1 : 0}
                aria-hidden={c ? true : undefined}
                aria-label={playing === r.room ? `Mute ${r.room}` : `Hear ${r.room}`}
                aria-pressed={playing === r.room}
                data-cursor={playing === r.room ? "mute" : "unmute"}
                data-sound="off"
                onClick={(e) => {
                  if (drag.current?.moved) return;
                  // Phone: the room comes to the middle of the screen as its sound starts.
                  if (phone && handle.current?.room !== r.room) {
                    const b = e.currentTarget.getBoundingClientRect();
                    const k = appScale();
                    centre.current = x.current + (window.innerWidth / 2 - (b.left + b.width / 2)) / k;
                  }
                  toggle(r);
                }}
                className="absolute top-0 left-0 block shrink-0 origin-top-left cursor-pointer overflow-hidden will-change-transform"
                style={{ width: w, height: (r.height * w) / DATA_W }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.photo} alt={c ? "" : r.room} draggable={false} className="block size-full object-cover" />
                {/* Phone: a small pink sound tag bottom left (instead of the UNMUTE cursor tag): a crossed-out
                    speaker at rest, the speaker with its waves (breathing) while the room plays. */}
                {phone && (
                  <span aria-hidden className="absolute bottom-2 left-2 flex size-4 items-center justify-center bg-pink text-neutral-1000">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square">
                      <path d="M1.5 5h2.5l3-2.5v9L4 9H1.5z" fill="currentColor" stroke="none" />
                      {playing === r.room ? (
                        <g className="animate-pulse">
                          <path d="M9.2 5.2a2.4 2.4 0 0 1 0 3.6" />
                          <path d="M10.9 3.6a4.6 4.6 0 0 1 0 6.8" />
                        </g>
                      ) : (
                        <path d="M9 5.2l3.4 3.6M12.4 5.2L9 8.8" />
                      )}
                    </svg>
                  </span>
                )}
              </button>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
