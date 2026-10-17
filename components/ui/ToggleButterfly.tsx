"use client";

import { party, useParty } from "@/lib/party";

/**
 * Toggle/Butterfly (Figma 7439:5652). Click for the funny-animals easter egg (PartyMode → VideoParty): Still = the butterfly,
 * Active = grey chip with the butterfly flapping.
 */
export function ToggleButterfly() {
  const on = useParty();
  return (
    <button
      type="button"
      onClick={() => party.toggle()}
      aria-pressed={on}
      aria-label={on ? "Stop the party" : "Start the party"}
      className={`relative block size-8 cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50 ${on ? "bg-neutral-100" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/toggle-butterfly.svg" alt="" width={32} height={32} className={`block size-8 ${on ? "butterfly-flap" : ""}`} />
    </button>
  );
}
