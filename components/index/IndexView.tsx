"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useMotionValue, useSpring } from "framer-motion";
import type { Project } from "@/lib/content";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { Player } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";

export type Tile = Project & { label: string; client: string; x: number; y: number; w: number; h: number };

const MORPH = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };
const LIST_RIGHT = 1002; // list tiles align on their right edge (Figma 7345:1560)
const LIST_GAP = 8;
// List sizes keep the grid tile's width, image only (16:9).
const listH = (w: number) => Math.round((w * 9) / 16);

/**
 * V1 · 08 · Index (Figma 7345:1515 grid, 7345:1560 list). Every project in one place.
 * Grid: a field bigger than the screen; it opens centred on project 01 and the cursor pans it
 * (move toward an edge to travel that way). Hover shows title / client under the image.
 * List: one column you scroll; only the rows on screen list their titles at the left (annotation).
 * The toggle (bottom right) morphs one into the other: to the list, everything gathers into a line;
 * back to the grid, the line explodes with a sound (annotation). Click a tile to play it.
 */
export function IndexView({ tiles, field }: { tiles: Tile[]; field: { w: number; h: number } }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [playing, setPlaying] = useState<number | null>(null);
  const [inView, setInView] = useState<Set<string>>(new Set());

  // Grid pan: start with project 01 centred, then follow the cursor across the field.
  const first = tiles[0];
  const vh = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 1024;
  const panX = useMotionValue(-(first.x + first.w / 2 - 720));
  const panY = useMotionValue(-(first.y + first.h / 2 - 512));
  const x = useSpring(panX, { stiffness: 40, damping: 18, mass: 1 });
  const y = useSpring(panY, { stiffness: 40, damping: 18, mass: 1 });

  useEffect(() => {
    if (view !== "grid") return;
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const h = vh();
    panY.set(-(first.y + first.h / 2 - h / 2));
    const onMove = (e: PointerEvent) => {
      const fx = e.clientX / window.innerWidth;
      const fy = e.clientY / window.innerHeight;
      panX.set(-fx * (field.w - 1440));
      panY.set(-fy * (field.h - h));
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.__lenis?.start();
    };
  }, [view, field.w, field.h, first, panX, panY]);

  // List: which rows are on screen (for the title column).
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view !== "list" || !listRef.current) return;
    const io = new IntersectionObserver(
      (entries) =>
        setInView((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            const slug = (e.target as HTMLElement).dataset.slug!;
            if (e.isIntersecting) next.add(slug);
            else next.delete(slug);
          }
          return next;
        }),
      { threshold: 0.35 },
    );
    listRef.current.querySelectorAll("[data-slug]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [view]);

  const toggle = () => {
    if (view === "grid") {
      sound.cue("gather");
      setView("list");
    } else {
      sound.cue("explode");
      setView("grid");
    }
  };

  // List geometry: one column, tiles right-aligned, first row centred on screen.
  const listPos = tiles.reduce<number[]>((acc, t, i) => [...acc, i === 0 ? 0 : acc[i - 1] + listH(tiles[i - 1].w) + LIST_GAP], []);
  const listHeight = listPos[listPos.length - 1] + listH(tiles[tiles.length - 1].w);

  const tileImage = (t: Tile, h: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={t.poster ?? ""} alt={`${t.client}, ${t.label}`} loading="lazy" draggable={false} className="block w-full object-cover" style={{ height: h }} />
  );

  return (
    <main className={`relative bg-neutral-0 ${view === "grid" ? "h-(--vh) overflow-hidden" : ""}`}>
      <LayoutGroup>
        {view === "grid" ? (
          <motion.div className="absolute top-0 left-0" style={{ width: field.w, height: field.h, x, y }}>
            {tiles.map((t, i) => (
              <motion.button
                key={t.slug}
                layoutId={t.slug}
                transition={MORPH}
                type="button"
                data-cursor="play"
                onClick={() => setPlaying(i)}
                className="group absolute flex cursor-pointer flex-col gap-2 text-left"
                style={{ left: t.x, top: t.y, width: t.w }}
              >
                {tileImage(t, listH(t.w))}
                <span className="t-h5 flex justify-between gap-4 whitespace-nowrap opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                  <span className="truncate">{t.label}</span>
                  <span>{t.client}</span>
                </span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <div ref={listRef} className="relative" style={{ height: listHeight, paddingTop: "calc(var(--vh) / 2 - 94px)", paddingBottom: "calc(var(--vh) / 2)", boxSizing: "content-box" }}>
            {tiles.map((t, i) => (
              <motion.button
                key={t.slug}
                layoutId={t.slug}
                transition={MORPH}
                type="button"
                data-slug={t.slug}
                data-cursor="play"
                onClick={() => setPlaying(i)}
                className="absolute block cursor-pointer"
                style={{ left: LIST_RIGHT - t.w, top: `calc(var(--vh) / 2 - 94px + ${listPos[i]}px)`, width: t.w }}
              >
                {tileImage(t, listH(t.w))}
              </motion.button>
            ))}
          </div>
        )}
      </LayoutGroup>

      {/* List: titles of the rows on screen, fading in and out as they enter and leave. */}
      {view === "list" && (
        <ul className="pointer-events-none fixed top-1/2 left-[37px] z-10 flex -translate-y-1/2 flex-col gap-2">
          {tiles
            .filter((t) => inView.has(t.slug))
            .map((t) => (
              <motion.li key={t.slug} className="t-h5 text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {t.label} · {t.client}
              </motion.li>
            ))}
        </ul>
      )}

      <NavBar />
      <NavSub
        toggles={
          <button type="button" onClick={toggle} aria-label={view === "grid" ? "Show as list" : "Show as grid"} className="block size-8 transition-opacity duration-200 ease-out hover:opacity-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view === "grid" ? "/icons/view-grid.svg" : "/icons/view-list.svg"} alt="" width={32} height={32} />
          </button>
        }
      />
      <Player films={tiles} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
