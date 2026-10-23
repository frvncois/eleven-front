"use client";

import { useSound } from "@/lib/sound";

/**
 * Toggle/Sound: SOUND OFF / ON with a three-bar meter.
 * It takes its type and colour from the `chip` around it (globals.css), on desktop as on the phone,
 * so it reads the same on video and on white.
 * The current word is solid, the other dimmed; flipping rolls the solid copy up through a clipped cell.
 * The bars bounce while sound is on and rest as short stubs when it is off. `meter={false}` drops them (the sound
 * gate).
 */
export function SoundToggle({ meter = true }: { meter?: boolean }) {
  const s = useSound();
  const on = s.unlocked && !s.muted;

  return (
    <button
      type="button"
      aria-label={on ? "Mute sound" : "Turn sound on"}
      aria-pressed={on}
      data-sound-toggle
      onClick={() => s.toggle()}
      className="group flex cursor-pointer items-center gap-[0.25em] uppercase"
    >
      <span>Sound</span>
      <Word text="Off" active={!on} />
      <span className="opacity-35">/</span>
      <Word text="On" active={on} />
      {meter && (
        <span data-on={on} className="sound-meter ml-[0.25em] flex h-[0.7em] items-end gap-[0.12em]" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      )}
    </button>
  );
}

/** One word, two layers in a clipped cell: the dimmed copy leaves upwards as the solid one rises in from below. */
function Word({ text, active }: { text: string; active: boolean }) {
  const roll = "block transition-transform duration-500 ease-[cubic-bezier(0.04,0.69,0.31,0.98)]";
  return (
    <span className="relative block overflow-y-clip">
      <span className={`${roll} opacity-35 ${active ? "-translate-y-full" : "translate-y-0"}`}>{text}</span>
      <span className={`${roll} absolute inset-x-0 bottom-0 ${active ? "translate-y-0" : "translate-y-full"}`}>{text}</span>
    </span>
  );
}
