"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import party from "@/data/party.json";
import { party as partyStore, usePartyPick } from "@/lib/party";
import { sound } from "@/lib/sound";

const ITEMS = party.items;

/**
 * The butterfly easter egg (Contact, Privacy), both versions. Click the butterfly: a random picture
 * (later a video) fills the screen behind the nav, with its own music when Eleven's audio arrives.
 * No interface at all: the flapping butterfly is the only way out (Esc works too). Each time it
 * opens, a different one appears.
 */
export function VideoParty({ on }: { on: boolean }) {
  const pick = usePartyPick();
  const item = ITEMS[Math.max(0, pick) % ITEMS.length];
  // The reveal opens from the butterfly, bottom right in Nav/Sub.
  const origin = "97% 97%";

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
          aria-hidden
          // Under the navs (z-50), so the butterfly stays on top and closes it.
          className="fixed inset-0 z-[45] overflow-hidden bg-neutral-1000"
          initial={{ clipPath: `circle(0% at ${origin})` }}
          animate={{ clipPath: `circle(160% at ${origin})` }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.62, 0.05, 0.01, 0.99] }}
        >
          {item.video ? (
            <video src={item.video} autoPlay loop muted playsInline className="absolute inset-0 size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="absolute inset-0 size-full object-cover" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
