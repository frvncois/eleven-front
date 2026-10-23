"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import { mixers } from "@/lib/content";
import { sound } from "@/lib/sound";
import { usePathname } from "next/navigation";
import { EASE_DISSOLVE, SWING, THEME_INK, themeColor } from "@/lib/motion";

// Figma "mixers" (7712:9041): the wedge (yellow in Figma, the page accent here) runs full width from the top, its lower edge from
// 179.7 at the left to 581.9 at the right. Names sit in a stair along that edge.
const WEDGE = { left: 179.718, right: 581.946 };
const NAMES: Record<string, { x: number; y: number }> = {
  "jordan-meltzer": { x: 132, y: 57 },
  "jeff-payne": { x: 699, y: 57 },
  "aj-murillo": { x: 1150, y: 57 },
  "bob-gremore": { x: 533, y: 197 },
  "bruce-bueckert": { x: 1040, y: 197 },
  "marco-tornillo": { x: 942, y: 337 },
};
// Where each icon pops on hover: an empty patch of the wedge between the names (centre + height),
// kept inside the wedge.
const ICONS: Record<string, { cx: number; cy: number; h: number }> = {
  "jordan-meltzer": { cx: 300, cy: 180, h: 120 },
  "jeff-payne": { cx: 600, cy: 78, h: 100 },
  "aj-murillo": { cx: 1046, cy: 78, h: 100 },
  "bob-gremore": { cx: 735, cy: 305, h: 70 }, // smaller + clear of the diagonal, it was cropped (review note 14)
  "bruce-bueckert": { cx: 1380, cy: 450, h: 120 },
  "marco-tornillo": { cx: 1150, cy: 445, h: 90 },
};

/**
 * Mixers nav, option B (annotation on 7712:9041): clicking Mixers swings the wedge down from
 * the top, right corner first, left corner catching up, so the edge tilts into its angle. The page
 * behind blurs with no colour. Hovering a name pops its icon into an empty spot between the names;
 * clicking a name opens that mixer. Click outside or Esc closes (the wedge swings back up).
 * The wedge wears the page's accent (review note 6, Oct 23; was always yellow), names and icons in that colour's ink
 * (black or grey). Cursor (review note 16, Oct 23): the plain arrow over the wedge, the CLOSE tag only over the blurred
 * page, in the page accent with black text.
 */
export function MixersBanner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const still = useReducedMotion() ?? false;
  const accent = themeColor(usePathname());
  const ink = THEME_INK[accent] ?? "#bdbdbd";
  const [mounted, setMounted] = useState(open);
  const [hover, setHover] = useState<string | null>(null);
  const right = useMotionValue(0);
  const left = useMotionValue(0);
  const blur = useMotionValue(0);
  const clip = useMotionTemplate`polygon(0 0, 100% 0, 100% ${right}px, 0 ${left}px)`;
  const backdrop = useMotionTemplate`blur(${blur}px)`;

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    const t = still ? { duration: 0 } : null;
    if (open) {
      const ctl = [
        animate(blur, 10, t ?? { duration: 0.5, ease: EASE_DISSOLVE }),
        animate(right, WEDGE.right, t ?? { duration: 0.75, ease: SWING }),
        animate(left, WEDGE.left, t ?? { duration: 0.75, delay: 0.18, ease: SWING }),
      ];
      return () => ctl.forEach((c) => c.stop());
    }
    // Close: the left corner lifts first, then the right, so it swings back the way it came.
    const ctl = [
      animate(left, 0, t ?? { duration: 0.5, ease: SWING }),
      animate(right, 0, t ?? { duration: 0.5, delay: 0.1, ease: SWING }),
      animate(blur, 0, t ?? { duration: 0.5, delay: 0.1, ease: EASE_DISSOLVE }),
    ];
    let live = true; // reopening mid-close stops these; don't unmount then
    Promise.all(ctl).then(() => {
      if (!live) return;
      setMounted(false);
      setHover(null);
    });
    return () => {
      live = false;
      ctl.forEach((c) => c.stop());
    };
  }, [open, mounted, still, right, left, blur]);

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

  if (!mounted) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Mixers" className="fixed inset-0 z-[60]">
      <motion.button
        type="button"
        aria-label="Close"
        data-cursor="close"
        data-cursor-tone="accent"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ backdropFilter: backdrop, WebkitBackdropFilter: backdrop }}
      />
      <motion.div
        // Hit-testable (clip-path clips the hit area too), so the wedge itself is not "close": plain arrow, clicks stay.
        className="absolute inset-x-0 top-0 w-[1440px] cursor-default"
        style={{ height: WEDGE.right, clipPath: clip, background: accent, color: ink }}
      >
        {mixers.map((m) => {
          const icon = ICONS[m.slug];
          const on = hover === m.slug;
          return (
            m.icon?.black && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.slug}
                src={m.icon.black}
                alt=""
                className="absolute w-auto -translate-x-1/2 -translate-y-1/2 transition-[opacity,scale] duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ left: icon.cx, top: icon.cy, height: icon.h, opacity: on ? 1 : 0, scale: on ? 1 : 0.6, filter: ink === "#000000" ? undefined : "invert(74%)" }}
              />
            )
          );
        })}
        {mixers.map((m) => {
          const p = NAMES[m.slug];
          return (
            <Link
              key={m.slug}
              href={`/mixers/${m.slug}`}
              onClick={onClose}
              onPointerEnter={() => {
                setHover(m.slug);
                sound.cue("navHover");
              }}
              onPointerLeave={() => setHover((h) => (h === m.slug ? null : h))}
              className="t-h2 pointer-events-auto absolute whitespace-nowrap [text-box:trim-both_cap_alphabetic]"
              style={{ left: p.x, top: p.y }}
            >
              {m.name}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
