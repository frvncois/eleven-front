"use client";

import { Flip } from "./LetterRoll";

type Option<V extends string> = { value: V; label: string };

/**
 * Toggle/View in Nav/Sub (Figma Revision on M2/Nav/Sub 7653:7913, Oct 19): one word next to the
 * sound toggle. Since 22 Oct both sit in their own grey chips (no slash), type and colour from the chip. It names the view you switch to;
 * a click swaps the views and the word rolls letter by letter into the other one, like ON / OFF.
 * Hover rolls the letters. Mixer pages and the Archive use it (replaces their LIST / GRID switches).
 */
export function ViewToggle<V extends string>({
  options,
  value,
  onChange,
}: {
  options: [Option<V>, Option<V>];
  value: V;
  onChange: (v: V) => void;
}) {
  const next = options.find((o) => o.value !== value)!;
  return (
    <button
      type="button"
      data-sound="off"
      aria-label={`Show as ${next.label.toLowerCase()}`}
      onClick={() => onChange(next.value)}
      className="group flex cursor-pointer items-center uppercase"
    >
      {/* Both words share one cell, clipped so the letters roll in and out. */}
      <span className="grid justify-items-end overflow-hidden">
        {options.map((o) => (
          <Flip key={o.value} text={o.label} shown={o.value === next.value} />
        ))}
      </span>
    </button>
  );
}
