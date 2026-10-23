"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VimeoPlayer from "@vimeo/player";
import { splitCaption, type Project } from "@/lib/content";
import { mixerBySlug } from "@/lib/content";
import { sound, useSound } from "@/lib/sound";
import { EASE_DISSOLVE } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";
import site from "@/data/site.json";

const labels = site.player;
// Every button in the player is the same small grey chip (CLOSE, + INFO, NEXT and SOUND one size,
// smaller than the site's 24 tall chip): `chip-sm`, 20 tall, 10 px bold caps, 6 px sides, hover 50 %.
const CHIP_SM = "chip-sm cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50";
// Like YouTube: after 5 s without moving the mouse the controls fade out (and the cursor with them); any move brings
// them back. They stay while the film is paused.
const IDLE_MS = 5000;

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
export function embedUrl(vimeo: string, muted: boolean) {
  const m = vimeo.match(/vimeo\.com\/(\d+)(?:\/(\w+))?/);
  if (!m) return vimeo;
  const q = new URLSearchParams({ autoplay: "1", controls: "0", title: "0", byline: "0", portrait: "0", dnt: "1", playsinline: "1", muted: muted ? "1" : "0" });
  if (m[2]) q.set("h", m[2]);
  return `https://player.vimeo.com/video/${m[1]}?${q}`;
}

const MIXER_TBC = "Mixer to confirm";

/** The film's credits rows, [name, role]: always a Mix row. */
export function creditsOf(film: Project): [string, string][] {
  const mixer = film.mixer ? mixerBySlug(film.mixer) : undefined;
  return [
    // Always name the mixer. Six longform films are not credited on
    // Eleven's site, so they show a placeholder until Eleven sends the names.
    [mixer?.name ?? MIXER_TBC, "Mix"],
    mixer && [mixer.name, "Sound design"],
    film.agency && [film.agency, "Agency"],
    film.production && [film.production, "Production"],
    film.director && [film.director, "Director"],
  ].filter(Boolean) as [string, string][];
}

/**
 * A project's caption pair without repeats: Longform's labels read "Client · Title", so they are
 * split on the "·" into the two chips; a title that only repeats the client ("Alice Gu") is not shown twice.
 */
export const captionOf = (f: Project) => splitCaption(f.short ?? f.title, f.client);

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** The film's scrub line and time, one look on both players: a 1 px line, the time as "0:12 / 0:30". */
export function Scrub({ time, duration, onSeek }: { time: number; duration: number; onSeek: (e: React.PointerEvent<HTMLDivElement>) => void }) {
  return (
    <>
      <div onPointerDown={onSeek} className="relative flex h-8 flex-1 cursor-pointer items-center">
        <div className="h-px w-full bg-neutral-700">
          <div className="h-full bg-neutral-300" style={{ width: duration ? `${(time / duration) * 100}%` : 0 }} />
        </div>
      </div>
      <span className="shrink-0 font-sans text-[12px] leading-none font-bold text-neutral-400 tabular-nums">
        {fmt(time)} / {fmt(duration)}
      </span>
    </>
  );
}

type Props = {
  films: Project[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  /**
   * Longform: the info panel also shows
   * the film's description. Pausing just pauses, as everywhere.
   */
  longform?: boolean;
};

/**
 * Project player.
 * An overlay over the mixer page, so closing is instant. The film fills the screen; the films of this mixer sit on a
 * horizontal strip and the next one slides in when a film ends. Same chip language as the rest of the site and the
 * phone player: every action a grey `chip` (CLOSE, + INFO, NEXT, PAUSE / PLAY, SOUND), the caption
 * the client / title pair top-left, the credits as touching grey tags (name 12 bold, role 9 caps). Layout:
 * caption + CLOSE on one top line, + INFO and NEXT (a size smaller) at 471 / 1024 of the height, time / scrub /
 * duration bottom-left and SOUND bottom-right. No pause button: clicking the film pauses / plays.
 * The controls hide after 5 s without mouse movement while the film plays (IDLE_MS).
 */
export function Player({ films, index, onIndex, onClose, longform = false }: Props) {
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
  const [idle, setIdle] = useState(false);

  // Idle: any mouse move, click, key or wheel shows the controls and restarts the 5 s count.
  useEffect(() => {
    if (!open) return;
    let t = 0;
    const wake = () => {
      setIdle(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    wake();
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      window.clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [open]);
  const hidden = idle && playing;

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
    // Pause just pauses, Longform too (the player stays open and the film keeps its place).
    (playing ? p.pause() : p.play()).catch(() => {});
  }, [playing]);

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (duration) playerRef.current?.setCurrentTime(k * duration).catch(() => {});
  };

  const credits = film ? creditsOf(film) : [];

  return (
    <AnimatePresence onExitComplete={() => setInfo(false)}>
      {film && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${film.client}, ${film.short ?? film.title}`}
          className="fixed inset-0 z-[70] overflow-hidden bg-neutral-1000 text-neutral-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_DISSOLVE }}
        >
          {/* Film strip: posters for every film, the live player on the current one. */}
          <div
            className="absolute inset-y-0 left-0 flex transition-transform duration-[800ms] ease-sweep"
            style={{
              width: films.length * 1440,
              transform: `translateX(${-index! * 1440}px)`,
            }}
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
                    style={{
                      width: `max(1440px, calc(var(--vh) * ${ratio}))`,
                      height: `max(var(--vh), calc(1440px / ${ratio}))`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Click the film to pause / play. */}
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            data-cursor={hidden ? undefined : playing ? "pause" : "play"}
            onClick={toggle}
            className={`absolute inset-0 ${hidden ? "cursor-none" : "cursor-default"}`}
          />

          {/* Every control in one layer, so the idle fade hides them together (slow out, quick back in). */}
          <div
            className={`pointer-events-none absolute inset-0 transition-[opacity,visibility] ease-out ${hidden ? "invisible opacity-0 duration-700" : "duration-200"}`}
          >
            {/* Caption: client over title, the same pair as the mixer cards, the Archive and the phone player. */}
            <div className="pointer-events-none absolute top-[24.38px] left-margin flex flex-col items-start">
              <span className="chip-client">{captionOf(film).client}</span>
              {captionOf(film).name && <span className="chip-title">{captionOf(film).name}</span>}
            </div>

            {/* Player/Info Panel: "+ INFO" opens the credits under it, "− INFO" closes them. */}
            <div
              className="pointer-events-auto absolute left-margin flex flex-col items-start gap-2"
              style={{ top: "calc(var(--vh) * 471 / 1024)" }}
            >
              <button
                type="button"
                aria-expanded={info}
                aria-label={info ? "Hide credits" : "Show credits"}
                onClick={() => setInfo((v) => !v)}
                className={CHIP_SM}
              >
                {info ? "− Info" : "+ Info"}
              </button>
              <AnimatePresence>
                {info && (
                  <motion.div
                    key="credits"
                    className="flex flex-col items-start gap-2"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3, ease: EASE_DISSOLVE }}
                  >
                    {/* The credits as one block of touching tags, each 1 px over the one above, as on the phone. */}
                    <div className="flex flex-col items-start">
                      {credits.map(([name, role], i) => (
                        <span
                          key={role}
                          className={`flex items-baseline gap-1.5 bg-neutral-200 px-1.5 py-[3px] whitespace-nowrap text-neutral-1000 ${i ? "-mt-px" : ""}`}
                        >
                          <span className="font-sans text-[12px] leading-[1.2] font-bold">{name}</span>
                          <span className="font-sans text-[9px] leading-none font-bold uppercase">{role}</span>
                        </span>
                      ))}
                    </div>
                    {/* Player/Info Panel Description: longform films carry a description under the credits. */}
                    {longform && film.description && (
                      <p className="w-[304px] bg-neutral-200 px-1.5 py-[3px] font-sans text-[12px] leading-[1.3] font-medium text-neutral-1000">
                        {film.description}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {films.length > 1 && (
              <button
                type="button"
                aria-label="Next film"
                onClick={() => onIndex((index! + 1) % films.length)}
                className={`${CHIP_SM} pointer-events-auto absolute right-margin`}
                style={{ top: "calc(var(--vh) * 471 / 1024)" }}
              >
                Next
              </button>
            )}

            {/* Film player: the shared Scrub, 487 wide, on SOUND's line at the bottom (no pause button). */}
            <div
              className="pointer-events-auto absolute left-margin flex h-6 w-[487px] items-center"
              style={{ top: "calc(var(--vh) - 53px)" }}
            >
              <div className="flex flex-1 items-center gap-3">
                <Scrub time={time} duration={duration} onSeek={seek} />
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`${CHIP_SM} pointer-events-auto absolute top-[24.38px] right-margin`}
            >
              {labels.close}
            </button>
            {/* SOUND in the same small chip, centred on the time line (24 tall row at vh − 53). */}
          <div className="chip-sm pointer-events-auto absolute right-margin" style={{ top: "calc(var(--vh) - 51px)" }}>
              <SoundToggle />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
