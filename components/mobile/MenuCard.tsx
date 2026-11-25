"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import site from "@/data/site.json";
import { mixers } from "@/lib/content";
import { navSound, sound } from "@/lib/sound";
import { PHONE_MOTION } from "@/lib/motion";
import ui from "@/data/ui.json";

const UNFOLD = PHONE_MOTION.sheet;

/**
 * The phone menu: a card that unfolds upward from the
 * MENU chip, just above the chips. One row per page (no label on top) in Heading/H3 and its
 * colour, hairlines between them, the current page marked with a dot. MIXERS doesn't go anywhere: it
 * opens a drawer inside the card with the six mixers (the other pages fold away meanwhile, so it never scrolls), each with its icon.
 * While the drawer is open the card turns Mixers red, everything on it in red's grey ink (like the desktop wedge). Studio address and
 * Instagram at the foot. The page behind blurs; tapping it closes the card.
 */
export function MenuCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const { studio } = site.contact;
  const instagram = site.footer.social.find((x) => x.platform === "instagram");

  useEffect(() => {
    if (!open) return;
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const isCurrent = (match: string) => pathname === match || pathname.startsWith(match + "/");

  return (
    <AnimatePresence onExitComplete={() => setDrawer(false)}>
      {open && (
        <motion.div key="menu" className="fixed inset-0 z-[79]" initial="out" animate="in" exit="out">
          {/* The page behind goes soft while the menu is open; tapping it closes. The
              nav chips sit above this layer, so they stay sharp. */}
          <motion.button
            type="button"
            aria-label={ui.regions.closeMenu}
            onClick={onClose}
            className="absolute inset-0 cursor-default backdrop-blur-[6px]"
            variants={{ out: { opacity: 0 }, in: { opacity: 1 } }}
            transition={PHONE_MOTION.layer}
          />
          <motion.nav
            aria-label={ui.regions.main}
            className={`absolute inset-x-margin bottom-[48px] max-h-[calc(var(--vh)-110px)] overflow-y-auto transition-colors duration-300 ${drawer ? "bg-red text-neutral-300" : "bg-neutral-200"}`}
            data-lenis-prevent
            variants={{ out: { clipPath: "inset(100% 0 0 0)" }, in: { clipPath: "inset(0% 0 0 0)" } }}
            transition={UNFOLD}
          >
            <ul>
              {site.nav.map((item, i) => {
                // One colour per page, the same as the sweep and the nav (site.json); grey ink on the red card.
                const color = drawer ? "var(--color-neutral-300)" : `var(--color-${item.color})`;
                const current = isCurrent(item.match);
                const row = (
                  <span className="flex items-center gap-2.5">
                    {current && <span aria-hidden className="size-4 shrink-0 rounded-full" style={{ background: color }} />}
                    {item.label}
                  </span>
                );
                // Rows at 20 px (smaller than the 28 px H3).
                const cls = "t-h3 block w-full px-3 py-2.5 text-left phone:text-[20px]";
                return (
                  <motion.li
                    key={item.label}
                    className={`border-neutral-300 ${drawer && item.key !== "mixers" ? "border-b-0" : "border-b"}`}
                    variants={{ out: { opacity: 0, y: 12 }, in: { opacity: 1, y: 0 } }}
                    transition={{ ...PHONE_MOTION.reveal, delay: 0.12 + (site.nav.length - i) * 0.03 }}
                  >
                    {item.key === "mixers" ? (
                      <>
                        <button
                          type="button"
                          data-sound="off"
                          aria-expanded={drawer}
                          onClick={() => {
                            sound.cue("navHover", navSound(item.key));
                            setDrawer((v) => !v);
                          }}
                          className={`${cls} flex cursor-pointer items-center justify-between uppercase transition-colors duration-300`}
                          style={{ color }}
                        >
                          {row}
                          <span aria-hidden className="t-h4 transition-transform duration-300" style={{ transform: drawer ? "rotate(45deg)" : "none" }}>
                            +
                          </span>
                        </button>
                        {/* The drawer: the six mixers, each with their icon (Pez, calculator, Oreo, plate, broccoli, grater). */}
                        <AnimatePresence initial={false}>
                          {drawer && (
                            <motion.ul
                              key="drawer"
                              className="overflow-hidden"
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={PHONE_MOTION.reveal}
                            >
                              {mixers.map((m) => (
                                <li key={m.slug}>
                                  <Link
                                    href={`/mixers/${m.slug}`}
                                    onClick={() => pathname === `/mixers/${m.slug}` && onClose()}
                                    className="flex items-center gap-3 px-3 py-1"
                                  >
                                    {/* The icon in grey on the red card: its drawing used as a mask over a grey fill. */}
                                    <span
                                      aria-hidden
                                      className="block h-8 w-6 shrink-0 bg-neutral-300"
                                      style={
                                        m.icon?.black
                                          ? {
                                              maskImage: `url(${m.icon.black})`,
                                              WebkitMaskImage: `url(${m.icon.black})`,
                                              maskSize: "contain",
                                              WebkitMaskSize: "contain",
                                              maskRepeat: "no-repeat",
                                              WebkitMaskRepeat: "no-repeat",
                                              maskPosition: "center",
                                              WebkitMaskPosition: "center",
                                            }
                                          : { background: "none" }
                                      }
                                    />
                                    <span className="font-serif text-[20px] leading-none">{m.name}</span>
                                    {isCurrent(`/mixers/${m.slug}`) && <span aria-hidden className="size-2.5 rounded-full bg-neutral-300" />}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      // While the Mixers drawer is open the other pages fold away, so the card always fits the
                      // screen (the nav never scrolls); closing the drawer brings them back.
                      <motion.div
                        className="overflow-hidden"
                        initial={false}
                        animate={{ height: drawer ? 0 : "auto", opacity: drawer ? 0 : 1 }}
                        transition={PHONE_MOTION.reveal}
                      >
                        <Link href={item.href} tabIndex={drawer ? -1 : undefined} onClick={() => current && onClose()} className={cls} style={{ color }}>
                          {row}
                        </Link>
                      </motion.div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
            <motion.div
              className="t-accent flex items-end gap-2 px-3 py-3"
              variants={{ out: { opacity: 0 }, in: { opacity: 1 } }}
              transition={{ ...PHONE_MOTION.reveal, delay: 0.3 }}
            >
              <a href={studio.map} target="_blank" rel="noreferrer" className="flex-1">
                {studio.lines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </a>
              {instagram && (
                <a href={instagram.href} target="_blank" rel="noreferrer">
                  {instagram.label}
                </a>
              )}
            </motion.div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
