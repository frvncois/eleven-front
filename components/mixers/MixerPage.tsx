"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Person, Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { SectionColor } from "@/components/shell/SectionColor";
import { VanishStrip } from "@/components/lab/VanishStrip";
import { EASE_DISSOLVE } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { ProjectCard } from "./ProjectCard";
import { Player, openWithSound } from "./Player";

/**
 * Mixer page: the name, then the spots in one of two views (toggle bottom right, as on the Archive):
 * - carousel (default): the Warp carousel (Figma 7654:1821), flat at rest, bending into the ELEVEN
 *   wordmark's perspective as it moves (depth 1.25, titles on hover only). Picked by Amélie, Oct 17.
 * - grid: the three-up grid of Figma 7345:1378.
 * Who's next was removed on Oct 17; other mixers are reached through the Mixers overlay.
 */
export function MixerPage({ mixer, spots }: { mixer: Person; spots: Project[] }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [view, setView] = useState<"carousel" | "grid">("carousel");
  const open = (i: number) => openWithSound(() => setPlaying(i));
  const rows: Project[][] = [];
  for (let i = 0; i < spots.length; i += 3) rows.push(spots.slice(i, i + 3));

  const toggle = () => {
    sound.cue(view === "carousel" ? "explode" : "gather");
    setView(view === "carousel" ? "grid" : "carousel");
  };

  return (
    <main data-page className="flex min-h-[var(--vh)] flex-col items-center gap-[88px] bg-neutral-0 pt-[308px] pb-[120px]">
      <SectionColor base="neutral-0" />
      <h1 className="t-display-big w-full text-center">{mixer.name}</h1>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_DISSOLVE }}
        >
          {view === "carousel" ? (
            <section aria-label="Projects" className="relative h-[440px] w-full overflow-x-clip">
              <div className="absolute inset-x-0 top-1/2">
                <VanishStrip inPage films={spots} mode="warp" depth={1.25} titles={false} onOpen={open} />
              </div>
            </section>
          ) : (
            <section aria-label="Projects" className="flex w-full flex-col gap-2 px-margin">
              {rows.map((row, i) => (
                <div key={i} className="flex h-[353px] gap-2">
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
      <Chrome
        toggles={
          <button
            type="button"
            onClick={toggle}
            data-sound="off"
            aria-label={view === "carousel" ? "Show as grid" : "Show as carousel"}
            className="block size-8 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            {/* One button = an action: it shows the view you will switch to (same icons as the Archive). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view === "carousel" ? "/icons/view-grid.svg" : "/icons/view-list.svg"} alt="" width={32} height={32} />
          </button>
        }
      />
      <Player films={spots} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
