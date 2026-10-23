"use client";

import { useMemo, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import type { Project } from "@/lib/content";
import { lerpQuad, quadVisible, rectToQuadCss, squareToQuad, taperField, type Quad } from "@/lib/perspective";
import { useStrip, wrap } from "./useStrip";

export type StripMode = "taper" | "vanish" | "warp";

/** Every card is drawn flat at this size, then mapped onto its quad with one matrix3d. */
const CW = 480;
const IMG_H = 270;
/**
 * The caption is the phone's (Oct 23): client chip stacked straight on the title chip, no gap, 8 under the film. Cards
 * are drawn at 480 and shown at 400, so it is drawn at CAPTION_K to read at the chips' true size (12 / 14) on the stage.
 */
const CAPTION_K = 480 / 400;
const TITLE_H = Math.ceil((8 + 38.8) * CAPTION_K);

/**
 * Options 01–03: one continuous strip (drag, wheel, idle drift, infinite loop) bent along the
 * ELEVEN wordmark's lines.
 * - taper:  the logo exactly. Cards keep their width and lose height to the right, like the letters.
 * - vanish: true perspective onto the same lines. Cards also narrow and pile up into the vanishing point.
 * - warp:   flat at rest (titles readable); speed bends it into the logo, the vanishing point on the
 *           side the strip is travelling from.
 */
export function VanishStrip({
  films,
  mode,
  depth,
  titles,
  onOpen,
  inPage = false,
}: {
  films: Project[];
  mode: StripMode;
  depth: number;
  titles: boolean;
  onOpen: (i: number) => void;
  /** On a scrolling page (mixer pages): placed in flow, the page keeps its vertical scroll. */
  inPage?: boolean;
}) {
  const band = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const warp = useRef({ amount: 0, dir: 1 });
  const still = useMemo(() => prefersReducedMotion(), []);
  // Warp: titles only on hover (Amélie, Oct 17), so the strip is always laid out with them.
  const hoverTitles = mode === "warp";
  const showTitles = titles || hoverTitles;
  const CH = IMG_H + (showTitles ? TITLE_H : 0);

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

    if (mode === "taper") {
      const field = taperField({ midY: 0, hLeft: 236, depth });
      const w = 330, pitch = w + 14, total = n * pitch;
      for (let k = 0; k < n; k++) {
        const x = wrap(k * pitch - s.offset + pitch, total) - pitch * 2;
        place(k, x > field.vanishX ? null : field.quad(x, x + w));
      }
    }

    if (mode === "vanish") {
      const field = taperField({ midY: 0, hLeft: 270, depth });
      const H = squareToQuad(field.quad(0, 1440));
      // Flat units: at the left edge one flat px ≈ one screen px, so a drag there feels 1:1.
      const dXdu = (H.project(0.001, 1)[0] - H.project(0, 1)[0]) / 0.001;
      const du = 460 / dXdu, gap = 12 / dXdu, pitch = du + gap, total = n * pitch;
      for (let k = 0; k < n; k++) {
        const u = wrap(k * pitch - s.offset / dXdu, total) - pitch * 1.4;
        const u1 = u + du;
        // Behind the eye (left) or swallowed by the vanishing point (right): skip.
        if (H.depthAt(u, 0) < 0.2 || H.depthAt(u, 1) < 0.2) { place(k, null); continue; }
        const q: Quad = [H.project(u, 0), H.project(u1, 0), H.project(u1, 1), H.project(u, 1)];
        place(k, q);
        const el = cards.current[k];
        if (el) el.style.zIndex = String(1000 - Math.round(u * 50));
      }
    }

    if (mode === "warp") {
      const wv = warp.current;
      // Reduced motion: the strip stays flat (as on the phone).
      const target = still ? 0 : Math.min(1, Math.abs(s.velocity) / 16);
      wv.amount += (target - wv.amount) * (target > wv.amount ? 0.12 : 0.05);
      if (Math.abs(s.velocity) > 0.8) wv.dir += (Math.sign(s.velocity) - wv.dir) * 0.08;
      const w = 400, h = (w * CH) / CW, pitch = w + 8, total = n * pitch;
      const fwd = taperField({ midY: 0, hLeft: h * 1.45, depth });
      const back = taperField({ midY: 0, hLeft: h * 1.45, depth, mirror: true });
      for (let k = 0; k < n; k++) {
        // Loop seam two cards past the left edge: at one, the bent card's leaning top corner was still
        // on screen when it jumped to the far end, so it vanished instead of sliding off (Oct 17).
        const x = wrap(k * pitch - s.offset + pitch, total) - pitch * 2;
        const flat: Quad = [[x, -h / 2], [x + w, -h / 2], [x + w, h / 2], [x, h / 2]];
        const bent = lerpQuad(back.quad(x, x + w), fwd.quad(x, x + w), (wv.dir + 1) / 2);
        place(k, lerpQuad(flat, bent, wv.amount));
      }
    }
    },
    // On the mixer pages (Amélie, Oct 17: too fast): the strip moves ~0.8× the scroll instead of
    // ~1.6×, and never faster than ~3.5 cards a second, so every title can be read as it passes.
    inPage ? { passVertical: true, wheel: 0.5, maxSpeed: 24 } : {},
  );

  return (
    <div
      ref={band}
      data-lenis-prevent={inPage ? undefined : true}
      className={`h-0 touch-pan-y select-none ${inPage ? "relative w-full" : "absolute inset-x-0 top-[calc(var(--vh)*0.6)]"}`}
    >
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
            <img src={film.poster ?? ""} alt={`${film.client}, ${film.short ?? film.title}`} draggable={false} className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
          </span>
          {showTitles && (
            <span className={`block ${hoverTitles ? "opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" : ""}`} style={{ height: TITLE_H }}>
              <span
                className="flex origin-top-left flex-col items-start whitespace-nowrap"
                style={{ transform: `scale(${CAPTION_K})`, paddingTop: 8 }}
              >
                <span className="chip-client">{film.client}</span>
                <span className="chip-title">{film.short ?? film.title}</span>
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
