"use client";

import Link from "next/link";
import { useState } from "react";
import { MixersBanner } from "@/components/mixers/MixersBanner";
import { usePathname } from "next/navigation";
import site from "@/data/site.json";
import { navSound, sound } from "@/lib/sound";
import { preloadArchive } from "@/lib/archive-preload";
import { usePhone } from "@/lib/device";
import ui from "@/data/ui.json";

// Column + alignment per link, in site.nav order (Mixers, Archive, Longform, About, Contact).
const NAV_CELLS = [
  "col-start-1 justify-self-start",
  "col-start-3 justify-self-start",
  "col-start-5 justify-self-center",
  "col-start-7 justify-self-end",
  "col-start-9 justify-self-end",
];

/**
 * Nav/Bar: five links on the 9-col grid, Heading/H4: cols 1 / 3 / 5 / 7 / 9,
 * aligned start / start / centre / end / end, so the gaps stay within ~8% of equal.
 * Hover = the link's colour (Mixers red, Archive aqua, Longform dark green, About pink, Contact royal blue),
 * 0.3 s ease-out, + a short sound: the link's own takes when Site Settings → nav gives it any,
 * otherwise the shared hover kit; the current page keeps the hover state.
 * `tone="light"` (neutral/300) where it sits on video: home, player.
 */
export function NavBar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const pathname = usePathname();
  const [mixersOpen, setMixersOpen] = useState(false);
  // Phone: the dock and its menu replace the bar (components/mobile/PhoneShell).
  if (usePhone()) return null;
  return (
    <>
    <nav
      aria-label={ui.regions.main}
      className={`grid-site fixed inset-x-0 top-0 z-50 items-center py-margin ${tone === "light" ? "text-neutral-300" : "text-neutral-1000"}`}
    >
      {site.nav.map((item, i) => {
        const current = pathname === item.match || pathname.startsWith(item.match + "/");
        const hover = navSound(item.key);
        // Hover = the link's own brand colour at full strength; the current page keeps it.
        const cls = `${NAV_CELLS[i]} t-h4 cursor-pointer whitespace-nowrap transition-colors duration-300 ease-out hover:text-(--hover) ${current ? "text-(--hover)" : ""}`;
        const style = { "--hover": `var(--color-${item.color})` } as React.CSSProperties;
        // Mixers opens the roster wedge (MixersBanner) instead of a page.
        if (item.label === "Mixers")
          return (
            <button key={item.label} type="button" data-sound="off" aria-current={current ? "page" : undefined} onClick={() => setMixersOpen(true)} onPointerEnter={() => sound.cue("navHover", hover)} className={`${cls} uppercase`} style={style}>
              {item.label}
            </button>
          );
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={current ? "page" : undefined}
            onPointerEnter={() => {
              sound.cue("navHover", hover);
              if (item.href === "/archive") preloadArchive();
            }}
            className={cls}
            style={style}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
    <MixersBanner open={mixersOpen} onClose={() => setMixersOpen(false)} />
    </>
  );
}
