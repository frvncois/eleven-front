"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { ArchiveStyleSwitch } from "@/components/index/ArchiveStyleSwitch";
import { vhOf } from "./ArchiveLab";

/**
 * Archive · Tilt (Amélie, Oct 17: "subtle, still really UX friendly"). A plain, readable grid
 * (straight 16:9 tiles, titles always on) laid back like the ELEVEN wordmark: the sheet turns a few
 * degrees on its left edge, so the right side recedes towards a point off screen on the right, the
 * logo's direction. Scrolling deepens the angle a little and leans the sheet with the motion; it
 * settles back when you stop. The hovered tile turns to face you, flat, so it is never distorted
 * when you look at it.
 */
const COLS = 4;
const TILE_W = 300;
const GAP_X = 28;
const GAP_Y = 56;
const META = 30;
const TILE_H = Math.round((TILE_W * 9) / 16);
const ROW = TILE_H + META + GAP_Y;
const STAGGER = [0, 110, 40, 150]; // columns start at different heights: rhythm, not a spreadsheet
const REST_Y = 9; // degrees at rest, around the vertical axis (right side away)
const REST_X = 3; // and a touch backwards, like a sheet on a lectern

export function TiltView({ films }: { films: Project[] }) {
  const main = useRef<HTMLElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const rows = Math.ceil(films.length / COLS);
  const fieldW = COLS * TILE_W + (COLS - 1) * GAP_X;
  const fieldH = rows * ROW + Math.max(...STAGGER) + 200;

  useEffect(() => {
    const el = main.current;
    if (!el) return;
    let target = 0, y = 0, raf = 0, lean = 0;
    let drag: number | null = null;
    const max = () => Math.max(0, fieldH - vhOf() + 260);
    const clamp = (v: number) => Math.max(0, Math.min(max(), v));
    const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target = clamp(target + e.deltaY + e.deltaX);
    };
    const onDown = (e: PointerEvent) => (drag = e.clientY);
    const onMove = (e: PointerEvent) => {
      if (drag === null) return;
      target = clamp(target - (e.clientY - drag) / scale());
      drag = e.clientY;
    };
    const onUp = () => (drag = null);
    const onKey = (e: KeyboardEvent) => {
      const d = { ArrowDown: 300, ArrowUp: -300, PageDown: 700, PageUp: -700, " ": 700 }[e.key];
      if (d) target = clamp(target + d);
    };

    const tick = () => {
      const v = (target - y) * 0.1;
      y += v;
      // Speed adds a little angle and leans the sheet with the motion, never more than a few degrees.
      lean += (Math.max(-1, Math.min(1, v / 40)) - lean) * 0.08;
      const ry = REST_Y + Math.abs(lean) * 6;
      const rx = REST_X + lean * 5;
      if (plane.current) {
        plane.current.style.transform = `rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg)`;
        plane.current.style.setProperty("--ry", `${ry.toFixed(3)}deg`);
        plane.current.style.setProperty("--rx", `${rx.toFixed(3)}deg`);
      }
      if (sheet.current) sheet.current.style.transform = `translate3d(0, ${(-y).toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [fieldH]);

  return (
    <main ref={main} data-page data-lenis-prevent className="relative h-[var(--vh)] touch-none overflow-hidden bg-neutral-0 select-none">
      {/* The eye sits left of centre, the point far off to the right: the logo's taper, gently. */}
      <div className="absolute inset-0" style={{ perspective: 2200, perspectiveOrigin: "30% 45%" }}>
        <div ref={plane} className="absolute top-0 will-change-transform" style={{ left: (1440 - fieldW) / 2 - 40, width: fieldW, height: "var(--vh)", transformOrigin: "0% 45%", transformStyle: "preserve-3d" }}>
          <div ref={sheet} className="relative will-change-transform" style={{ height: fieldH, paddingTop: 170, transformStyle: "preserve-3d" }}>
            {films.map((film, i) => {
              const c = i % COLS, r = Math.floor(i / COLS);
              return (
                <button
                  key={film.slug + i}
                  type="button"
                  data-cursor="play"
                  onClick={() => openWithSound(() => setPlaying(i))}
                  className="group absolute flex cursor-pointer flex-col gap-2 text-left transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:z-10 hover:[transform:rotateX(calc(var(--rx)*-1))_rotateY(calc(var(--ry)*-1))_translateZ(40px)]"
                  style={{ left: c * (TILE_W + GAP_X), top: 170 + r * ROW + STAGGER[c], width: TILE_W, transformStyle: "preserve-3d" }}
                >
                  <span className="relative block w-full overflow-hidden bg-neutral-200" style={{ height: TILE_H }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={film.poster ?? ""} alt={`${film.client}, ${film.short ?? film.title}`} loading="lazy" draggable={false} className="absolute inset-0 size-full object-cover" />
                  </span>
                  <span className="t-body flex justify-between gap-2 whitespace-nowrap">
                    <span className="truncate">{film.short ?? film.title}</span>
                    <span className="text-neutral-500">{film.client}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <Chrome toggles={<ArchiveStyleSwitch current="tilt" />} />
      <Player films={films} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
