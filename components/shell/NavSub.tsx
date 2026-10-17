"use client";

import Link from "next/link";
import { SoundToggle } from "./SoundToggle";

/**
 * Nav/Sub (Figma 7356:3263): the ELEVEN wordmark bottom-left (tilted 4°, difference blend so it
 * reads on any background), page toggles + the sound toggle bottom-right.
 * The wordmark is its own fixed layer: mix-blend-mode only blends within its stacking context,
 * so it must not sit inside the (z-indexed) toggle bar.
 */
export function NavSub({ toggles, wordmark = true }: { toggles?: React.ReactNode; wordmark?: boolean }) {
  return (
    <>
      {wordmark && (
      <Link
        href={"/"}
        data-gate
        aria-label="Eleven, home"
        className="fixed bottom-4 left-margin z-50 flex h-[27.341px] w-[101.18px] items-center justify-center mix-blend-difference transition-opacity duration-300 ease-out hover:opacity-50"
      >
        {/* White mark + difference = black on light pages, white on dark ones. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/eleven-wordmark.svg" alt="" width={100} height={20.4146} className="rotate-4 invert" />
      </Link>
      )}
      <div className="fixed right-margin bottom-4 z-50 flex items-center justify-end gap-1">
        {toggles}
        <SoundToggle />
      </div>
    </>
  );
}
