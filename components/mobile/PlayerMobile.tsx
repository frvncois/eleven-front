"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VimeoPlayer from "@vimeo/player";
import type { Project } from "@/lib/content";
import { sound, useSound } from "@/lib/sound";
import { EASE_SWEEP, PHONE_MOTION } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";
import { Scrub, captionOf, creditsOf, embedUrl } from "@/components/mixers/Player";
import site from "@/data/site.json";
import { useDockCovered } from "./dock";

type Props = {
  films: Project[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  /** Longform: the film's description sits above the credits (Player/Info Panel Description). */
  longform?: boolean;
};

const SWIPE = 48;
// The film band: 16:9 across the 390, a little above the middle so the controls fit under it.
const FILM_H = 219.375;
const FILM_TOP = "calc(var(--vh) / 2 - 170px)";

/** A 16 × 16 grey square tag with a mini icon (10 × 10 glyph), inside a 32 px tap area. */
function Tag({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="-m-2 flex cursor-pointer p-2">
      <span className="flex size-4 items-center justify-center bg-neutral-200 text-neutral-1000">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          {children}
        </svg>
      </span>
    </button>
  );
}

// The chip system (square, neutral/200, black, Mobile/Nav caps, 34 tall), the same as the nav's.
const CHIP = "chip cursor-pointer";

/**
 * The player on a phone (mobile plan 3.6; no Figma mock, straight to code like Nimiopere's).
 * Portrait, kept lean and in the site's chip language (Amélie, Oct 22): the film is a 16:9 band a little above the
 * middle; top left the caption every project has, client and title in grey chips; under the film one quiet line:
 * 16 × 16 grey tags with mini icons (previous, pause / play, next), the scrub, the time, a fullscreen tag. + INFO
 * sits top right and opens the credits (+ description on Longform) right under it, small and right-aligned. SOUND and CLOSE sit where the nav's SOUND and MENU are, so the thumb never moves. Swiping the film
 * sideways = previous / next, tapping it = pause / play. Landscape: the film fills the screen, a CLOSE chip only (bottom right, as always).
 */
export function PlayerMobile({ films, index, onIndex, onClose, longform = false }: Props) {
  const open = index !== null;
  const film = open ? films[index] : null;
  const s = useSound();
  const muted = !(s.unlocked && !s.muted);
  useDockCovered(open);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [landscape, setLandscape] = useState(false);
  const [info, setInfo] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const step = (d: number) => index !== null && onIndex((index + d + films.length) % films.length);

  useEffect(() => {
    if (!open) return;
    sound.duck();
    window.__lenis?.stop();
    const orient = () => setLandscape(window.innerWidth > window.innerHeight);
    orient();
    window.addEventListener("resize", orient);
    return () => {
      sound.unduck();
      window.__lenis?.start();
      window.removeEventListener("resize", orient);
    };
  }, [open]);

  useEffect(() => {
    if (!film || !frameRef.current) return;
    const p = new VimeoPlayer(frameRef.current);
    playerRef.current = p;
    setTime(0);
    setDuration(film.duration ?? 0);
    setPlaying(true);
    p.on("timeupdate", (d: { seconds: number; duration: number }) => {
      setTime(d.seconds);
      if (d.duration) setDuration(d.duration);
    });
    p.on("play", () => {
      setPlaying(true);
      // The film starts muted (iOS only lets an embedded film start on its own without sound). With the site's
      // sound on, turn it up now; where the browser refuses (iPhone), the first touch in the player does it.
      if (!mutedRef.current) unmute(p);
    });
    p.on("pause", () => setPlaying(false));
    p.on("ended", () => onIndex((index! + 1) % films.length));
    return () => {
      p.off("timeupdate");
      p.off("play");
      p.off("pause");
      p.off("ended");
      playerRef.current = null;
    };
  }, [film, index, films.length, onIndex]);

  useEffect(() => {
    mutedRef.current = muted;
    const p = playerRef.current;
    if (!p) return;
    if (muted) p.setMuted(true).then(() => setSilent(false)).catch(() => {});
    else unmute(p);
  }, [muted]);

  // Ask Vimeo for sound and read back whether it took (a blocked unmute leaves the film muted): `silent` shows the
  // TAP FOR SOUND chip until a touch in the player succeeds.
  const mutedRef = useRef(muted);
  const [silent, setSilent] = useState(false);
  function unmute(p: VimeoPlayer) {
    p.setVolume(1)
      .then(() => p.setMuted(false))
      .then(() => p.getMuted())
      .then((m) => setSilent(m && !mutedRef.current))
      .catch(() => setSilent(!mutedRef.current));
  }

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    // Pause just pauses, Longform too (Amélie, Oct 23; it used to close the player).
    (playing ? p.pause() : p.play()).catch(() => {});
  };

  // Fullscreen: Vimeo's own (native on iPhone), else the film element.
  const fullscreen = () => {
    const p = playerRef.current;
    if (p) p.requestFullscreen().catch(() => frameRef.current?.requestFullscreen?.().catch(() => {}));
    else frameRef.current?.requestFullscreen?.().catch(() => {});
  };

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (duration) playerRef.current?.setCurrentTime(k * duration).catch(() => {});
  };

  const prev = index !== null ? films[(index - 1 + films.length) % films.length] : null;
  const next = index !== null ? films[(index + 1) % films.length] : null;
  const title = (f: Project) => f.short ?? f.title;

  return (
    <AnimatePresence onExitComplete={() => setInfo(false)}>
      {film && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${film.client}, ${title(film)}`}
          className="fixed inset-0 z-[90] overflow-hidden bg-neutral-1000 text-neutral-300"
          // Any touch in the player is a gesture iOS accepts: use it to give the film its sound.
          onPointerUpCapture={() => {
            if (silent && playerRef.current) unmute(playerRef.current);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={PHONE_MOTION.layer}
        >
          {/* Film strip, one 390 slide per film: posters, the live player on the current one. Portrait
              = a 16:9 band a little above the middle of the screen; landscape = the whole screen,
              covered like object-fit. */}
          <div
            className="absolute left-0 flex"
            style={{
              top: landscape ? 0 : FILM_TOP,
              height: landscape ? "var(--vh)" : FILM_H,
              width: films.length * 390,
              transform: `translateX(${-index! * 390}px)`,
              transition: `transform 800ms ${EASE_SWEEP}`,
            }}
          >
            {films.map((f, i) => (
              <div key={f.slug} className="relative h-full w-[390px] shrink-0 overflow-hidden bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.poster ?? ""} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
                {i === index && (
                  <iframe
                    key={f.slug}
                    ref={frameRef}
                    src={embedUrl(f.vimeo, true)}
                    title={f.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={landscape ? { width: "max(390px, calc(var(--vh) * 16 / 9))", height: `max(var(--vh), ${FILM_H}px)` } : { width: 390, height: FILM_H }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Tap = pause / play, sideways swipe = next / previous film. */}
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggle}
            onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              const t = touch.current;
              touch.current = null;
              if (!t) return;
              const dx = e.changedTouches[0].clientX - t.x;
              if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.changedTouches[0].clientY - t.y)) {
                e.preventDefault();
                step(dx < 0 ? 1 : -1);
              }
            }}
            className="absolute left-0 w-[390px]"
            style={landscape ? { top: 0, height: "var(--vh)" } : { top: FILM_TOP, height: FILM_H }}
          />

          {/* Sound is on but the phone kept the film muted: say so, on the film. A touch anywhere fixes it. */}
          {silent && !landscape && (
            <span
              className="chip pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ top: `calc(${FILM_TOP} + ${FILM_H / 2}px)` }}
            >
              Tap for sound
            </span>
          )}

          {/* Top left: the project's caption, client and title in grey chips (the same pair as the Archive list). */}
          <div className={`pointer-events-none absolute top-[20.5px] left-margin flex max-w-[230px] flex-col items-start transition-opacity duration-300 ${landscape ? "opacity-0" : ""}`}>
            <span className="chip-client">{captionOf(film).client}</span>
            {captionOf(film).name && <span className="chip-title">{captionOf(film).name}</span>}
          </div>

          {/* + INFO top right (Amélie, Oct 22); the credits (and the description on Longform) open right under it,
              right-aligned, in small type: each row a grey tag, the name in 12 bold, the role in 10 caps. */}
          {!landscape && (
            <div className="absolute top-[20.5px] right-margin z-10 flex max-w-[240px] flex-col items-end gap-1">
              <button type="button" aria-expanded={info} onClick={() => setInfo((v) => !v)} className={CHIP}>
                {info ? "− Info" : "+ Info"}
              </button>
              <AnimatePresence>
                {info && (
                  <motion.div
                    key="credits"
                    className="flex flex-col items-end gap-2"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={PHONE_MOTION.reveal}
                  >
                    {/* The credits as one block: the tags touch, each 1 px over the one above (Amélie, Oct 22); the
                        description is a second block, 8 under it. */}
                    <div className="flex flex-col items-end">
                      {creditsOf(film).map(([name, role], i) => (
                        <span
                          key={role}
                          className={`flex items-baseline gap-1.5 bg-neutral-200 px-1.5 py-[3px] text-right text-neutral-1000 ${i ? "-mt-px" : ""}`}
                        >
                          <span className="font-sans text-[12px] leading-[1.2] font-bold">{name}</span>
                          <span className="font-sans text-[9px] leading-none font-bold uppercase">{role}</span>
                        </span>
                      ))}
                    </div>
                    {longform && film.description && (
                      <p className="bg-neutral-200 px-1.5 py-[3px] text-right font-sans text-[12px] leading-[1.3] font-medium text-neutral-1000">{film.description}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {landscape && (
            <button type="button" onClick={onClose} className={`${CHIP} absolute right-margin bottom-4`}>
              {site.player.close}
            </button>
          )}

          {!landscape && (
            <div className="absolute inset-x-0 flex flex-col gap-4 px-margin" style={{ top: `calc(${FILM_TOP} + ${FILM_H + 16}px)` }}>
              {/* One quiet line under the film (Amélie, Oct 22): previous, pause / play, next as 16 × 16 grey tags with
                  mini icons, the scrub, the time in small grey, fullscreen at the end. Each tag has a 32 px tap area. */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {films.length > 1 && prev && (
                    <Tag label={`Previous: ${title(prev)}`} onClick={() => step(-1)}>
                      <path d="M2 1h1.5v8H2zM9 1v8L4 5z" />
                    </Tag>
                  )}
                  <Tag label={playing ? "Pause" : "Play"} onClick={toggle}>
                    {playing ? <path d="M2.5 1.5h2v7h-2zM5.5 1.5h2v7h-2z" /> : <path d="M3 1.5v7L8.5 5z" />}
                  </Tag>
                  {films.length > 1 && next && (
                    <Tag label={`Next: ${title(next)}`} onClick={() => step(1)}>
                      <path d="M6.5 1H8v8H6.5zM1 1v8l5-4z" />
                    </Tag>
                  )}
                </div>
                <Scrub time={time} duration={duration} onSeek={seek} />
                <Tag label="Fullscreen" onClick={fullscreen}>
                  <path d="M1 1h3v1.2H2.2V4H1zM9 1v3H7.8V2.2H6V1zM1 9V6h1.2v1.8H4V9zM9 9H6V7.8h1.8V6H9z" />
                </Tag>
              </div>

            </div>
          )}

          {/* SOUND bottom left and CLOSE bottom right, the same chips in the same spots as the nav's SOUND and MENU
              (Amélie, Oct 22: sound is always on the left). */}
          {!landscape && (
            <button type="button" onClick={onClose} className={`${CHIP} absolute right-margin bottom-4`}>
              {site.player.close}
            </button>
          )}
          {!landscape && (
            <div
              className="chip absolute bottom-4 left-margin"
            >
              <SoundToggle />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
