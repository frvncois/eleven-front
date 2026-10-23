"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";
import { DUR, EASE_OUT, THEME_INK, themeColor } from "@/lib/motion";
import { appScale } from "@/lib/device";

/**
 * The one cursor tag (annotation: "cursors are tags following the original browser cursor,
 * not being the actual cursor"), after seventeenagency.com: the normal arrow stays, and a small tag
 * rides just below-right of its tip, nearly attached (a short spring), fading in and out.
 * Any element opts in with data-cursor="listen" (or play, close, hold…); the closest one under the
 * pointer wins. Chip in the page's theme colour (the colour of its transition: Mixers royal blue,
 * About pink…), text black or grey for contrast. An element with data-cursor-tone="chip" gets the grey chip with black
 * text instead (the Mixers overlay, where the wedge already wears the page colour); "accent" = the page accent with its ink (the Mixers wedge's CLOSE, review note 16; grey text on the dark accents, notes 20 + 22); any other value is a brand colour
 * name with black text (data-cursor-tone="pink": the Contact butterfly's "click me", review note 8). Mouse only: nothing on touch.
 */
export function CursorTag() {
  const [label, setLabel] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);
  const bg = themeColor(usePathname());
  const ink = THEME_INK[bg] ?? "#bdbdbd"; // grey, never white (review note 3)
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.4 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      // The tag lives inside the zoomed stage: convert viewport px to design units. The offset is in
      // screen px so it clears the arrow at any zoom.
      const s = appScale();
      x.set((e.clientX + 22) / s);
      y.set((e.clientY + 14) / s);
      const el = (e.target as Element | null)?.closest?.("[data-cursor]");
      setLabel(el?.getAttribute("data-cursor") || null);
      setTone(el?.getAttribute("data-cursor-tone") || null);
    };
    const onLeave = () => setLabel(null);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  return (
    <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[900]" style={{ x: sx, y: sy }}>
      <AnimatePresence>
        {label && (
          <motion.span
            key={label}
            className="t-h6 block px-2 py-1 whitespace-nowrap"
            style={
              tone === "chip"
                ? { background: "var(--color-neutral-200)", color: "var(--color-neutral-1000)" }
                : tone === "accent"
                  ? // black on the light accents, grey on red / dark green / royal blue (review notes 20 + 22)
                    { background: bg, color: ink }
                  : tone
                  ? { background: `var(--color-${tone})`, color: "var(--color-neutral-1000)" }
                  : { background: bg, color: ink }
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.chip, ease: EASE_OUT }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
