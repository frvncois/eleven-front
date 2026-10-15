"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import site from "@/data/site.json";
import { sound } from "@/lib/sound";
import { themeColor } from "@/lib/motion";
import { SoundToggle } from "./SoundToggle";
import { MenuColumns } from "./MenuColumns";
import { Clock } from "./Clock";

const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * V2 · 03 · Menu · Open (Figma 7345:1685). A white panel drops over the page with the three
 * columns, Close and sound top-right, a line in the page's accent, Instagram and the LA clock.
 * Behind it the page blurs under a tint of its accent colour (annotation). Click outside, Close,
 * Esc or any link closes it.
 */
export function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const accent = themeColor(usePathname());
  const instagram = site.footer.social.find((s) => s.label === "Instagram")!.href;

  useEffect(() => {
    if (!open) return;
    sound.cue("menuOpen");
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
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60]" initial="out" animate="in" exit="out">
          <motion.button
            type="button"
            aria-label="Close menu"
            data-cursor="close"
            data-sound="off"
            onClick={onClose}
            className="absolute inset-0 cursor-default backdrop-blur-[10px]"
            style={{ background: `color-mix(in srgb, ${accent} 28%, transparent)` }}
            variants={{ out: { opacity: 0 }, in: { opacity: 1 } }}
            transition={{ duration: 0.5, ease: EASE }}
          />
          <motion.div
            className="absolute inset-x-0 top-0 h-[718px] overflow-hidden bg-neutral-0"
            variants={{ out: { y: "-100%" }, in: { y: 0 } }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <MenuColumns onNavigate={onClose} />
            <div className="absolute top-6 left-[1330px] flex items-center gap-[7px]">
              <SoundToggle size={24} />
              <button
                type="button"
                onClick={onClose}
                className="t-accent flex h-6 items-center bg-neutral-200 px-2 text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-floss.webp" alt="" width={263} height={279.5} className="pointer-events-none absolute top-[438px] left-[-20px]" />
            <p className="t-body absolute top-[678px] left-[496px]" style={{ color: accent }}>
              We love making sound.
            </p>
            <a href={instagram} target="_blank" rel="noreferrer" className="t-body absolute top-[678px] left-[963px] transition-opacity duration-200 hover:opacity-50">
              Instagram
            </a>
            <Clock className="t-body absolute top-[678px] left-[1295px]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
