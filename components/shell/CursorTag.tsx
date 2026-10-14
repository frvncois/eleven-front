"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { DUR, EASE_OUT } from "@/lib/motion";

/**
 * The one cursor tag (annotation: "cursors are tags following the original browser cursor,
 * not being the actual cursor"), after seventeenagency.com: the normal arrow stays, and a small tag
 * rides just below-right of its tip, nearly attached (a short spring), fading in and out.
 * Any element opts in with data-cursor="listen" (or play, close, hold…); the closest one under the
 * pointer wins. Grey chip from the Figma Cursor component. Mouse only: nothing on touch.
 */
export function CursorTag() {
  const [label, setLabel] = useState<string | null>(null);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.4 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
    const onMove = (e: PointerEvent) => {
      // The tag lives inside the zoomed stage: convert viewport px to design units. The offset is in
      // screen px so it clears the arrow at any zoom.
      const s = scale();
      x.set((e.clientX + 22) / s);
      y.set((e.clientY + 14) / s);
      const el = (e.target as Element | null)?.closest?.("[data-cursor]");
      setLabel(el?.getAttribute("data-cursor") || null);
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
            className="t-h6 block bg-neutral-200 px-2 py-1 whitespace-nowrap text-neutral-1000"
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
