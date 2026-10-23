"use client";

import { useMemo, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import type { Project } from "@/lib/content";
import { lerpQuad, quadVisible, rectToQuadCss, taperField, type Quad } from "@/lib/perspective";
import { useStrip, wrap } from "./useStrip";

/** Every card is drawn flat at this size, then mapped onto its quad with one matrix3d. */
const CW = 480;
const IMG_H = 270;
/**
 * The caption is the phone's: client chip stacked straight on the title chip, no gap, 8 under the film. Cards
 * are drawn at 480 and shown at 400, so it is drawn at CAPTION_K to read at the chips' true size (12 / 14) on the stage.
 */
const CAPTION_K = 480 / 400;
const TITLE_H = Math.ceil((8 + 38.8) * CAPTION_K);

/**
 * The mixer page carousel: one continuous strip (drag, wheel, idle drift, infinite loop), flat at rest
 * so the titles read; speed bends it into the ELEVEN wordmark's lines, the vanishing point on the side
 * the strip is travelling from. Placed in the page flow: the page keeps its vertical scroll.
 */
export function VanishStrip({ films, depth, onOpen }: { films: Project[]; depth: number; onOpen: (i: number) => void }) {
  const band = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const warp = useRef({ amount: 0, dir: 1 });
  const still = useMemo(() => prefersReducedMotion(), []);
  // Titles show on hover; the strip is always laid out with them.
  const CH = IMG_H + TITLE_H;

  // Enough copies for a seamless loop past both edges.
  const items = useMemo(() => {
    const out: { film: Project; i: number }[] = [];
    while (out.length < 18) films.forEach((film, i) => out.push({ film, i }));
    return out;
  }, [films]);

  const click = useStrip(
    band,
    (s) => {
    const n = items.length;
    const place = (k: number, q: Quad | null) => {
      const el = cards.current[k];
      if (!el) return;
      if (!q || !quadVisible(q)) {
        el.style.visibility = "hidden";
        return;
      }
      el.style.visibility = "visible";
      el.style.transform = rectToQuadCss(CW, CH, q);
    };

    {
      const wv = warp.current;
      // Reduced motion: the strip stays flat (as on the phone).
      const target = still ? 0 : Math.min(1, Math.abs(s.velocity) / 16);
      wv.amount += (target - wv.amount) * (target > wv.amount ? 0.12 : 0.05);
      if (Math.abs(s.velocity) > 0.8) wv.dir += (Math.sign(s.velocity) - wv.dir) * 0.08;
      const w = 400, h = (w * CH) / CW, pitch = w + 8, total = n * pitch;
      const fwd = taperField({ midY: 0, hLeft: h * 1.45, depth });
      const back = taperField({ midY: 0, hLeft: h * 1.45, depth, mirror: true });
      for (let k = 0; k < n; k++) {
        // Loop seam two cards past the left edge: at one, the bent card's leaning top corner would still be
        // on screen when it jumps to the far end, so it would vanish instead of sliding off.
        const x = wrap(k * pitch - s.offset + pitch, total) - pitch * 2;
        const flat: Quad = [[x, -h / 2], [x + w, -h / 2], [x + w, h / 2], [x, h / 2]];
        const bent = lerpQuad(back.quad(x, x + w), fwd.quad(x, x + w), (wv.dir + 1) / 2);
        place(k, lerpQuad(flat, bent, wv.amount));
      }
    }
    },
    // The strip moves ~0.8× the scroll and never faster than ~3.5 cards a second, so every title
    // can be read as it passes.
    { passVertical: true, wheel: 0.5, maxSpeed: 24 },
  );

  return (
    <div ref={band} className="relative h-0 w-full touch-pan-y select-none">
      {/* Hit area for wheel / drag across the whole band, not just on the cards. */}
      <div className="absolute inset-x-0 -top-[220px] h-[440px] cursor-grab active:cursor-grabbing" />
      {items.map(({ film, i }, k) => (
        <button
          key={k}
          ref={(el) => {
            cards.current[k] = el;
          }}
          type="button"
          data-cursor="play"
          onClick={click(() => onOpen(i))}
          className="group absolute top-0 left-0 block origin-top-left cursor-pointer text-left will-change-transform"
          style={{ width: CW, height: CH, visibility: "hidden" }}
        >
          <span className="relative block overflow-hidden bg-neutral-200" style={{ height: IMG_H }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={film.poster ?? ""} alt="" draggable={false} className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
          </span>
          <span className="block opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" style={{ height: TITLE_H }}>
            <span
              className="flex origin-top-left flex-col items-start whitespace-nowrap"
              style={{ transform: `scale(${CAPTION_K})`, paddingTop: 8 }}
            >
              <span className="chip-client">{film.client}</span>
              <span className="chip-title">{film.short ?? film.title}</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
