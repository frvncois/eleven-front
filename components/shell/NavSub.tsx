"use client";

import Link from "next/link";
import { SoundToggle } from "./SoundToggle";
import { FlossLogo } from "./FlossLogo";

/**
 * Nav/Sub (Figma M2/Nav/Sub 7653:7913): the floss logo bottom-left, rising from the bar (it replaced
 * the ELEVEN wordmark, Oct 17), page toggles + the sound toggle bottom-right. On dark pages
 * (tone "light") the floss is inverted so it reads. Hover plays the floss animation from the live
 * Framer site (FlossLogo); press squeezes it like the live logo.
 */
export function NavSub({ toggles, wordmark = true, tone = "dark" }: { toggles?: React.ReactNode; wordmark?: boolean; tone?: "dark" | "light" }) {
  return (
    <>
      {wordmark && (
      <Link
        href={"/"}
        data-gate
        aria-label="Eleven, home"
        className="fixed bottom-4 left-margin z-50 block transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-90"
      >
        <FlossLogo tone={tone} />
      </Link>
      )}
      <div className="fixed right-margin bottom-4 z-50 flex items-center justify-end gap-1">
        {toggles}
        <SoundToggle tone={tone} />
      </div>
    </>
  );
}
