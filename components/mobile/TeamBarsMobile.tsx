"use client";

import { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/sound";
import { appScale } from "@/lib/device";

type Card = { slug: string; name: string; bg: string; ink: string; roles: string[] };

const OPEN_BAND = 110; // how close to the middle of the screen a bar's centre must be to open

/**
 * The About team on a phone, the desktop teammate bar with scroll as the hover: eight
 * full-width bars, 80 tall and 8 apart, each name centred in Junicode 20 at rest; the bar crossing the middle of the
 * screen rolls its name up and out and its roles in from below (bold caps 12, 12 apart, one line, 0.3 s ease-out),
 * and rolls back as it leaves. Scrolling plays the team like keys: one step note per bar, only with sound on.
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
      const scale = appScale();
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
        if (best !== -1) sound.cue("teamStep");
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
          className="relative h-20 w-full overflow-hidden whitespace-nowrap"
          style={{ background: `var(--color-${c.bg})`, color: `var(--color-${c.ink})` }}
        >
          <p
            className="absolute inset-0 flex items-center justify-center font-serif text-[20px] leading-none transition-[opacity,translate] duration-300 ease-out"
            style={{ opacity: open === i ? 0 : 1, translate: open === i ? "0 -100%" : "0 0" }}
          >
            {c.name}
          </p>
          <div
            className="absolute inset-0 flex items-center justify-center gap-3 font-sans text-[12px] leading-none font-bold uppercase transition-[opacity,translate] duration-300 ease-out"
            style={{ opacity: open === i ? 1 : 0, translate: open === i ? "0 0" : "0 100%" }}
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
