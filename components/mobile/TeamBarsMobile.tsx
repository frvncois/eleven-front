"use client";

import { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/sound";

type Card = { slug: string; name: string; bg: string; ink: string; roles: string[] };

const OPEN_BAND = 110; // how close to the middle of the screen a bar's centre must be to open

/**
 * Figma M · 08 · About · Team (7696:2005): scroll is the hover. Eight full-width bars, 80 tall and 8
 * apart; the one crossing the middle of the screen opens to 132 (0.3 s ease-out), its name in Card
 * Title and roles in Eyebrow sliding in, and closes as it leaves. Scrolling plays the team like keys:
 * one step note per bar, only when the site's sound is on.
 */
export function TeamBarsMobile({ cards }: { cards: Card[] }) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [open, setOpen] = useState(-1);

  useEffect(() => {
    let raf = 0;
    let cur = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const mid = window.innerHeight / 2;
      const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
      let best = -1;
      let bestD = OPEN_BAND * scale;
      els.current.forEach((n, i) => {
        if (!n) return;
        const r = n.getBoundingClientRect();
        // The open bar is judged a little closer, so a bar never flickers while it grows.
        const d = Math.abs(r.top + r.height / 2 - mid) - (i === cur ? 12 * scale : 0);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best !== cur) {
        cur = best;
        setOpen(best);
        if (best !== -1) sound.cue("step");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {cards.map((c, i) => (
        <div
          key={c.slug}
          ref={(n) => {
            els.current[i] = n;
          }}
          className="relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden whitespace-nowrap transition-[height] duration-300 ease-out"
          style={{ height: open === i ? 132 : 80, background: `var(--color-${c.bg})`, color: `var(--color-${c.ink})` }}
        >
          <p
            className="font-serif text-[20px] leading-none transition-[opacity,translate] duration-300 ease-out"
            style={{ opacity: open === i ? 1 : 0, translate: open === i ? "0 0" : "0 -24px" }}
          >
            {c.name}
          </p>
          <div
            className="t-eyebrow flex flex-col items-center transition-[opacity,translate] duration-300 ease-out"
            style={{ opacity: open === i ? 1 : 0, translate: open === i ? "0 0" : "0 24px" }}
          >
            {c.roles.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
