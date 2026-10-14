"use client";

import { useSound } from "@/lib/sound";

/**
 * Toggle/Sound: 32 px grey chip with the waveform. Off = faded.
 * TODO: the Figma icons are looping videos (no export via MCP); swap in the real files when exported.
 */
export function SoundToggle() {
  const s = useSound();
  const on = s.unlocked && !s.muted;
  return (
    <button
      type="button"
      aria-label={on ? "Mute sound" : "Turn sound on"}
      aria-pressed={on}
      onClick={() => s.toggle()}
      className="block size-8 cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/sound.png"
        alt=""
        width={32}
        height={32}
        className={`transition-opacity duration-300 ease-out ${on ? "" : "opacity-40"}`}
      />
    </button>
  );
}
