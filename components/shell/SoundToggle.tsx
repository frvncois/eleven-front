"use client";

import { motion } from "framer-motion";
import { useSound } from "@/lib/sound";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hover: the letter rolls up and a copy rises in under it. `i` staggers it, so across the whole label
 * the roll runs left to right like a wave. Pure CSS (group-hover), so it costs nothing at rest.
 */
function RollChar({ ch, i, roll = true }: { ch: string; i: number; roll?: boolean }) {
  return (
    <span
      className={`block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${roll ? "group-hover:-translate-y-full" : ""}`}
      style={{ transitionDelay: `${i * 35}ms` }}
    >
      {ch}
      <span className="absolute top-full left-0">{ch}</span>
    </span>
  );
}

/** One word whose letters drop out and rise back in, one after the other; the shown word also rolls on hover (stagger from `start`). */
function Flip({ text, shown, start }: { text: string; shown: boolean; start: number }) {
  return (
    <span aria-hidden className="col-start-1 row-start-1 flex">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className="relative inline-block"
          initial={false}
          animate={{ y: shown ? "0%" : "110%" }}
          transition={{ duration: 0.45, ease: EASE, delay: (shown ? 0.12 : 0) + i * 0.035 }}
        >
          <RollChar ch={ch} i={start + i} roll={shown} />
        </motion.span>
      ))}
    </span>
  );
}

function Roll({ text }: { text: string }) {
  return (
    <span aria-hidden className="flex">
      {[...text].map((ch, i) => (
        <span key={i} className="relative inline-block overflow-hidden">
          <RollChar ch={ch} i={i} />
        </span>
      ))}
    </span>
  );
}

/**
 * Toggle/Sound, after gehry.getty.edu (Amélie, 19 Oct): SOUND ● ON / OFF in Heading/H4, no chip.
 * `tone` follows the page like Nav/Bar: "light" = neutral/300 over video and images, "dark" = black on white pages.
 * On = a filled dot breathing two rings out of it; off = a hollow dot, still. ON / OFF rolls letter by letter
 * when the state flips; hovering rolls every letter (SOUND, then ON / OFF) and swells the dot. Replaces the brush-wave chip (git a5dba8b).
 */
export function SoundToggle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const s = useSound();
  const on = s.unlocked && !s.muted;

  return (
    <button
      type="button"
      aria-label={on ? "Mute sound" : "Turn sound on"}
      aria-pressed={on}
      data-sound-toggle
      onClick={() => s.toggle()}
      className={`group t-h4 flex h-8 cursor-pointer items-center gap-3 ${tone === "light" ? "text-neutral-300" : "text-neutral-1000"}`}
    >
      <Roll text="Sound" />
      <span className="relative block size-3 transition-transform duration-300 ease-out group-hover:scale-150">
        {on && (
          <>
            <span className="sound-pulse absolute inset-0 rounded-full bg-current" />
            <span className="sound-pulse absolute inset-0 rounded-full bg-current [animation-delay:0.2s]" />
          </>
        )}
        <span
          className={`absolute inset-0 rounded-full border border-current transition-colors duration-300 ease-out ${on ? "bg-current" : "bg-transparent"}`}
        />
      </span>
      {/* Both words share one cell (sized by the wider OFF), clipped so the letters roll in and out. */}
      <span className="grid overflow-hidden">
        <Flip text="On" shown={on} start={6} />
        <Flip text="Off" shown={!on} start={6} />
      </span>
    </button>
  );
}
