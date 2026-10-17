"use client";

import { useMemo, useRef } from "react";
import type { Project } from "@/lib/content";
import { LOGO_K } from "@/lib/perspective";
import { useStepper } from "./useStrip";

/** public/icons/eleven-shape.svg, the wordmark outline (1400 × 286). */
const LOGO_PATH =
  "M1399.71 218.032L1400.01 110.123L1326.63 103.911L1325.92 170.352L1226.51 96.0649L1156.88 90.2306L1158.56 230.128L1230.66 226.633L1230.31 155.087L1328.31 221.729L1399.71 218.032ZM1018.41 201.183L1018.26 169.949L1133.79 170.402L1133.92 142.89L1018.29 139.646L1018.26 114.85L1141.19 120.509L1141.16 88.6966L873.939 66.3904L818.689 197.335L759.893 57.0103L489.478 35.2825L476.829 263.877L702.707 253.516V206.338L558.283 210.563L560.622 169.17L688.901 171.232L688.951 128.204L563.136 123.401L565.551 87.7913L696.445 95.1848L770.506 250.071L861.24 245.393L937.136 109.796L937.262 241.797L1147.88 231.159L1147.62 198.19L1018.41 201.183ZM354.661 24.9467L277.607 18.8358L257.791 274.389L466.72 264.682L469.083 208.476L342.414 211.016L354.661 24.9467ZM23.1612 0L254.094 16.9748L249.97 71.9732L96.2158 64.5295L92.8963 106.652L236.767 111.455L232.744 166.102L88.8726 163.939L84.6226 219.063L244.739 216.423L239.886 275.646L0 285.806L23.1612 0Z";

/** Each letter's horizontal span and the y of its foot (logo units), read off the path. */
const LETTERS: { x0: number; x1: number; foot: number }[] = [
  { x0: 0, x1: 256, foot: 285.8 },
  { x0: 256, x1: 473, foot: 274.4 },
  { x0: 473, x1: 706, foot: 263.9 },
  { x0: 706, x1: 937.2, foot: 250.1 },
  { x0: 937.2, x1: 1152, foot: 241.8 },
  { x0: 1152, x1: 1400, foot: 230.1 },
];
const W = 1400 * LOGO_K * 0.966;
const S = W / 1400;

/**
 * Option 05 · Wordmark. No cards at all: the ELEVEN outline is the window, one project per letter.
 * Every step the footage slides one letter to the left (E takes the L's film, and so on), a new one
 * enters through the N. Titles sit under each letter's foot, so they follow the logo's slope.
 */
export function WordmarkStrip({ films, onOpen }: { films: Project[]; onOpen: (i: number) => void }) {
  const band = useRef<HTMLDivElement>(null);
  const imgs = useRef<(SVGImageElement | null)[]>([]);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const front = useRef(0);
  const shown = useRef(-1);
  const n = films.length;
  const ring = useMemo(() => Array.from({ length: Math.max(n, 9) }, (_, k) => k), [n]);

  const span = (k: number) => {
    if (k < 0) return { x0: -256 * -k, x1: -256 * -k + 256 };
    if (k > 5) return { x0: 1400 + (k - 6) * 248, x1: 1400 + (k - 5) * 248 };
    return LETTERS[k];
  };

  const click = useStepper(band, (p) => {
    const m = ring.length;
    for (const k of ring) {
      const el = imgs.current[k];
      if (!el) continue;
      let t = (((k - p) % m) + m) % m;
      if (t > m - 1.5) t -= m;
      if (t < -1 || t > 6.5) {
        el.setAttribute("visibility", "hidden");
        continue;
      }
      const f = Math.floor(t), r = t - f;
      const a = span(f), b = span(f + 1);
      const x0 = a.x0 + (b.x0 - a.x0) * r, x1 = a.x1 + (b.x1 - a.x1) * r;
      el.setAttribute("visibility", "visible");
      el.setAttribute("x", x0.toFixed(2));
      el.setAttribute("width", Math.max(1, x1 - x0).toFixed(2));
    }
    const fr = ((Math.round(p) % m) + m) % m;
    front.current = fr;
    if (fr !== shown.current) {
      shown.current = fr;
      LETTERS.forEach((_, i) => {
        const c = caps.current[i];
        if (!c) return;
        const film = films[(fr + i) % m % n];
        c.textContent = film.client;
        c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: i * 40, fill: "backwards", easing: "cubic-bezier(0,0,0.58,1)" });
      });
    }
  });

  return (
    <div ref={band} data-lenis-prevent className="absolute top-[calc(var(--vh)*0.58-150px)] left-margin touch-none select-none" style={{ width: W, height: 286 * S + 40 }}>
      <svg viewBox="0 0 1400 286" width={W} height={286 * S} className="block cursor-grab overflow-visible active:cursor-grabbing">
        <defs>
          <clipPath id="eleven-clip">
            <path d={LOGO_PATH} />
          </clipPath>
        </defs>
        <g clipPath="url(#eleven-clip)">
          <rect width="1400" height="286" fill="var(--color-neutral-200)" />
          {ring.map((k) => (
            <image
              key={k}
              ref={(el) => {
                imgs.current[k] = el;
              }}
              href={films[k % n].poster ?? ""}
              y="0"
              height="286"
              x="0"
              width="1"
              visibility="hidden"
              preserveAspectRatio="xMidYMid slice"
            />
          ))}
        </g>
      </svg>
      {/* One click target per letter (the outline itself is too thin to aim at). */}
      {LETTERS.map((l, i) => (
        <button
          key={i}
          type="button"
          data-cursor="play"
          aria-label={`Play letter ${i + 1}`}
          onClick={click(() => onOpen((front.current + i) % ring.length % n))}
          className="absolute top-0 cursor-pointer"
          style={{ left: l.x0 * S, width: (l.x1 - l.x0) * S, height: 286 * S }}
        />
      ))}
      {LETTERS.map((l, i) => (
        <div
          key={`c${i}`}
          ref={(el) => {
            caps.current[i] = el;
          }}
          className="t-body-sm pointer-events-none absolute whitespace-nowrap"
          style={{ left: l.x0 * S + (i === 0 ? 0 : 4), top: l.foot * S + 10 }}
        />
      ))}
    </div>
  );
}
