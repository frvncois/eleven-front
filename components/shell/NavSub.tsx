"use client";

import Link from "next/link";
import { SoundToggle } from "./SoundToggle";

/**
 * Nav/Sub (Figma M2/Nav/Sub 7653:7913): the floss logo bottom-left, rising from the bar (it replaced
 * the ELEVEN wordmark, Oct 17), page toggles + the sound toggle bottom-right. On dark pages
 * (tone "light") the floss is inverted so it reads.
 */
export function NavSub({ toggles, wordmark = true, tone = "dark" }: { toggles?: React.ReactNode; wordmark?: boolean; tone?: "dark" | "light" }) {
  return (
    <>
      {wordmark && (
      <Link
        href={"/"}
        data-gate
        aria-label="Eleven, home"
        className="fixed bottom-4 left-margin z-50 block transition-opacity duration-300 ease-out hover:opacity-50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/logo-floss.webp" alt="" width={106.651} height={113.346} draggable={false} className={tone === "light" ? "invert" : ""} />
      </Link>
      )}
      <div className="fixed right-margin bottom-4 z-50 flex items-center justify-end gap-1">
        {toggles}
        <SoundToggle tone={tone} />
      </div>
    </>
  );
}
