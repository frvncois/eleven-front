"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VimeoPlayer from "@vimeo/player";
import type { Project } from "@/lib/content";
import { mixerBySlug } from "@/lib/content";
import { sound, useSound } from "@/lib/sound";
import { EASE_DISSOLVE } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";

/**
 * Open a film WITH sound, even if the visitor muted the site before: watching is a deliberate act.
 * Call it inside the click handler (the gesture lets the browser start audio), before the player opens.
 */
export function openWithSound(open: () => void) {
  sound.setMuted(false);
  sound.unlock();
  open();
}

/** Vimeo share link (vimeo.com/<id>/<hash>) → chrome-less player URL; our own controls drive it. */
function embedUrl(vimeo: string, muted: boolean) {
  const m = vimeo.match(/vimeo\.com\/(\d+)(?:\/(\w+))?/);
  if (!m) return vimeo;
  const q = new URLSearchParams({ autoplay: "1", controls: "0", title: "0", byline: "0", portrait: "0", dnt: "1", muted: muted ? "1" : "0" });
  if (m[2]) q.set("h", m[2]);
  return `https://player.vimeo.com/video/${m[1]}?${q}`;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type Props = { films: Project[]; index: number | null; onIndex: (i: number) => void; onClose: () => void };

/**
 * V1 · 06 · Project player (Figma 7345:1485, Player/Stage 7356:4931). An overlay over the mixer page,
 * so closing is instant. The film fills the screen; the films of this mixer sit on a horizontal strip
 * and the next one slides in when a film ends. Over it: title + mixer top-left, the credits "+" panel
 * mid-left (Player/Info Panel), time / scrub / duration bottom-left, Close top-right, sound
 * bottom-right. Clicking the film pauses / plays (annotation), with a play / pause cursor tag.
 */
export function Player({ films, index, onIndex, onClose }: Props) {
  const open = index !== null;
  const film = open ? films[index] : null;
  const s = useSound();
  const muted = !(s.unlocked && !s.muted);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ratio, setRatio] = useState(16 / 9);
  const [info, setInfo] = useState(false);

  // Overlay lifecycle: duck the page's sound, freeze the page scroll, Esc closes.
  useEffect(() => {
    if (!open) return;
    sound.duck();
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index! + 1) % films.length);
      if (e.key === "ArrowLeft") onIndex((index! - 1 + films.length) % films.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      sound.unduck();
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, index, films.length, onClose, onIndex]);

  // One Vimeo player per film shown.
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
    p.on("play", () => setPlaying(true));
    p.on("pause", () => setPlaying(false));
    p.on("ended", () => onIndex((index! + 1) % films.length));
    Promise.all([p.getVideoWidth(), p.getVideoHeight()])
      .then(([w, h]) => w && h && setRatio(w / h))
      .catch(() => {});
    return () => {
      p.off("timeupdate");
      p.off("play");
      p.off("pause");
      p.off("ended");
      playerRef.current = null;
    };
  }, [film, index, films.length, onIndex]);

  // The site's sound toggle drives the film's volume.
  useEffect(() => {
    playerRef.current?.setMuted(muted).catch(() => {});
  }, [muted]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    (playing ? p.pause() : p.play()).catch(() => {});
  }, [playing]);

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (duration) playerRef.current?.setCurrentTime(k * duration).catch(() => {});
  };

  const mixer = film?.mixer ? mixerBySlug(film.mixer) : undefined;
  const credits = film
    ? ([
        mixer && [mixer.name, "Mix"],
        mixer && [mixer.name, "Sound design"],
        film.agency && [film.agency, "Agency"],
        film.production && [film.production, "Production"],
        film.director && [film.director, "Director"],
      ].filter(Boolean) as [string, string][])
    : [];

  return (
    <AnimatePresence onExitComplete={() => setInfo(false)}>
      {film && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${film.client}, ${film.short ?? film.title}`}
          className="fixed inset-0 z-[70] overflow-hidden bg-neutral-1000 text-neutral-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_DISSOLVE }}
        >
          {/* Film strip: posters for every film, the live player on the current one. */}
          <div
            className="absolute inset-y-0 left-0 flex transition-transform duration-[800ms] ease-[cubic-bezier(0.62,0.05,0.01,0.99)]"
            style={{ width: films.length * 1440, transform: `translateX(${-index! * 1440}px)` }}
          >
            {films.map((f, i) => (
              <div key={f.slug} className="relative h-full w-[1440px] shrink-0 overflow-hidden bg-neutral-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.poster ?? ""} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
                {i === index && (
                  <iframe
                    key={f.slug}
                    ref={frameRef}
                    src={embedUrl(f.vimeo, muted)}
                    title={f.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    // Cover the screen like object-fit: cover, whatever the film's ratio.
                    className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: `max(1440px, calc(var(--vh) * ${ratio}))`, height: `max(var(--vh), calc(1440px / ${ratio}))` }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Click the film to pause / play. */}
          <button type="button" aria-label={playing ? "Pause" : "Play"} data-cursor={playing ? "pause" : "play"} onClick={toggle} className="absolute inset-0 cursor-default" />

          <div className="pointer-events-none absolute inset-y-6 left-6 w-[461px]">
            <div className="flex w-[300px] flex-col">
              <p className="t-body-lg">{film.short ?? film.title}</p>
              <p className="t-body">{mixer?.name ?? film.client}</p>
            </div>

            {/* Player/Info Panel: + opens the credits, − closes them. */}
            <div className="pointer-events-auto absolute top-[calc(50%+36.5px)] left-0 -translate-y-1/2">
              <button
                type="button"
                aria-expanded={info}
                aria-label={info ? "Hide credits" : "Show credits"}
                onClick={() => setInfo((v) => !v)}
                className="flex size-6 items-center justify-center rounded-full bg-neutral-200 transition-opacity duration-300 ease-out hover:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={info ? "/icons/icon-minus.svg" : "/icons/icon-plus.svg"} alt="" width={24} height={24} />
              </button>
              <motion.ul
                className="flex flex-col overflow-hidden pt-4 text-neutral-1000"
                initial={false}
                animate={{ height: info ? "auto" : 16, opacity: info ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EASE_DISSOLVE }}
              >
                {credits.map(([name, role]) => (
                  <li key={role} className="flex w-max items-start gap-2 bg-bg-alt px-2 py-1 whitespace-nowrap">
                    <span className="t-body-lg">{name}</span>
                    <span className="t-caption">{role}</span>
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* Controls: 0:12 ——— 0:30 (pause / play lives on the cursor tag) */}
            <div className="pointer-events-auto absolute right-0 left-0 flex h-3 items-center gap-[25px]" style={{ top: "calc(var(--vh) - 60px)" }}>
              <div className="flex w-[397px] items-center gap-4 text-bg-alt">
                <span className="t-h6 tabular-nums">{fmt(time)}</span>
                <div onPointerDown={seek} className="relative flex h-3 flex-1 cursor-pointer items-center">
                  <div className="h-0.5 w-full bg-neutral-500">
                    <div className="h-full bg-bg-alt" style={{ width: duration ? `${(time / duration) * 100}%` : 0 }} />
                  </div>
                </div>
                <span className="t-h6 tabular-nums">{fmt(duration)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="t-accent absolute top-[24.38px] left-[1359.5px] bg-neutral-200 px-2 py-1 text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            Close
          </button>
          <div className="absolute left-[1383.5px] border border-neutral-0" style={{ top: "calc(var(--vh) - 56px)" }}>
            <SoundToggle />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
