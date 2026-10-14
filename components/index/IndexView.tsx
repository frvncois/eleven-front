"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion, motionValue, type MotionValue } from "framer-motion";
import type { Project } from "@/lib/content";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { Player } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";

export type Tile = Project & { label: string; client: string; x: number; y: number; w: number; h: number };

const MORPH = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };
const r169 = (w: number) => Math.round((w * 9) / 16);

// List: Figma sizes S (332) and L (564), right edge on x 1002.
const LIST_RIGHT = 1002;
const SMALL_W = 332;
const BIG_W = 564;
const GAP = 16;
const STEP = 300; // scroll distance from one project to the next
const SMALL_H = r169(SMALL_W);
const BIG_H = r169(BIG_W);
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const scaleOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
const vhOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 1024;

/**
 * V1 · 08 · Index (Figma 7345:1515 grid, 7345:1560 list). Every project in one place.
 * Grid: the Figma field, opening centred on project 01. It moves only when you scroll (after
 * neu.team): vertical scroll moves it up/down, horizontal (trackpad) sideways, with soft inertia;
 * drag works too. The field repeats endlessly, so there is no edge. Hover shows title / client.
 * List: one column. The project in the middle is large with its name in black; the others are
 * small with grey names, growing as they reach the middle and shrinking as they leave it.
 * The toggle morphs one view into the other (gather / explode sounds). Click a tile to play it.
 */
export function IndexView({ tiles, field }: { tiles: Tile[]; field: { w: number; h: number } }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [playing, setPlaying] = useState<number | null>(null);

  const toggle = () => {
    sound.cue(view === "grid" ? "gather" : "explode");
    setView(view === "grid" ? "list" : "grid");
  };

  return (
    <main className={`relative bg-neutral-0 ${view === "grid" ? "h-(--vh) overflow-hidden" : ""}`}>
      <LayoutGroup>
        {view === "grid" ? (
          <GridView tiles={tiles} field={field} onPlay={setPlaying} paused={playing !== null} />
        ) : (
          <ListView tiles={tiles} onPlay={setPlaying} />
        )}
      </LayoutGroup>

      <NavBar />
      <NavSub
        toggles={
          <button
            type="button"
            onClick={toggle}
            data-sound="off"
            aria-label={view === "grid" ? "Show as list" : "Show as grid"}
            className="block size-8 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view === "grid" ? "/icons/view-grid.svg" : "/icons/view-list.svg"} alt="" width={32} height={32} />
          </button>
        }
      />
      <Player films={tiles} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}

/* ------------------------------------------------------------------ */

function GridView({ tiles, field, onPlay, paused }: { tiles: Tile[]; field: { w: number; h: number }; onPlay: (i: number) => void; paused: boolean }) {
  // Each tile's on-screen position, written every frame (no re-render).
  const [pos] = useState(() => tiles.map(() => ({ left: motionValue(0), top: motionValue(0) })));
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const h = vhOf();
    // Open with project 01 in the middle of the screen.
    const first = tiles[0];
    target.current = { x: 720 - (first.x + first.w / 2), y: h / 2 - (first.y + first.h / 2) };
    const cur = { ...target.current };
    // The field repeats in every direction (neu.team): wrap each tile into the window around the screen.
    const wrap = (v: number, size: number, span: number) => ((((v + span) % size) + size) % size) - span;

    let raf = 0;
    const place = () => {
      tiles.forEach((t, i) => {
        pos[i].left.set(wrap(t.x + cur.x, field.w, t.w + 40));
        pos[i].top.set(wrap(t.y + cur.y, field.h, t.h + 40));
      });
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dx = target.current.x - cur.x;
      const dy = target.current.y - cur.y;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
      // Soft inertia: ease toward where the scroll asked to go.
      cur.x += dx * 0.09;
      cur.y += dy * 0.09;
      place();
    };
    place();
    raf = requestAnimationFrame(tick);

    const onWheel = (e: WheelEvent) => {
      if (paused) return;
      e.preventDefault();
      const s = scaleOf();
      // Vertical scroll moves the field up/down, horizontal (trackpad, shift) sideways.
      target.current.x -= (e.shiftKey ? e.deltaY : e.deltaX) / s;
      target.current.y -= (e.shiftKey ? 0 : e.deltaY) / s;
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const s = scaleOf();
      const mx = (e.clientX - d.x) / s;
      const my = (e.clientY - d.y) / s;
      if (Math.abs(mx) + Math.abs(my) > 4) d.moved = true;
      target.current = { x: d.tx + mx, y: d.ty + my };
    };
    const onUp = () => setTimeout(() => (drag.current = null));
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.__lenis?.start();
    };
  }, [tiles, field.w, field.h, pos, paused]);

  return (
    <div
      className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
      onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY, tx: target.current.x, ty: target.current.y, moved: false })}
    >
      {tiles.map((t, i) => (
        <motion.button
          key={t.slug}
          layoutId={t.slug}
          transition={MORPH}
          type="button"
          data-cursor="play"
          onClick={() => !drag.current?.moved && onPlay(i)}
          className="group absolute flex cursor-pointer flex-col gap-2 text-left"
          style={{ left: pos[i].left, top: pos[i].top, width: t.w }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.poster ?? ""} alt={`${t.client}, ${t.label}`} loading="lazy" draggable={false} className="block w-full object-cover" style={{ height: r169(t.w) }} />
          <span className="t-h5 flex justify-between gap-4 whitespace-nowrap opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
            <span className="truncate">{t.label}</span>
            <span>{t.client}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Row = { left: MotionValue<number>; top: MotionValue<number>; width: MotionValue<number>; name: MotionValue<number>; color: MotionValue<string>; fade: MotionValue<number> };

function ListView({ tiles, onPlay }: { tiles: Tile[]; onPlay: (i: number) => void }) {
  // One set of motion values per row, written every frame from the scroll position (no re-render).
  const [rows] = useState<Row[]>(() =>
    tiles.map(() => ({
      left: motionValue(LIST_RIGHT - SMALL_W),
      top: motionValue(0),
      width: motionValue(SMALL_W),
      name: motionValue(0),
      color: motionValue("#bdbdbd"),
      fade: motionValue(0),
    })),
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
    const vh = vhOf();
    const S = SMALL_H + GAP;
    const E = (BIG_H - SMALL_H) / 2;

    let raf = 0;
    let settle = 0;
    let lastY = -1;
    let centred = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const scroll = window.scrollY / scaleOf();
      if (scroll === lastY) return;
      lastY = scroll;
      const p = scroll / STEP;
      const C = scroll + vh / 2; // the screen's middle, in page units
      const middle = Math.round(p);
      if (middle !== centred) {
        if (centred !== -1) sound.cue("step");
        centred = middle;
      }
      rows.forEach((r, i) => {
        const d = i - p;
        const t = smooth(clamp(1 - Math.abs(d), 0, 1));
        const w = SMALL_W + (BIG_W - SMALL_W) * t;
        const h = r169(w);
        const cy = C + d * S + Math.sign(d) * E * Math.min(Math.abs(d), 1);
        r.width.set(w);
        r.left.set(LIST_RIGHT - w);
        r.top.set(cy - h / 2);
        r.name.set(cy);
        // Name: black in the middle, grey around it; rows far away fade out.
        const g = Math.round(0xbd * (1 - t));
        r.color.set(`rgb(${g},${g},${g})`);
        r.fade.set(clamp(3.2 - Math.abs(d), 0, 1));
      });
      // When scrolling stops, settle on the nearest project.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const target = Math.round(p) * STEP * scaleOf();
        if (Math.abs(target - window.scrollY) > 2) window.__lenis?.scrollTo(target, { duration: 0.6 });
      }, 180);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [tiles.length, rows]);

  return (
    <div className="relative" style={{ height: `calc(${(tiles.length - 1) * STEP}px + var(--vh))` }}>
      {tiles.map((t, i) => {
        const r = rows[i];
        return (
          <div key={t.slug}>
            <motion.button
              layoutId={t.slug}
              transition={MORPH}
              type="button"
              data-cursor="play"
              onClick={() => onPlay(i)}
              className="absolute block cursor-pointer"
              style={{ left: r.left, top: r.top, width: r.width, opacity: r.fade }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.poster ?? ""} alt={`${t.client}, ${t.label}`} loading="lazy" draggable={false} className="block aspect-video w-full object-cover" />
            </motion.button>
            {/* The row's name, level with its image; black in the middle, grey elsewhere. */}
            <motion.p
              className="t-h5 pointer-events-none absolute left-[37px] -translate-y-1/2 whitespace-nowrap"
              style={{ top: r.name, color: r.color, opacity: r.fade }}
              initial={{ x: -16 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + Math.min(i, 8) * 0.04, ease: [0, 0, 0.58, 1] }}
            >
              {t.label} · {t.client}
            </motion.p>
          </div>
        );
      })}
    </div>
  );
}
