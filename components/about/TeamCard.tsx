"use client";

import { sound } from "@/lib/sound";

type Props = { name: string; slug: string; bg: string; ink: string; roles: string[] };

/**
 * Card/Team/<Name> (Figma 7398:5365 and siblings). Default: a solid brand block, the name and roles
 * parked just outside the card. Hover: they slide in from the top and bottom edges (0.3 s ease-out)
 * and the person's sound plays (annotation). Shared step sounds until Eleven's takes arrive:
 * drop /sounds/<slug>-1.mp3 … -3.mp3 and list them in `takes`.
 */
export function TeamCard({ name, slug, bg, ink, roles }: Props) {
  const takes: string[] = [];
  // Prototype: the shared step sounds until each person has their own takes.
  const onEnter = () => (takes.length ? sound.play(takes, slug) : sound.cue("step"));
  return (
    <div
      onPointerEnter={onEnter}
      className="group relative flex h-[234px] min-w-0 flex-1 items-center justify-center overflow-hidden p-2"
      style={{ background: `var(--color-${bg})`, color: `var(--color-${ink})` }}
    >
      <div className="flex h-[312px] w-full flex-col items-center justify-between transition-[height] duration-300 ease-out group-hover:h-[218px]">
        <p className="t-card-title text-center whitespace-nowrap">{name}</p>
        <div className={`t-eyebrow flex h-4 w-full whitespace-nowrap ${roles.length > 1 ? "justify-between" : "justify-center"}`}>
          {roles.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
