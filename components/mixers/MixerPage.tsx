"use client";

import { useState } from "react";
import type { Person, Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { SectionColor } from "@/components/shell/SectionColor";
import { VanishStrip } from "@/components/lab/VanishStrip";
import { WhosNext } from "./WhosNext";
import { Player, openWithSound } from "./Player";

/**
 * Mixer page: name, the spots on the Warp carousel, Who's next. The carousel (Figma 7654:1821) is
 * flat at rest and bends into the ELEVEN wordmark's perspective as it moves (depth 1.25, titles on
 * hover only), picked by Amélie from the carousel lab on Oct 17. Replaces the three-up grid.
 */
export function MixerPage({ mixer, spots, others }: { mixer: Person; spots: Project[]; others: Person[] }) {
  const [playing, setPlaying] = useState<number | null>(null);

  return (
    <main data-page className="flex flex-col items-center gap-[88px] bg-neutral-0 pt-[308px] pb-[120px]">
      <SectionColor base="neutral-0" />
      <h1 className="t-display-big w-full text-center">{mixer.name}</h1>
      <section aria-label="Projects" className="relative h-[440px] w-full overflow-x-clip">
        <div className="absolute inset-x-0 top-1/2">
          <VanishStrip inPage films={spots} mode="warp" depth={1.25} titles={false} onOpen={(i) => openWithSound(() => setPlaying(i))} />
        </div>
      </section>
      <WhosNext others={others} />
      <Chrome />
      <Player films={spots} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
