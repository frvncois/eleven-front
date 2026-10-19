"use client";

export type MixerView = "carousel" | "grid";

const OPTIONS: { view: MixerView; label: string }[] = [
  { view: "carousel", label: "List" },
  { view: "grid", label: "Grid" },
];

/**
 * Mixer page view switch (Figma Revision on V2 · 05 · Mixer · Grid / V1 · 05 · Mixer · Carousel,
 * "list / grid toggle view button", Oct 19): LIST and GRID in H6, centred on the page axis right
 * under the mixer name (16 apart; Amélie, Oct 19). The current view is Mixers red, the other
 * neutral/200; hover goes red (0.3 s ease-out, like the nav). Replaces the icon toggle.
 * z-10: the Warp carousel's drag layer reaches 220 px above the strip's centre and could cover it.
 */
export function ViewSwitch({ view, onChange }: { view: MixerView; onChange: (v: MixerView) => void }) {
  return (
    <div role="group" aria-label="View" className="t-h6 relative z-10 flex justify-center gap-gutter">
      {OPTIONS.map((o) => {
        const current = o.view === view;
        return (
          <button
            key={o.view}
            type="button"
            data-sound="off"
            aria-pressed={current}
            onClick={() => !current && onChange(o.view)}
            className={`cursor-pointer uppercase transition-colors duration-300 ease-out hover:text-red ${current ? "text-red" : "text-neutral-200"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
