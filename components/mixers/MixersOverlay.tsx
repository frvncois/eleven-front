"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mixers } from "@/lib/content";
import { sound } from "@/lib/sound";
import { DUR, EASE_OUT } from "@/lib/motion";

// Figma "V1 · Mixers · overlay" (7455:4292) / Section/Mixers Overlay (7401:2016): each name's spot,
// and where its white icon appears on hover.
const LAYOUT: Record<string, { x: number; y: number; icon: { x: number; y: number; w: number; h: number } }> = {
  "jordan-meltzer": { x: 496, y: 278.5, icon: { x: 983, y: 211, w: 106, h: 200 } },
  "jeff-payne": { x: 561.5, y: 362.5, icon: { x: 289, y: 368, w: 114, h: 200 } },
  "aj-murillo": { x: 572.5, y: 446.5, icon: { x: 903, y: 379, w: 214, h: 200 } },
  "bob-gremore": { x: 523.5, y: 530.5, icon: { x: 172, y: 531, w: 270, h: 151 } },
  "bruce-bueckert": { x: 490.5, y: 614.5, icon: { x: 989, y: 547, w: 137, h: 200 } },
  "marco-tornillo": { x: 509.5, y: 698.5, icon: { x: 331, y: 631, w: 102, h: 200 } },
};

/**
 * The roster over whatever page you are on (annotation): the page blurs behind royal blue at 50 %,
 * background sound fades out, hovering a name shows its icon, clicking one opens that mixer's page.
 * Clicking anywhere else closes; a "close" tag follows the cursor outside the names. Esc closes too.
 */
export function MixersOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    sound.duck();
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      sound.unduck();
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence onExitComplete={() => setHover(null)}>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Mixers"
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.overlay, ease: EASE_OUT }}
        >
          <div className="absolute inset-0 bg-neutral-1000/25" />
          <button
            type="button"
            aria-label="Close"
            data-cursor="close"
            onClick={onClose}
            className="absolute inset-0 cursor-none bg-royal-blue/50 backdrop-blur-[10px]"
          />
          {/* Names are laid out on the 1024-high Figma frame, centred vertically on taller screens. */}
          <div className="pointer-events-none absolute inset-x-0 top-[calc(50%-512px)] h-[1024px]">
            {mixers.map((m) => {
              const l = LAYOUT[m.slug];
              return (
                <div key={m.slug}>
                  {m.icon?.white && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.icon.white}
                      alt=""
                      className="absolute object-contain transition-opacity duration-300 ease-out"
                      style={{ left: l.icon.x, top: l.icon.y, width: l.icon.w, height: l.icon.h, opacity: hover === m.slug ? 1 : 0 }}
                    />
                  )}
                  <Link
                    href={`/mixers/${m.slug}`}
                    onClick={onClose}
                    onPointerEnter={() => {
                      setHover(m.slug);
                      sound.cue("navHover");
                    }}
                    onPointerLeave={() => setHover((h) => (h === m.slug ? null : h))}
                    className="t-h2 pointer-events-auto absolute whitespace-nowrap text-neutral-200 [text-box:trim-both_cap_alphabetic]"
                    style={{ left: l.x, top: l.y }}
                  >
                    {m.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
