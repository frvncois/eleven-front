"use client";

import { party, useParty } from "@/lib/party";

/**
 * Toggle/Butterfly (Figma 7439:5652). Click for the funny-animals easter egg (PartyMode → VideoParty).
 * Revision (Figma V2 · 10 · Contact): an aqua chip with the butterfly flapping slowly; while the party
 * is on, the chip runs through the accent colours and the butterfly flaps fast.
 */
export function ToggleButterfly() {
  const on = useParty();
  return (
    <button
      type="button"
      onClick={() => party.toggle()}
      aria-pressed={on}
      aria-label={on ? "Stop the party" : "Start the party"}
      className={`butterfly-chip relative block size-8 cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50 ${on ? "is-party" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/butterfly-glyph.svg" alt="" width={32} height={32} className="butterfly-flap block size-8" />
    </button>
  );
}
