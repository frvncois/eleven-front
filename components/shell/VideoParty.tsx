"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SWING } from "@/lib/motion";
import party from "@/data/party.json";
import { party as partyStore, usePartyPick } from "@/lib/party";
import { sound } from "@/lib/sound";
import { usePhone, appScale } from "@/lib/device";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import site from "@/data/site.json";
import { useDialogFocus } from "@/lib/dialog-focus";
import { PARTY_PLACEMENT } from "@/lib/layout";

type Item = (typeof party.items)[number];
type Place = (typeof PARTY_PLACEMENT)[number];
const ITEMS: Item[] = party.items;

// Where the picture sits on its colour, from the 1440 × 900 frames (lib/layout): a corner or the middle
// on the 24 margins (16 on the phone), or a share of the height from the top. The shape is the picture's
// own, so swapping it in Strapi keeps its proportions. On the phone they run at 62 % of the desktop width.
function placeOf(item: Item, place: Place, phone: boolean): React.CSSProperties {
  const m = phone ? 16 : 24;
  const width = phone ? Math.min(358, Math.round(place.width * 0.62)) : place.width;
  const s: React.CSSProperties = {
    width,
    aspectRatio: `${item.imageWidth} / ${item.imageHeight}`,
    maxHeight: `calc(100% - ${2 * m}px)`,
  };
  if (place.x === "left") s.left = m;
  else if (place.x === "right") s.right = m;
  else s.left = "50%";
  if (place.y === "top") s.top = m;
  else if (place.y === "bottom") s.bottom = m;
  else if (place.y === "center") s.top = "50%";
  else s.top = `${place.y * 100}%`;
  const tx = place.x === "center" ? "-50%" : "0";
  const ty = place.y === "center" ? "-50%" : "0";
  if (tx !== "0" || ty !== "0") s.translate = `${tx} ${ty}`;
  return s;
}

/**
 * The butterfly easter egg (Contact, Legal), desktop and phone. Click the butterfly: a picture on a brand colour
 * (later a video) opens from it in a circle wipe and covers everything, navs and dock included, with its own
 * music when Eleven's audio arrives. Only the butterfly stays, in the same spot (flapping fast, it closes the party),
 * plus a way out: on desktop a click anywhere, with the CLOSE cursor tag; on the phone a CLOSE chip bottom right (MENU's spot).
 * Esc closes too.
 * Each time it opens, the next one in order appears.
 */
export function VideoParty({ on }: { on: boolean }) {
  const pick = usePartyPick();
  const at = Math.max(0, pick) % ITEMS.length;
  const item = ITEMS[at];
  // The designed slots, in order; a seventh picture would reuse the first slot rather than land nowhere.
  const place = PARTY_PLACEMENT[at % PARTY_PLACEMENT.length];
  const phone = usePhone();
  // The pressed butterfly (viewport px) in stage units (the stage is zoomed), and the reveal's centre on it.
  const o = partyStore.origin;
  const k = typeof document !== "undefined" ? appScale() : 1;
  const b = o ? { left: o.x / k, top: o.y / k, width: o.w / k, height: o.h / k } : null;
  const origin = o ? `${o.x + o.w / 2}px ${o.y + o.h / 2}px` : "97% 97%";

  const layer = useRef<HTMLDivElement>(null);
  useDialogFocus(on, layer);

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
          ref={layer}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={party.ariaLabel}
          // Over everything (desktop navs z-50, phone dock z-80, menu z-79): only its own butterfly (and the phone's CLOSE) show.
          className="fixed inset-0 z-[96] overflow-hidden outline-none"
          style={{ backgroundColor: `var(--color-${item.bg})` }}
          initial={{ clipPath: `circle(0% at ${origin})` }}
          animate={{ clipPath: `circle(160% at ${origin})` }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: SWING }}
        >
          {/* Desktop: the whole screen closes it, with the CLOSE cursor tag (like the Mixers wedge), no corner chip. */}
          {!phone && (
            <button
              type="button"
              aria-label={site.player.close}
              data-cursor={party.closeCursor}
              data-cursor-tone="chip"
              onClick={() => partyStore.set(false)}
              className="absolute inset-0 cursor-default"
            />
          )}
          {item.video ? (
            <video src={item.video} autoPlay loop muted playsInline className="pointer-events-none absolute inset-0 size-full object-cover" />
          ) : (
            <motion.img
              src={item.image}
              alt=""
              width={place.width}
              height={Math.round((place.width * item.imageHeight) / item.imageWidth)}
              className="pointer-events-none absolute object-cover"
              style={placeOf(item, place, phone)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: SWING }}
            />
          )}
          {b && (
            <div className="absolute" style={b}>
              <ToggleButterfly />
            </div>
          )}
          {phone && (
            <button type="button" onClick={() => partyStore.set(false)} className="chip absolute right-margin bottom-4 cursor-pointer">
              {site.player.close}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
