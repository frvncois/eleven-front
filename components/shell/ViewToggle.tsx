"use client";

import { Flip } from "./LetterRoll";

type Option<V extends string> = { value: V; label: string };

/**
 * Toggle/View in Nav/Sub (Figma Revision on M2/Nav/Sub 7653:7913, Oct 19): one word next to the
 * sound toggle, "GRID / SOUND ● OFF", same Heading/H4 and tone. It names the view you switch to;
 * a click swaps the views and the word rolls letter by letter into the other one, like ON / OFF.
 * Hover rolls the letters. Mixer pages and the Archive use it (replaces their LIST / GRID switches).
 */
export function ViewToggle<V extends string>({
  options,
  value,
  onChange,
  tone = "dark",
}: {
  options: [Option<V>, Option<V>];
  value: V;
  onChange: (v: V) => void;
  tone?: "dark" | "light";
}) {
  const next = options.find((o) => o.value !== value)!;
  return (
    // The text style sits on the button itself: buttons don't inherit text-transform.
    <span className={`mr-3 flex items-center gap-gutter ${tone === "light" ? "text-neutral-300" : "text-neutral-1000"}`}>
      <button
        type="button"
        data-sound="off"
        aria-label={`Show as ${next.label.toLowerCase()}`}
        onClick={() => onChange(next.value)}
        className="group t-h4 flex h-8 cursor-pointer items-center"
      >
        {/* Both words share one cell, clipped so the letters roll in and out; right-aligned so the
            gap to the "/" stays 16 whichever word shows. */}
        <span className="grid justify-items-end overflow-hidden">
          {options.map((o) => (
            <Flip key={o.value} text={o.label} shown={o.value === next.value} />
          ))}
        </span>
      </button>
      <span aria-hidden className="t-h4">
        /
      </span>
    </span>
  );
}
