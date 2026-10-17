"use client";

import { useMemo, useRef } from "react";
import type { Project } from "@/lib/content";
import { LOGO_K, letterQuads, lerpQuad, quadVisible, rectToQuadCss, type Quad } from "@/lib/perspective";
import { useStepper } from "./useStrip";

const CW = 400;
const CH = 400;
const SCALE = LOGO_K * 0.966; // the wordmark inside the 24 px page margins
const OFFSET_X = 24;

/**
 * Option 04 · Letters. Six slots cut exactly like the six letters of ELEVEN (same quads, same
 * gaps). The projects step through them one letter at a time: each card morphs from one letter's
 * shape into the next, the front one grows off the left, a new one comes out of the vanishing point.
 * At rest the row reads as the wordmark's silhouette. One title only: the card in the E.
 */
export function LetterStrip({ films, onOpen }: { films: Project[]; onOpen: (i: number) => void }) {
  const band = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const caption = useRef<HTMLDivElement>(null);
  const shown = useRef(-1);
  const slots = useMemo(() => letterQuads(0, SCALE, OFFSET_X), []);

  /** Slot k as a quad, extrapolated past both ends of the word. */
  const slot = (k: number): Quad => {
    if (k < 0) return lerpQuad(slots[0], slots[1], k);
    if (k > 5) return lerpQuad(slots[4], slots[5], 1 + (k - 5) * 0.8);
    return slots[k];
  };

  const n = films.length;
  // A ring of n cards; a card's slot is its index minus the position, wrapped around the ring.
  const ring = useMemo(() => Array.from({ length: Math.max(n, 9) }, (_, k) => k), [n]);

  const click = useStepper(band, (p) => {
    const m = ring.length;
    for (const k of ring) {
      const el = cards.current[k];
      if (!el) continue;
      let t = (((k - p) % m) + m) % m;
      if (t > m - 1.5) t -= m; // the one leaving on the left
      if (t < -1 || t > 6.6) {
        el.style.visibility = "hidden";
        continue;
      }
      const f = Math.floor(t);
      const q = lerpQuad(slot(f), slot(f + 1), t - f);
      if (!quadVisible(q)) {
        el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "visible";
      el.style.opacity = String(Math.max(0, Math.min(1, 6.4 - t)));
      el.style.transform = rectToQuadCss(CW, CH, q);
    }
    const front = ((Math.round(p) % m) + m) % m;
    if (front !== shown.current && caption.current) {
      shown.current = front;
      const film = films[front % n];
      caption.current.innerHTML = `<span>${film.short ?? film.title}</span><span class="text-neutral-500">${film.client}</span>`;
      caption.current.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(0,0,0.58,1)" });
    }
  });

  const e = slots[0];
  return (
    <div ref={band} data-lenis-prevent className="absolute inset-x-0 top-[calc(var(--vh)*0.58)] h-0 touch-none select-none">
      <div className="absolute inset-x-0 -top-[200px] h-[420px] cursor-grab active:cursor-grabbing" />
      {ring.map((k) => {
        const film = films[k % n];
        return (
          <button
            key={k}
            ref={(el) => {
              cards.current[k] = el;
            }}
            type="button"
            data-cursor="play"
            onClick={click(() => onOpen(k % n))}
            className="absolute top-0 left-0 block origin-top-left cursor-pointer overflow-hidden bg-neutral-200 will-change-transform"
            style={{ width: CW, height: CH, visibility: "hidden" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={film.poster ?? ""} alt={`${film.client}, ${film.short ?? film.title}`} draggable={false} className="absolute inset-0 size-full object-cover" />
          </button>
        );
      })}
      <div ref={caption} className="t-body absolute flex gap-3 whitespace-nowrap" style={{ left: e[3][0], top: e[3][1] + 14 }} />
    </div>
  );
}
