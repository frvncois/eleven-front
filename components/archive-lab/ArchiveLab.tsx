"use client";

import { useState } from "react";
import type { Person, Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { ArchiveStyleSwitch } from "@/components/index/ArchiveStyleSwitch";
import { LanesView } from "./LanesView";
import { DepthView, type DepthMode } from "./DepthViews";

type Spot = { film: Project; index: number };
export type LabView = { kind: "lanes"; lanes: { mixer: Person; films: Spot[] }[] } | { kind: DepthMode; spots: Spot[] };

/**
 * Shell for the vanishing-point Archive prototypes (Lanes, Corridor, Floor, Fly): one screen, the
 * navs, the version chips bottom right, the player.
 */
export function ArchiveLab({ films, view }: { films: Project[]; view: LabView }) {
  const [playing, setPlaying] = useState<number | null>(null);
  const open = (i: number) => openWithSound(() => setPlaying(i));
  return (
    <main data-page className="relative h-[var(--vh)] overflow-hidden bg-neutral-0 select-none">
      {view.kind === "lanes" ? <LanesView lanes={view.lanes} onOpen={open} /> : <DepthView mode={view.kind} films={view.spots} onOpen={open} />}
      <Chrome toggles={<ArchiveStyleSwitch current={view.kind} />} />
      <Player films={films} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}

/** Stage-unit viewport height (the 1440 stage is zoomed to the window). */
export const vhOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 900;

/** Where everything converges: right of centre and a little low, like the ELEVEN wordmark's point. */
export const vanishPoint = (vh: number): [number, number] => [800, vh * 0.52];

/** Hairlines from the given points to the vanishing point, plus the point itself. */
export function Rays({ from, vp }: { from: [number, number][]; vp: [number, number] }) {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
      {from.map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={vp[0]} y2={vp[1]} stroke="var(--color-neutral-200)" strokeWidth={1} />
      ))}
      <circle cx={vp[0]} cy={vp[1]} r={3} fill="var(--color-neutral-1000)" />
    </svg>
  );
}
