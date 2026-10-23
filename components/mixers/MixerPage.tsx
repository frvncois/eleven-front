"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Person, Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { SectionColor } from "@/components/shell/SectionColor";
import { VanishStrip } from "@/components/mixers/VanishStrip";
import { EASE_OUT } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { ProjectCard } from "./ProjectCard";
import { Player, openWithSound } from "./Player";
import { ViewToggle } from "@/components/shell/ViewToggle";

type MixerView = "carousel" | "grid";
const VIEWS: [{ value: MixerView; label: string }, { value: MixerView; label: string }] = [
  { value: "carousel", label: "List" },
  { value: "grid", label: "Grid" },
];

/**
 * Mixer page: the name, then the spots in one of two views, switched by the view word next to the
 * sound toggle in Nav/Sub ("GRID / SOUND", ViewToggle, Revision on M2/Nav/Sub, Oct 19):
 * - carousel (default): the Warp carousel (Figma 7654:1821), flat at rest, bending into the ELEVEN
 *   wordmark's perspective as it moves (depth 1.25, titles on hover only). Picked by Amélie, Oct 17.
 * - grid: the three-up grid of Figma 7345:1378, on the 9-col grid (V2 · 05 · Mixer · Grid · 9-col).
 * Who's next was removed on Oct 17; other mixers are reached through the Mixers overlay.
 */
// Projects crossfade (Amélie, Oct 19: "plus smooth", always a blur between transitions): both views
// sit in the same grid cell while one leaves and the other arrives, so the page is never empty.
const SWAP = { duration: 0.4, ease: EASE_OUT };
const LAYER = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(8px)" },
};
// The carousel gets what is left of the screen under the name (114) above its 120 bottom padding:
// vh − 0.3·vh − 114 − 88 − 120. An explicit height (not flex-1) keeps the strip still while the grid
// is stacked on it during the crossfade.
const STRIP_H = "calc(var(--vh) * 0.7 - 322px)";

export function MixerPage({ mixer, spots }: { mixer: Person; spots: Project[] }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [view, setView] = useState<MixerView>("carousel");
  // The page's own sizing (one fixed screen vs scrolling) follows `view` only once a swap back to the
  // carousel is finished and the page is back at the top, so the height never snaps the scroll.
  const [layout, setLayout] = useState<MixerView>("carousel");
  const open = (i: number) => openWithSound(() => setPlaying(i));
  const rows: Project[][] = [];
  for (let i = 0; i < spots.length; i += 3) rows.push(spots.slice(i, i + 3));
  const still = useReducedMotion() ?? false;

  const choose = (v: MixerView) => {
    sound.cue(v === "grid" ? "explode" : "gather");
    setView(v);
    if (v === "grid") return setLayout("grid");
    // Back to the carousel from a scrolled grid: glide to the top during the crossfade.
    if (window.scrollY > 0) {
      if (window.__lenis && !still) window.__lenis.scrollTo(0, { duration: SWAP.duration });
      else window.scrollTo(0, 0);
    }
  };

  // Apply the page sizing once the old view is gone; for the carousel, also wait for the glide to
  // reach the top (the one-screen height would otherwise clamp the scroll).
  const settle = (v: MixerView) => {
    const done = () => (v === "grid" || window.scrollY < 0.5 ? setLayout(v) : requestAnimationFrame(done));
    done();
  };

  return (
    // Carousel: exactly one screen, no vertical scroll (Amélie, Oct 17). Grid: the page scrolls, with
    // 240 px under the last row (Amélie, Oct 19). The top padding is the same in both views so the
    // name never moves.
    <main
      data-page
      className={`flex flex-col items-center gap-[88px] bg-neutral-0 pt-[calc(var(--vh)*0.3)] ${
        layout === "carousel" ? "h-(--vh) overflow-hidden pb-[120px]" : "min-h-[var(--vh)] overflow-x-clip pb-[240px]"
      }`}
    >
      <SectionColor base="neutral-0" />
      <h1 className="t-display-big w-full text-center">{mixer.name}</h1>
      <div className="grid w-full">
        <AnimatePresence initial={false} onExitComplete={() => settle(view)}>
          <motion.div
            key={view}
            className="col-start-1 row-start-1 w-full"
            {...LAYER}
            transition={still ? { duration: 0 } : SWAP}
          >
            {view === "carousel" ? (
              <section aria-label="Projects" className="relative w-full overflow-x-clip" style={{ height: STRIP_H }}>
                <div className="absolute inset-x-0 top-1/2">
                  <VanishStrip inPage films={spots} mode="warp" depth={1.25} titles={false} onOpen={open} />
                </div>
              </section>
            ) : (
              // 9-col grid: 3 cards a row, each 3 cols (453), the gutter (16) both ways.
              <section aria-label="Projects" className="flex w-full flex-col gap-gutter px-margin">
                {rows.map((row, i) => (
                  <div key={i} className="flex h-[353px] gap-gutter">
                    {row.map((p) => (
                      <ProjectCard key={p.slug} project={p} onOpen={(x) => open(spots.indexOf(x))} />
                    ))}
                    {/* Keep the three-column rhythm on a short last row. */}
                    {Array.from({ length: 3 - row.length }).map((_, k) => (
                      <div key={`pad-${k}`} className="flex-1" />
                    ))}
                  </div>
                ))}
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Chrome toggles={<ViewToggle options={VIEWS} value={view} onChange={choose} />} />
      <Player films={spots} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
