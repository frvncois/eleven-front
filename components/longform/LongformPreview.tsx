"use client";

import { useEffect, useRef, useState } from "react";
import VimeoPlayer from "@vimeo/player";
import { motion, useReducedMotion } from "framer-motion";
import { embedUrl } from "@/components/mixers/Player";
import type { Film } from "./LongformReel";

/** The preview window: Eleven's 10 s loop. */
const WINDOW_S = 10;

/**
 * A longform film's preview: the film itself, muted, looping the 10 s from its `previewStart`
 * (Strapi → Project → previewStart; 0 where it is unset, so the loop opens the film).
 *
 * Only the film on screen gets a frame — one Vimeo stream at a time, the rule the Player follows
 * too — and it goes when the film leaves or the full player opens over it. The still stays
 * underneath as the first frame and never goes away: it covers the seconds before Vimeo has
 * painted, and it is the whole preview where the film cannot play (no network, autoplay refused,
 * reduced motion). While the still is alone it keeps the slow push-in it always had.
 *
 * Vimeo's own `loop` would restart at 0, so the window is held here: seek back on `timeupdate`.
 */
export function LongformPreview({
  film,
  active,
  stage,
  objectPosition,
}: {
  film: Film;
  active: boolean;
  /** The screen's width in CSS px — 1440 desktop, 390 phone — which the frame has to cover. */
  stage: number;
  objectPosition?: string;
}) {
  // Reduced motion: no autoplaying film, and the still sits at rest.
  const still = useReducedMotion();
  const frame = useRef<HTMLIFrameElement>(null);
  const [showing, setShowing] = useState(false);
  // Most films are 16:9; the real ratio arrives from Vimeo and corrects the cover sizing.
  const [ratio, setRatio] = useState(16 / 9);
  const start = film.previewStart ?? 0;

  useEffect(() => {
    if (!active || still || !frame.current) return;
    const p = new VimeoPlayer(frame.current);
    let gone = false;
    // `timeupdate` is also how we know Vimeo has painted: it fades the film in over the still.
    const onTime = ({ seconds }: { seconds: number }) => {
      if (gone) return;
      setShowing(true);
      // Past the window, or behind it after a loop: back to the top of the preview.
      if (seconds >= start + WINDOW_S || seconds < start - 1) p.setCurrentTime(start).catch(() => {});
    };
    p.setVolume(0).catch(() => {});
    if (start) p.setCurrentTime(start).catch(() => {});
    p.play().catch(() => {}); // autoplay refused, or no network: the still carries the preview
    p.on("timeupdate", onTime);
    Promise.all([p.getVideoWidth(), p.getVideoHeight()])
      .then(([w, h]) => !gone && w && h && setRatio(w / h))
      .catch(() => {});
    return () => {
      gone = true;
      setShowing(false);
      p.off("timeupdate", onTime);
      // The frame itself is unmounted by React; just stop the stream.
      p.pause().catch(() => {});
    };
  }, [active, still, start, film.vimeo]);

  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        // The push-in is the still standing in for the film; once the film plays it would fight it.
        animate={active && !still && !showing ? { scale: [1, 1.06] } : { scale: 1 }}
        transition={active && !still && !showing ? { duration: WINDOW_S, ease: "linear", repeat: Infinity, repeatType: "loop" } : { duration: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={film.poster ?? ""}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: objectPosition ?? "50% 50%" }}
          loading="lazy"
        />
      </motion.div>
      {active && !still && (
        <iframe
          ref={frame}
          src={embedUrl(film.vimeo, true)}
          title={film.title}
          // The whole film is the play button: the frame takes no pointer and no focus.
          tabIndex={-1}
          aria-hidden
          allow="autoplay; picture-in-picture"
          // Cover the screen whatever the film's ratio, the way the Player's frame does: size past
          // the short side and let the overflow crop. (`aspect-ratio` with both minimums does not
          // work here — the minimum clamps the short side without growing the long one, so the
          // film letterboxes inside the frame as soon as the screen is taller than its ratio.)
          className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ease-out"
          style={{
            width: `max(${stage}px, calc(var(--vh) * ${ratio}))`,
            height: `max(var(--vh), calc(${stage}px / ${ratio}))`,
            opacity: showing ? 1 : 0,
          }}
        />
      )}
    </>
  );
}
