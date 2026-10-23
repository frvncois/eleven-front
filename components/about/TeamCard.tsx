"use client";

import { sound } from "@/lib/sound";

type Props = { name: string; slug: string; bg: string; ink: string; roles: string[] };

/**
 * Card/Team/<Name> (Figma "teeammate" 7741:7018, Oct 23): a full-width brand bar, 80 tall, 8 padding, in the person's
 * colour and ink. At rest the name sits centred in Junicode 40; on hover it rolls up out of the bar and the roles roll
 * in from below, centred, 24 bold caps, 24 apart, no separators (0.3 s ease-out; reduced motion = a plain swap).
 * The person's sound plays. Shared step sounds until Eleven's takes arrive: drop /sounds/<slug>-1.mp3 … -3.mp3 and
 * list them in `takes`.
 */
export function TeamCard({ name, slug, bg, ink, roles }: Props) {
  const takes: string[] = [];
  const onEnter = () => {
    // Stand-in: the shared step sounds until each person has their own takes (replace before launch).
    if (takes.length) sound.play(takes, slug);
    else sound.cue("step");
  };
  const roll = "absolute inset-0 flex items-center justify-center transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none";
  return (
    <div
      onPointerEnter={onEnter}
      className="group relative h-20 w-full overflow-hidden p-2"
      style={{ background: `var(--color-${bg})`, color: `var(--color-${ink})` }}
    >
      <div className="relative size-full whitespace-nowrap">
        <p className={`${roll} font-serif text-[40px] leading-none group-hover:-translate-y-full group-hover:opacity-0`}>{name}</p>
        <div
          className={`${roll} translate-y-full gap-6 font-sans text-[24px] leading-none font-bold uppercase opacity-0 group-hover:translate-y-0 group-hover:opacity-100`}
        >
          {roles.map((r) => (
            <p key={r}>{r}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
