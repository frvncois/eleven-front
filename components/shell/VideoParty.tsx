"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SWING } from "@/lib/motion";
import party from "@/data/party.json";
import { party as partyStore, usePartyPick } from "@/lib/party";
import { sound } from "@/lib/sound";
import { usePhone, appScale } from "@/lib/device";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import site from "@/data/site.json";

const ITEMS = party.items;

/**
 * The butterfly easter egg (Contact, Privacy), desktop and phone. Click the butterfly: a random picture (later a
 * video) opens from it in a circle wipe and covers everything, navs and dock included, with its own
 * music when Eleven's audio arrives. Only the butterfly stays, in the same spot (flapping fast, it closes the party),
 * plus a CLOSE tag: bottom right on the phone (MENU's spot), top right on desktop (the player's). Esc closes too.
 * Each time it opens, a different one appears.
 */
export function VideoParty({ on }: { on: boolean }) {
  const pick = usePartyPick();
  const item = ITEMS[Math.max(0, pick) % ITEMS.length];
  const phone = usePhone();
  // The pressed butterfly (viewport px) in stage units (the stage is zoomed), and the reveal's centre on it.
  const o = partyStore.origin;
  const k = typeof document !== "undefined" ? appScale() : 1;
  const b = o ? { left: o.x / k, top: o.y / k, width: o.w / k, height: o.h / k } : null;
  const origin = o ? `${o.x + o.w / 2}px ${o.y + o.h / 2}px` : "97% 97%";

  useEffect(() => partyStore.setSize(ITEMS.length), []);

  useEffect(() => {
    if (!on) return;
    sound.setMuted(false);
    sound.unlock();
    window.__lenis?.stop();
    // Its music, looping, on the site's sound bus (so the sound toggle still mutes it).
    let audio: HTMLAudioElement | null = null;
    let off: (() => void) | undefined;
    if (item?.audio) {
      audio = new Audio(item.audio);
      audio.loop = true;
      off = sound.registerMedia(audio);
      audio.play().catch(() => {});
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && partyStore.set(false);
    window.addEventListener("keydown", onKey);
    return () => {
      audio?.pause();
      off?.();
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [on, item]);

  return (
    <AnimatePresence>
      {on && item && (
        <motion.div
          key={pick}
          role="dialog"
          aria-label="Easter egg"
          // Over everything (desktop navs z-50, phone dock z-80, menu z-79): only its own butterfly and CLOSE show.
          className="fixed inset-0 z-[96] overflow-hidden bg-neutral-1000"
          initial={{ clipPath: `circle(0% at ${origin})` }}
          animate={{ clipPath: `circle(160% at ${origin})` }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: SWING }}
        >
          {item.video ? (
            <video src={item.video} autoPlay loop muted playsInline className="absolute inset-0 size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="absolute inset-0 size-full object-cover" />
          )}
          {b && (
            <div className="absolute" style={b}>
              <ToggleButterfly />
            </div>
          )}
          <button
            type="button"
            onClick={() => partyStore.set(false)}
            className={phone ? "chip absolute right-margin bottom-4 cursor-pointer" : "chip absolute top-[24.38px] right-margin cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50"}
          >
            {site.player.close}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
