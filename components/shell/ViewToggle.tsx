"use client";

type Option<V extends string> = { value: V; label: string };

/**
 * Toggle/View in Nav/Sub: one word next to the sound toggle, in its own grey chip (type and colour from the chip). It
 * names the view you switch to; a click swaps the views and the word. No motion on hover, like every chip (after
 * Seventeen, Amélie Oct 23): the chip just steps one grey darker (globals.css). Both words
 * share one cell, so the chip keeps its width. Mixer pages and the Archive use it.
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
      className="flex cursor-pointer items-center uppercase"
    >
      <span className="grid justify-items-center">
        {options.map((o) => (
          <span key={o.value} aria-hidden className={`col-start-1 row-start-1 ${o.value === next.value ? "" : "invisible"}`}>
            {o.label}
          </span>
        ))}
      </span>
    </button>
  );
}
