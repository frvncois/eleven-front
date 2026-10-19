"use client";

import { sound } from "@/lib/sound";

type Props = { name: string; slug: string; bg: string; ink: string; roles: string[] };

/**
 * Card/Team/<Name>, as a full-width bar (Figma V2 · 09 · About, M2/Section/Team, revision Oct 19:
 * "new layout"). Default: a solid brand bar, 94 tall, the name parked above it and the roles below.
 * Hover: they slide in from the top and bottom edges (0.3 s ease-out) and the person's sound plays.
 * Roles stack in the centre. Shared step sounds until Eleven's takes arrive: drop
 * /sounds/<slug>-1.mp3 … -3.mp3 and list them in `takes`.
 */
export function TeamCard({ name, slug, bg, ink, roles }: Props) {
  const takes: string[] = [];
  // Prototype: the shared step sounds until each person has their own takes.
  const onEnter = () => (takes.length ? sound.play(takes, slug) : sound.cue("step"));
  return (
    <div
      onPointerEnter={onEnter}
      className="group relative flex h-[94px] w-full items-center justify-center overflow-hidden p-2"
      style={{ background: `var(--color-${bg})`, color: `var(--color-${ink})` }}
    >
      <div className="flex h-[312px] w-full flex-col items-center justify-between transition-[height] duration-300 ease-out group-hover:h-[78px]">
        <p className="t-card-title text-center whitespace-nowrap">{name}</p>
        <div className="t-eyebrow flex flex-col items-center gap-2 whitespace-nowrap">
          {roles.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
