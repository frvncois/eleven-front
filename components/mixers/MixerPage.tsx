"use client";

import { useState } from "react";
import type { Person, Project } from "@/lib/content";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { SectionColor } from "@/components/shell/SectionColor";
import { ProjectCard } from "./ProjectCard";
import { WhosNext } from "./WhosNext";
import { Player } from "./Player";

/** V1 · 05 · Mixer · Grid (Figma 7345:1378): name, three-up grid of spots, Who's next. */
export function MixerPage({ mixer, spots, others }: { mixer: Person; spots: Project[]; others: Person[] }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const rows: Project[][] = [];
  for (let i = 0; i < spots.length; i += 3) rows.push(spots.slice(i, i + 3));

  return (
    <main data-page className="flex flex-col items-center gap-[88px] bg-neutral-0 pt-[308px] pb-[120px]">
      <NavBar />
      <SectionColor base="neutral-0" />
      <h1 className="t-display-big w-full text-center">{mixer.name}</h1>
      <section className="flex w-full flex-col gap-2 px-margin">
        {rows.map((row, i) => (
          <div key={i} className="flex h-[353px] gap-2">
            {row.map((p) => (
              <ProjectCard key={p.slug} project={p} onOpen={(x) => setPlaying(spots.indexOf(x))} />
            ))}
            {/* Keep the three-column rhythm on a short last row. */}
            {Array.from({ length: 3 - row.length }).map((_, k) => (
              <div key={`pad-${k}`} className="flex-1" />
            ))}
          </div>
        ))}
      </section>
      <WhosNext others={others} />
      <NavSub />
      <Player films={spots} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
