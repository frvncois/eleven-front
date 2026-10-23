"use client";

import { Flip } from "@/components/shell/LetterRoll";

/**
 * Pause / play for the home reel, next to SOUND (desktop) or top right of the dock (phone). Same roll as the
 * GRID / LIST toggle: it names what a click does, and the letters roll into the other word.
 */
export function ReelToggle({ paused, onChange }: { paused: boolean; onChange: (paused: boolean) => void }) {
  return (
    <button
      type="button"
      data-sound="off"
      aria-label={paused ? "Play the reel" : "Pause the reel"}
      onClick={() => onChange(!paused)}
      className="group flex cursor-pointer items-center uppercase"
    >
      <span className="grid justify-items-end overflow-hidden">
        <Flip text="Pause" shown={!paused} />
        <Flip text="Play" shown={paused} />
      </span>
    </button>
  );
}
