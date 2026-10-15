"use client";

import Link from "next/link";
import { useState } from "react";
import { useVHref } from "@/lib/version";
import { SoundToggle } from "./SoundToggle";
import { MenuOverlay } from "./MenuOverlay";

/**
 * Nav/Sticky (Figma 7351:3530), V2: the floss logo top-left (home), page toggles + sound + MENU
 * top-right (annotation: the Archive grid/list button sits before the sound). MENU opens the overlay.
 * `tone="light"` inverts the logo on dark pages (home reel, longform).
 */
export function NavSticky({ toggles, tone = "dark" }: { toggles?: React.ReactNode; tone?: "dark" | "light" }) {
  const vhref = useVHref();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between p-margin">
        <Link href={vhref("/")} aria-label="Eleven, home" className="pointer-events-auto block transition-opacity duration-300 ease-out hover:opacity-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo-floss.webp" alt="" width={106.651} height={113.346} className={tone === "light" ? "invert" : ""} />
        </Link>
        {/* Every control here is 32 px tall, same as V1's toggles (Amélie, 15 Oct; was 24). */}
        <div className="pointer-events-auto flex h-8 items-center gap-2">
          <div className="flex h-8 items-center gap-2">{toggles}</div>
          <SoundToggle />
          <button
            type="button"
            data-sound="off"
            onClick={() => setOpen(true)}
            className="t-accent flex h-8 items-center bg-neutral-200 px-2 text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            Menu
          </button>
        </div>
      </header>
      <MenuOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
