"use client";

import { useSound } from "@/lib/sound";

/**
 * Toggle/Sound: SOUND OFF / ON with a three-bar meter.
 * It takes its type and colour from the `chip` around it (globals.css), on desktop as on the phone,
 * so it reads the same on video and on white.
 * The current word is solid, the other dimmed; flipping rolls the solid copy up through a clipped cell.
 * The bars bounce while sound is on and rest as short stubs when it is off. `meter={false}` drops them (the sound
 * gate). `stacked` (the sound gate): SOUND on its own line, OFF / ON centred 4 under it.
 * `onChoose` (the sound gate): OFF and ON are two answers, not a toggle. Each sets its own state (clicking OFF never
 * turns sound on) and then reports the choice.
 */
export function SoundToggle({ meter = true, stacked = false, onChoose }: { meter?: boolean; stacked?: boolean; onChoose?: (on: boolean) => void }) {
  const s = useSound();
  const on = s.unlocked && !s.muted;

  if (onChoose) {
    const choose = (want: boolean) => {
      s.setMuted(!want); // a click on ON is the gesture that unlocks audio
      onChoose(want);
    };
    return (
      <div data-sound-toggle className={`flex items-center uppercase ${stacked ? "flex-col gap-1" : "gap-[0.25em]"}`}>
        <span>Sound</span>
        <span className="flex items-center gap-[0.25em]">
          <button type="button" aria-label="Continue without sound" onClick={() => choose(false)} className="cursor-pointer uppercase">
            <Word text="Off" active={!on} />
          </button>
          <span className="opacity-35">/</span>
          <button type="button" aria-label="Turn sound on" onClick={() => choose(true)} className="cursor-pointer uppercase">
            <Word text="On" active={on} />
          </button>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={on ? "Mute sound" : "Turn sound on"}
      aria-pressed={on}
      data-sound-toggle
      onClick={() => s.toggle()}
      className={`group flex cursor-pointer items-center uppercase ${stacked ? "flex-col gap-1" : "gap-[0.25em]"}`}
    >
      <span>Sound</span>
      <span className="flex items-center gap-[0.25em]">
        <Word text="Off" active={!on} />
        <span className="opacity-35">/</span>
        <Word text="On" active={on} />
      </span>
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
