"use client";

import { useEffect } from "react";
import { sound } from "@/lib/sound";

/**
 * Every button clicks (links get the page-transition sound instead). Opt out with data-sound="off"
 * on buttons that have their own sound (the Mixers nav link, the view toggle).
 */
export function ClickSound() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest?.("button");
      if (!b || b.dataset.sound === "off" || b.disabled) return;
      sound.cue("click");
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, []);
  return null;
}
