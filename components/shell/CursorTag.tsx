"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { DUR, EASE_OUT } from "@/lib/motion";

/**
 * The one cursor tag (annotation: "cursors are tags following the original browser cursor,
 * not being the actual cursor"). Any element opts in with data-cursor="listen" (or play, close…);
 * the closest one under the pointer wins. Grey chip from Button/Chip, spring-follows the pointer.
 * Mouse only: nothing on touch.
 */
export function CursorTag() {
  const [label, setLabel] = useState<string | null>(null);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 600, damping: 45, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 600, damping: 45, mass: 0.6 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
    const onMove = (e: PointerEvent) => {
      // The tag lives inside the zoomed stage: convert viewport px to design units.
      const s = scale();
      x.set(e.clientX / s + 14);
      y.set(e.clientY / s + 14);
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
            className="t-eyebrow block bg-neutral-100 px-2 py-1 whitespace-nowrap text-neutral-1000"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: DUR.chip, ease: EASE_OUT }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
