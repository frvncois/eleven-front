"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import party from "@/data/party.json";
import projects from "@/data/projects.json";
import { party as partyStore, usePartyPlays } from "@/lib/party";
import { sound } from "@/lib/sound";

const FILMS = party.films.map((slug) => projects.find((p) => p.slug === slug)).filter((p): p is (typeof projects)[number] => !!p);

/** Vimeo link → chrome-less, looping, unmuted background player. */
function embed(vimeo: string) {
  const m = vimeo.match(/vimeo\.com\/(\d+)(?:\/(\w+))?/);
  if (!m) return vimeo;
  const q = new URLSearchParams({ autoplay: "1", loop: "1", controls: "0", title: "0", byline: "0", portrait: "0", dnt: "1", muted: "0" });
  if (m[2]) q.set("h", m[2]);
  return `https://player.vimeo.com/video/${m[1]}?${q}`;
}

/**
 * V2's butterfly party: the screen becomes one of Eleven's films, full bleed, with its own
 * soundtrack. Each time it opens, the next film (and so the next music) plays, remembered for the
 * visit. Close, the butterfly, Esc or leaving the page ends it.
 */
export function VideoParty({ on }: { on: boolean }) {
  // Each switch-on advances the count (lib/party), so each party plays the next film.
  const plays = usePartyPlays();
  const index = ((plays % FILMS.length) + FILMS.length) % FILMS.length;
  const film = FILMS[index];

  useEffect(() => {
    if (!on) return;
    sound.setMuted(false);
    sound.unlock();
    sound.duck(); // the page's own sound steps aside for the film's
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && partyStore.set(false);
    window.addEventListener("keydown", onKey);
    return () => {
      sound.unduck();
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [on]);

  return (
    <AnimatePresence>
      {on && film && (
        <motion.div
          key={film.slug}
          role="dialog"
          aria-modal="true"
          aria-label={`Party: ${film.client}, ${film.short}`}
          className="fixed inset-0 z-[65] overflow-hidden bg-neutral-1000"
          initial={{ clipPath: "circle(0% at 100% 0%)" }}
          animate={{ clipPath: "circle(150% at 100% 0%)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.62, 0.05, 0.01, 0.99] }}
        >
          <iframe
            src={embed(film.vimeo)}
            title={film.title}
            allow="autoplay; fullscreen"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            // Cover the screen at 16:9 whatever its shape.
            style={{ width: "max(1440px, calc(var(--vh) * 16 / 9))", height: "max(var(--vh), calc(1440px * 9 / 16))" }}
          />
          <button
            type="button"
            onClick={() => partyStore.set(false)}
            className="t-accent absolute top-6 right-6 flex h-6 items-center bg-neutral-200 px-2 text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            Close
          </button>
          <p className="t-accent absolute bottom-6 left-6 text-neutral-0 uppercase">
            Now playing · {film.client} · {film.short}
          </p>
          <p className="t-accent absolute right-6 bottom-6 text-neutral-0 uppercase tabular-nums">
            {index + 1} / {FILMS.length}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
