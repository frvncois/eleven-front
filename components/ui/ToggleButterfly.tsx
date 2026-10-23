"use client";

import { party, useParty } from "@/lib/party";

/**
 * Toggle/Butterfly (Figma 7439:5652). Click for the funny-animals easter egg (PartyMode → VideoParty).
 * Revision (Figma V2 · 10 · Contact): a chip in the page accent (Contact royal blue, Privacy lime: review note 9) with
 * the accent's ink for the butterfly (grey on royal blue, black on lime; review note 4, Oct 23; was aqua + black), flapping slowly; while the party is on, the chip runs through the accent colours and the
 * butterfly flaps fast. The glyph is a mask, so its colour is set here, not in the SVG.
 */
export function ToggleButterfly() {
  const on = useParty();
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        party.setOrigin({ x: r.left, y: r.top, w: r.width, h: r.height });
        party.toggle();
      }}
      aria-pressed={on}
      aria-label={on ? "Stop the party" : "Start the party"}
      data-cursor="click me"
      data-cursor-tone="pink"
      className={`butterfly-chip relative block size-6 cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50 ${on ? "is-party" : ""}`}
    >
      <span
        aria-hidden
        className="butterfly-flap block size-6 bg-(--accent-ink,var(--color-neutral-300))"
        style={{ maskImage: "url(/icons/butterfly-glyph.svg)", WebkitMaskImage: "url(/icons/butterfly-glyph.svg)", maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
      />
    </button>
  );
}
