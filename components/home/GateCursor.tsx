"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * The gate's cursor tag, after gehry.getty.edu: "Click anywhere to enable sound" rides with the
 * pointer while the gate is up. Same ride as CursorTag (just below-right of the arrow, short spring),
 * but black so it reads as the one instruction on the aqua panel. It waits low and centred until the
 * pointer moves (and stays there on touch), fades in after a beat, and hides over `[data-gate-skip]`.
 * `rest`: the resting top in design px for a screen `vh` design px tall (the phone rests it between
 * the line and the ELEVEN).
 */
const REST = (vh: number) => vh * 0.38;

export function GateCursor({ label, rest = REST }: { label: string; rest?: (vh: number) => number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.4 });
  const [hidden, setHidden] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
    // Resting spot before the first move: centred in the empty band between the line and the wordmark.
    const s = scale();
    x.jump(window.innerWidth / 2 / s);
    y.jump(rest(window.innerHeight / s));
    const t = window.setTimeout(() => setPlaced(true), 600);
    if (!window.matchMedia("(pointer: fine)").matches) return () => window.clearTimeout(t);
    const onMove = (e: PointerEvent) => {
      const k = scale();
      x.set((e.clientX + 22) / k);
      y.set((e.clientY + 14) / k);
      setFollowing(true);
      setHidden(!!(e.target as Element | null)?.closest?.("[data-gate-skip]"));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointermove", onMove);
    };
  }, [x, y, rest]);

  return (
    <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[900]" style={{ x: sx, y: sy }}>
      <motion.span
        className="t-h6 block bg-neutral-1000 px-2 py-1 whitespace-pre text-neutral-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: placed && !hidden ? 1 : 0, x: following ? "0%" : "-50%" }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
}
