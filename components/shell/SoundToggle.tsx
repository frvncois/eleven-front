"use client";

import { useSound } from "@/lib/sound";
import { Flip, Roll } from "./LetterRoll";

/**
 * Toggle/Sound, after gehry.getty.edu (Amélie, 19 Oct): SOUND ● ON / OFF in Heading/H4, no chip.
 * `tone` follows the page like Nav/Bar: "light" = neutral/300 over video and images, "dark" = black on white pages.
 * On = a filled dot breathing two rings out of it; off = a hollow dot, still. ON / OFF rolls letter by letter
 * when the state flips; hovering rolls SOUND and ON / OFF together, each letter by letter, and swells the dot. Replaces the brush-wave chip (git a5dba8b).
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
        <Flip text="On" shown={on} />
        <Flip text="Off" shown={!on} />
      </span>
    </button>
  );
}
