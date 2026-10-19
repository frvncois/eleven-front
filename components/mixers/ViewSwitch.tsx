"use client";

import { TextToggle } from "@/components/ui/TextToggle";

export type MixerView = "carousel" | "grid";

const OPTIONS: { value: MixerView; label: string }[] = [
  { value: "carousel", label: "List" },
  { value: "grid", label: "Grid" },
];

/**
 * Mixer page view switch (Figma Revision on V2 · 05 · Mixer · Grid / V1 · 05 · Mixer · Carousel,
 * "list / grid toggle view button", Oct 19): LIST and GRID centred on the page axis right under the
 * mixer name (16 apart; Amélie, Oct 19), in Mixers red. Replaces the icon toggle.
 * z-10: the Warp carousel's drag layer reaches 220 px above the strip's centre and could cover it.
 */
export function ViewSwitch({ view, onChange }: { view: MixerView; onChange: (v: MixerView) => void }) {
  return <TextToggle label="View" options={OPTIONS} value={view} onChange={onChange} accent="red" className="relative z-10 justify-center gap-gutter" />;
}
