"use client";

import Link from "next/link";
import { useState } from "react";
import { MixersOverlay } from "@/components/mixers/MixersOverlay";
import { usePathname } from "next/navigation";
import site from "@/data/site.json";
import { sound } from "@/lib/sound";

/**
 * Nav/Bar (Figma 7356:3252): five links spread edge to edge, Heading/H4.
 * Hover = 50 % (0.3 s ease-out) + a short sound; the current page keeps the hover state (annotation).
 * `tone="light"` (neutral/300) where it sits on video: home, player.
 */
export function NavBar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const pathname = usePathname();
  const [mixersOpen, setMixersOpen] = useState(false);
  return (
    <>
    <nav
      aria-label="Main"
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between p-margin ${tone === "light" ? "text-neutral-300" : "text-neutral-1000"}`}
    >
      {site.nav.map((item) => {
        const current = pathname === item.match || pathname.startsWith(item.match + "/");
        const cls = `t-h4 cursor-pointer transition-opacity duration-300 ease-out hover:opacity-50 ${current ? "opacity-50" : ""}`;
        // Mixers opens the roster overlay instead of a page (annotation).
        if (item.label === "Mixers")
          return (
            <button key={item.label} type="button" onClick={() => setMixersOpen(true)} onPointerEnter={() => sound.cue("navHover")} className={`${cls} uppercase`}>
              {item.label}
            </button>
          );
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={current ? "page" : undefined}
            onPointerEnter={() => sound.cue("navHover")}
            className={cls}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
    <MixersOverlay open={mixersOpen} onClose={() => setMixersOpen(false)} />
    </>
  );
}
