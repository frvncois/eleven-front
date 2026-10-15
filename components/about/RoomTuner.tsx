"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sound, type RoomHandle, type RoomPreset } from "@/lib/sound";

type Photo = { room: string; photo: string; preset: string; audio: string | null };
type Props = { label: string; hint: string; items: Photo[] };

const EASE = [0.62, 0.05, 0.01, 0.99] as const;
const THUMB_W = 76;
const THUMB_H = 46;
const scaleOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;

/**
 * "Hear the rooms" (About), the room tuner. One room fills the section; a column of every photo sits
 * on the right like a tape index. Hover a thumbnail for a taste of that room, click it and it grows
 * from its thumbnail to fill the section while its ambience fades in (the previous room fades out
 * under it). Then you walk around the room with the cursor: left/right pans the sound, lower in the
 * picture is closer (brighter, louder). A live line traces the room's sound next to its name.
 * Arrow keys step through the photos. Leaving the section fades the sound out.
 * Sounds are synthesized placeholders until Eleven's recordings fill `audio` in data/about.json.
 */
export function RoomTuner({ label, hint, items }: Props) {
  const section = useRef<HTMLElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const handle = useRef<{ room: string; h: RoomHandle } | null>(null);
  const preview = useRef<RoomHandle | null>(null);
  const meter = useRef<SVGPathElement>(null);
  const [active, setActive] = useState(0);
  const [from, setFrom] = useState<string | null>(null); // clip-path start for the growing photo
  const [listening, setListening] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 }); // the photo drifts a little with the cursor

  const current = items[active];

  const startRoom = (p: Photo) => {
    if (handle.current?.room === p.room) return;
    handle.current?.h.stop();
    handle.current = { room: p.room, h: sound.ambience(p.preset as RoomPreset, p.audio) };
    handle.current.h.setNear(0.6);
    setListening(true);
  };

  const choose = (i: number) => {
    // Listening is deliberate: bring the sound back even if the site was muted (as for films).
    sound.setMuted(false);
    sound.unlock();
    preview.current?.stop();
    preview.current = null;
    if (i !== active) {
      const t = thumbs.current[i]?.getBoundingClientRect();
      const s = section.current?.getBoundingClientRect();
      if (t && s) {
        const k = scaleOf();
        setFrom(`inset(${(t.top - s.top) / k}px ${(s.right - t.right) / k}px ${(s.bottom - t.bottom) / k}px ${(t.left - s.left) / k}px)`);
      }
      setActive(i);
    }
    startRoom(items[i]);
  };

  const taste = (p: Photo) => {
    if (handle.current?.room === p.room || preview.current) return;
    const h = sound.ambience(p.preset as RoomPreset, p.audio);
    h.setNear(0.35);
    preview.current = h;
    window.setTimeout(() => {
      h.stop();
      if (preview.current === h) preview.current = null;
    }, 650);
  };

  // Walk around: pointer position → pan, distance, and a small drift of the photo.
  const onMove = (e: React.PointerEvent) => {
    const r = section.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setLook({ x: (0.5 - x) * 24, y: (0.5 - y) * 16 });
    handle.current?.h.setPan(x * 2 - 1);
    handle.current?.h.setNear(y);
  };

  // The live line: the room's waveform, from the analyser.
  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(512);
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const a = handle.current?.h.analyser;
      const path = meter.current;
      if (!path) return;
      if (!a) return path.setAttribute("d", "M0 18 L180 18");
      a.getByteTimeDomainData(data);
      let d = "";
      for (let i = 0; i <= 60; i++) {
        const v = (data[Math.floor((i / 60) * (data.length - 1))] - 128) / 128;
        d += `${i ? "L" : "M"}${i * 3} ${18 + v * 16 * 3}`;
      }
      path.setAttribute("d", d);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Leaving the section (or the page) fades the room out; arrows step through photos while it is on screen.
  useEffect(() => {
    let visible = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (!visible && handle.current) {
          handle.current.h.stop();
          handle.current = null;
          setListening(false);
        }
      },
      { threshold: 0.35 },
    );
    if (section.current) io.observe(section.current);
    const onKey = (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key === "ArrowRight") choose((active + 1) % items.length);
      if (e.key === "ArrowLeft") choose((active - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  });

  useEffect(
    () => () => {
      handle.current?.h.stop();
      preview.current?.stop();
    },
    [],
  );

  return (
    <section
      ref={section}
      onPointerMove={onMove}
      data-cursor={listening ? "walk around" : "listen"}
      onClick={(e) => !(e.target as Element).closest("button") && choose(active)}
      // Annotation: 100vh, minus the nav and 24 px so the bar never overlaps it.
      className="relative h-[calc(var(--vh)-78px)] min-h-[600px] cursor-pointer overflow-hidden border-t border-neutral-1000 bg-neutral-1000 select-none"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={current.photo}
          className="absolute inset-0"
          initial={{ clipPath: from ?? "inset(0px 0px 0px 0px)" }}
          animate={{ clipPath: "inset(0px 0px 0px 0px)" }}
          exit={{ opacity: 0, transition: { delay: 0.75, duration: 0.01 } }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.photo}
            alt={current.room}
            draggable={false}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out"
            style={{ transform: `translate(${look.x}px, ${look.y}px) scale(1.06)` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Legibility: a soft shade at the bottom for the name and the strip. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[340px] bg-linear-to-t from-neutral-1000/65 to-transparent" />

      <div className="pointer-events-none absolute bottom-[96px] left-margin flex flex-col gap-3 text-neutral-0">
        <p className="t-eyebrow">{label}</p>
        <div className="flex items-end gap-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3
              key={current.room}
              className="t-h2 whitespace-nowrap"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {current.room}
            </motion.h3>
          </AnimatePresence>
          <svg viewBox="0 0 180 36" width={180} height={36} className="mb-2 overflow-visible" aria-hidden>
            <path ref={meter} d="M0 18 L180 18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="t-body-sm opacity-80">{listening ? "Move around the room." : hint}</p>
      </div>

      {/* The tape index: every photo, grouped by room, in a column on the right (clear of the fixed nav bars). */}
      <ul className="absolute top-1/2 right-margin flex -translate-y-1/2 flex-col items-end gap-1">
        {items.map((p, i) => (
          <li key={p.photo}>
            <motion.button
              ref={(el) => {
                thumbs.current[i] = el;
              }}
              type="button"
              aria-label={`Hear ${p.room}`}
              aria-current={i === active ? "true" : undefined}
              data-cursor="listen"
              data-sound="off"
              onClick={() => choose(i)}
              onPointerEnter={() => taste(p)}
              className="relative block overflow-hidden outline-offset-2"
              style={{ width: THUMB_W, height: THUMB_H, outline: i === active ? "2px solid white" : "none" }}
              whileHover={{ x: -8 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.58, 1] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt="" draggable={false} className={`block size-full object-cover transition-opacity duration-300 ${i === active ? "" : "opacity-70 hover:opacity-100"}`} />
            </motion.button>
          </li>
        ))}
      </ul>
    </section>
  );
}
