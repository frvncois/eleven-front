"use client";

import { party, useParty } from "@/lib/party";
import ui from "@/data/ui.json";

/**
 * Toggle/Butterfly. Click for the funny-animals easter egg (PartyMode → VideoParty).
 * A chip in the page accent (Contact royal blue, Legal lime) with
 * the accent's ink for the butterfly (grey on royal blue, black on lime), flapping slowly; while the party is on, the chip runs through the accent colours and the
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
      data-cursor={ui.cursors.clickMe}
      data-cursor-tone="pink"
      className={`butterfly-chip relative block size-6 cursor-pointer ${on ? "is-party" : ""}`}
    >
      <span
        aria-hidden
        className="butterfly-flap block size-6 bg-(--accent-ink,var(--color-neutral-300))"
        style={{ maskImage: "url(/icons/butterfly-glyph.svg)", WebkitMaskImage: "url(/icons/butterfly-glyph.svg)", maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
      />
    </button>
  );
}
