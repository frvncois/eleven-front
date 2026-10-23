"use client";

import Link from "next/link";
import { SoundToggle } from "./SoundToggle";
import { FlossLogo } from "./FlossLogo";
import { usePhone } from "@/lib/device";

/**
 * Nav/Sub (Figma M2/Nav/Sub 7653:7913): the floss logo bottom-left, rising from the bar (it replaced
 * the ELEVEN wordmark, Oct 17), page toggles + the sound toggle bottom-right. On dark pages
 * (tone "light") the floss is inverted so it reads. Hover plays the floss animation from the live
 * Framer site (FlossLogo); press squeezes it like the live logo.
 */
export function NavSub({ toggles, bareToggles = false, wordmark = true, tone = "dark" }: { toggles?: React.ReactNode; bareToggles?: boolean; wordmark?: boolean; tone?: "dark" | "light" }) {
  // Phone: the dock (components/mobile/PhoneShell) carries the floss and the sound toggle.
  if (usePhone()) return null;
  return (
    <>
      {wordmark && (
      <Link
        href={"/"}
        aria-label="Eleven, home"
        className="fixed bottom-4 left-margin z-50 block transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-90"
      >
        <FlossLogo tone={tone} />
      </Link>
      )}
      {/* The page toggle and SOUND, each in a grey chip like the phone dock (Oct 22). `bareToggles`: a toggle that is
          its own chip (the butterfly on Privacy, review note 10, Oct 23) sits without the grey one around it. */}
      <div className="fixed right-margin bottom-4 z-50 flex items-center justify-end gap-2">
        {toggles && (bareToggles ? toggles : <div className="chip">{toggles}</div>)}
        <div className="chip">
          <SoundToggle />
        </div>
      </div>
    </>
  );
}
