"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_DISSOLVE } from "@/lib/motion";

type Item = { name: string; role: string; href: string | null };

/**
 * Contact footer "Credits". The link toggles a small box of
 * grey chips just above it (above rather than beside, so it never covers LinkedIn / Instagram); it opens and closes in steps:
 * rows rise and fade in one after another, fold back down on close. Click outside or Esc closes it.
 */
export function CreditsPopover({ label, items, className = "" }: { label: string; items: Item[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={className}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="t-mini block cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50"
      >
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="absolute bottom-[calc(100%+24px)] left-0 flex flex-col items-start"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{ open: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }, closed: { transition: { staggerChildren: 0.03 } } }}
          >
            {items.map((it) => {
              const body = (
                <>
                  <span className="t-body-lg">{it.name}</span>
                  <span className="font-sans text-[14px] leading-normal font-normal">{it.role}</span>
                </>
              );
              return (
                <motion.li
                  key={it.name}
                  className="overflow-hidden"
                  variants={{ open: { opacity: 1, y: 0 }, closed: { opacity: 0, y: 12 } }}
                  transition={{ duration: 0.35, ease: EASE_DISSOLVE }}
                >
                  {it.href ? (
                    <a href={it.href} target="_blank" rel="noreferrer" className="flex items-start gap-2 bg-bg-alt px-2 py-1 whitespace-nowrap transition-opacity duration-200 hover:opacity-50">
                      {body}
                    </a>
                  ) : (
                    <span className="flex items-start gap-2 bg-bg-alt px-2 py-1 whitespace-nowrap">{body}</span>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
