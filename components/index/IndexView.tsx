"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { LayoutGroup, motion, motionValue, type MotionValue } from "framer-motion";
import type { Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";

export type Tile = Project & { label: string; client: string; x: number; y: number; w: number; h: number };

const MORPH = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };
const r169 = (w: number) => Math.round((w * 9) / 16);

// List: the three Figma sizes S 332 / M 448 / L 564, right edge on x 1002.
const LIST_RIGHT = 1002;
const SMALL_W = 332;
const MID_W = 448;
const BIG_W = 564;
const GAP = 16;
const STEP = 300; // wheel distance from one project to the next
// Grid: the Figma field spread out so there is air between projects (Amélie, Oct 17). Tile sizes stay.
const SPREAD = 1.2;
// On arrival the nav must read clearly: the opening view settles where the fewest tiles sit under
// the top nav and the bottom bar, searched within NUDGE px of project 01 in the middle.
const NAV_TOP = 96;
const NAV_BOTTOM = 88;
const NUDGE = 720;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Width for a row `d` rows away from the middle: L at 0, M at 1, S from 2, eased in between. */
const widthAt = (d: number) => {
  const x = Math.abs(d);
  if (x <= 1) return MID_W + (BIG_W - MID_W) * smooth(1 - x);
  if (x <= 2) return SMALL_W + (MID_W - SMALL_W) * smooth(2 - x);
  return SMALL_W;
};
const scaleOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
const vhOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 1024;

/**
 * V1 · 08 · Index (Figma 7345:1515 grid, 7345:1560 list). Every project in one place.
 * Grid: the Figma field, opening centred on project 01. It moves only when you scroll (after
 * neu.team): vertical scroll moves it up/down, horizontal (trackpad) sideways, with soft inertia;
 * drag works too. The field repeats endlessly, so there is no edge. Hover shows title / client.
 * List: one endless column in three sizes, opening on project 01 in the middle: the middle project
 * large with its name in black, its neighbours medium, the rest small and grey; rows grow as they
 * reach the middle and shrink after. After the last project comes the first again.
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
    <main className="relative h-(--vh) overflow-hidden bg-neutral-0">
      <LayoutGroup>
        {view === "grid" ? (
          <GridView tiles={tiles} field={field} onPlay={(i) => openWithSound(() => setPlaying(i))} paused={playing !== null} />
        ) : (
          <ListView tiles={tiles} onPlay={(i) => openWithSound(() => setPlaying(i))} />
        )}
      </LayoutGroup>

      <Chrome
        toggles={
          <button
            type="button"
            onClick={toggle}
            data-sound="off"
            aria-label={view === "grid" ? "Show as list" : "Show as grid"}
            className="block size-8 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            {/* One button = an action: it shows the view you will switch to. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view === "grid" ? "/icons/view-list.svg" : "/icons/view-grid.svg"} alt="" width={32} height={32} />
          </button>
        }
      />
      <Player films={tiles} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}

/* ------------------------------------------------------------------ */

function GridView({ tiles: figmaTiles, field: figmaField, onPlay, paused }: { tiles: Tile[]; field: { w: number; h: number }; onPlay: (i: number) => void; paused: boolean }) {
  const tiles = useMemo(() => figmaTiles.map((t) => ({ ...t, x: t.x * SPREAD, y: t.y * SPREAD })), [figmaTiles]);
  const field = useMemo(() => ({ w: figmaField.w * SPREAD, h: figmaField.h * SPREAD }), [figmaField.w, figmaField.h]);
  // Each tile's on-screen position, written every frame (no re-render).
  const [pos] = useState(() => tiles.map(() => ({ left: motionValue(0), top: motionValue(0) })));
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const h = vhOf();
    // The field repeats in every direction (neu.team): wrap each tile into the window around the screen.
    const wrap = (v: number, size: number, span: number) => ((((v + span) % size) + size) % size) - span;
    // Open with project 01 near the middle, nudged so the navs sit in the gaps between projects.
    const first = tiles[0];
    const base = { x: 720 - (first.x + first.w / 2), y: h / 2 - (first.y + first.h / 2) };
    const navOverlap = (ox: number, oy: number) => {
      let area = 0;
      tiles.forEach((t) => {
        const x = wrap(t.x + ox, field.w, t.w + 40);
        const y = wrap(t.y + oy, field.h, t.h + 40);
        const w = Math.max(0, Math.min(x + t.w, 1440) - Math.max(x, 0));
        if (!w) return;
        const top = Math.max(0, Math.min(y + t.h, NAV_TOP) - Math.max(y, 0));
        const bottom = Math.max(0, Math.min(y + t.h, h) - Math.max(y, h - NAV_BOTTOM));
        // Any tile under a nav counts heavily, even a sliver: the links must sit on white.
        if (top + bottom) area += 100000 + w * (top + bottom);
      });
      return area;
    };
    let best = { ...base, score: Infinity };
    for (let dy = -NUDGE; dy <= NUDGE; dy += 8) {
      for (let dx = -NUDGE; dx <= NUDGE; dx += 16) {
        // Prefer the closest clear spot, so project 01 stays near the middle.
        const score = navOverlap(base.x + dx, base.y + dy) + Math.hypot(dx, dy) * 4;
        if (score < best.score) best = { x: base.x + dx, y: base.y + dy, score };
      }
    }
    target.current = { x: best.x, y: best.y };
    const cur = { ...target.current };

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
    // Endless: the list is driven by the wheel, not the page, and wraps from the last project to
    // the first. It opens on project 01 in the middle of the screen, with projects above and below.
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const n = tiles.length;
    const vh = vhOf();
    const C = vh / 2;
    const mod = (v: number) => ((v % n) + n) % n;
    let target = 0;
    let cur = 0;
    let centred = 0;
    let settle = 0;
    let touchY = 0;
    let dirty = true;

    const draw = () => {
      // Rows within 6 of the middle, in order, with their (wrapped) distance from it.
      const a = Math.floor(cur);
      const frac = cur - a;
      const ks = Array.from({ length: 13 }, (_, j) => j - 6);
      const idx = ks.map((k) => mod(a + k));
      const widths = ks.map((k) => widthAt(k - frac));
      const heights = widths.map(r169);
      // Three levels, stacked around the middle with an even gap whatever the sizes.
      const centers = new Array<number>(ks.length);
      const pitch = (j: number) => heights[j] / 2 + GAP + heights[j + 1] / 2;
      centers[6] = C - frac * pitch(6);
      for (let j = 7; j < ks.length; j++) centers[j] = centers[j - 1] + pitch(j - 1);
      for (let j = 5; j >= 0; j--) centers[j] = centers[j + 1] - pitch(j);
      const shown = new Set<number>();
      ks.forEach((k, j) => {
        const i = idx[j];
        if (shown.has(i)) return; // fewer projects than slots: never draw one twice
        shown.add(i);
        const r = rows[i];
        const d = k - frac;
        r.width.set(widths[j]);
        r.left.set(LIST_RIGHT - widths[j]);
        r.top.set(centers[j] - heights[j] / 2);
        r.name.set(centers[j]);
        // Name: black in the middle, mid grey for the neighbours, light grey further out.
        const g = Math.round(0xbd * smooth(clamp(Math.abs(d), 0, 2) / 2));
        r.color.set(`rgb(${g},${g},${g})`);
        r.fade.set(clamp(3.6 - Math.abs(d), 0, 1));
      });
      rows.forEach((r, i) => !shown.has(i) && r.fade.set(0));
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const delta = target - cur;
      if (Math.abs(delta) < 0.0005 && !dirty) return;
      cur += delta * 0.12;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      dirty = false;
      const middle = mod(Math.round(cur));
      if (middle !== centred) {
        sound.cue("step");
        centred = middle;
      }
      draw();
    };
    // When the scroll stops, settle on the nearest project.
    const scheduleSettle = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => (target = Math.round(target)), 160);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target += e.deltaY / scaleOf() / STEP;
      scheduleSettle();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") target = Math.round(target) + 1;
      if (e.key === "ArrowUp") target = Math.round(target) - 1;
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      target += (touchY - y) / scaleOf() / STEP;
      touchY = y;
      scheduleSettle();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    draw();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.__lenis?.start();
    };
  }, [tiles, rows]);

  return (
    <div className="absolute inset-0 overflow-hidden">
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
