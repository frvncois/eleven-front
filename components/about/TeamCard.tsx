"use client";

import { sound } from "@/lib/sound";

type Props = { name: string; slug: string; bg: string; ink: string; roles: string[]; icon?: string };

// The icon perched on the bar's top edge (Figma teammate 7741:7064): 110 tall, half above the bar, 128 past the end
// of the name (Jeff's frame: name 243 wide, drawing at 371), so it never lands on a longer name. Always black
// (review note 12).
const ICON = { gap: 128, top: -55, h: 110 };

/**
 * Card/Team/<Name>, as a full-width bar (Figma teammate 7741:7064, Amélie's redesign, Oct 23). Default: a solid brand
 * bar, 90 tall, empty. Hover (0.3 s ease-out): the name (H2, Junicode 64) on the left and the roles (H3, 48 apart) on
 * the right fade up into the bar, both cap-trimmed to its 24 padding, and the person's drawing lands across the bar's
 * top edge. The person's sound plays. Shared step sounds until Eleven's takes arrive: drop
 * /sounds/<slug>-1.mp3 … -3.mp3 and list them in `takes`.
 */
export function TeamCard({ name, slug, bg, ink, roles, icon }: Props) {
  const takes: string[] = [];
  const onEnter = () => {
    // Prototype: the shared step sounds until each person has their own takes.
    if (takes.length) sound.play(takes, slug);
    else sound.cue("step");
  };
  return (
    <div
      onPointerEnter={onEnter}
      className="group relative h-[90px] w-full p-6 hover:z-10"
      style={{ background: `var(--color-${bg})`, color: `var(--color-${ink})` }}
    >
      <div className="relative flex w-full translate-y-2 items-start justify-between leading-none whitespace-nowrap opacity-0 transition-[translate,opacity] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0">
        <div className="relative">
          <p className="t-h2 [text-box:trim-both_cap_alphabetic]">{name}</p>
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt=""
              aria-hidden
              className="pointer-events-none absolute w-auto max-w-none"
              style={{ left: `calc(100% + ${ICON.gap}px)`, top: ICON.top, height: ICON.h }}
            />
          )}
        </div>
        <div className="t-h3 flex items-center gap-12">
          {roles.map((r) => (
            <p key={r}>{r}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
