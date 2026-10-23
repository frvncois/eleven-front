"use client";

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { LayoutGroup, motion, motionValue, type MotionValue } from "framer-motion";
import type { Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";
import { BallCanvas } from "./BallCanvas";
import { preloadArchive } from "@/lib/archive-preload";
import { span } from "@/lib/grid";
import { EASE_DISSOLVE } from "@/lib/motion";
import { ViewToggle } from "@/components/shell/ViewToggle";
import { appScale } from "@/lib/device";

export type Tile = Project & { label: string; client: string; x: number; y: number; w: number; h: number };

const MORPH = { duration: 0.6, ease: EASE_DISSOLVE };
const r169 = (w: number) => Math.round((w * 9) / 16);

// List: three sizes, S / M / L = 2 / 3 / 4 columns. Like the phone list: every card ends on the
// screen's right edge, so the widest, in the middle, points left at the caption.
const LIST_RIGHT = 1440;
// The stack runs the full height of the screen, from under About and Contact down past the GRID / SOUND chips, which
// sit on top of it. Clean cut, no white fade.
const LIST_BOTTOM = 0;
const SMALL_W = span(2);
const MID_W = span(3);
const BIG_W = span(4);
const GAP = 16;
const STEP = 300; // wheel distance from one project to the next
// Grid: the designed field spread out a little so there is air between projects, then
// evened out (relax) so there are no big holes. Tile sizes stay.
const SPREAD = 1.32; // room so projects sit well apart
const MIN_GAP = 136; // smallest space between two projects after evening out
const GROW = 1.15; // field frames 15 % bigger than the grid's 2 / 3 / 4 columns
// On arrival the nav must read clearly: the opening view (searched over the whole wrapped field)
// keeps the top nav clear, avoids the floss and toggle corners, and fills the screen.
// The chosen opening view: P&G · Best Job on the right, Visa · Typewriter top left, Adidas · Reflections
// bottom left. Pinned by Best Job's centre as it shows on the ball, measured from the screen centre (at 1440 ×
// 1005), so it holds at any window height. The search below is only the fallback if that project goes.
const OPEN = { slug: "p-g-best-job", x: 371, y: 123 };
const NAV_TOP = 96;
const NAV_BOTTOM = 88;
const FLOSS = { w: 160, h: 145 };
// The screen as a ball: the flat grid is drawn bent over a sphere (BallCanvas,
// WebGL), so thumbnails themselves curve, flat in the middle and rolling away at the edges.
// A point at distance s from the centre on the flat grid shows at r = R·sin(s / R) on screen.
const BALL_RADIUS = 1150; // smaller = rounder
const toScreen = (s: number) => BALL_RADIUS * Math.sin(Math.min(s, BALL_RADIUS * 1.5) / BALL_RADIUS);
const toFlat = (r: number) => BALL_RADIUS * Math.asin(Math.min(r / BALL_RADIUS, 0.999));
const smooth = (t: number) => t * t * (3 - 2 * t);
/** Width for a row `d` rows away from the middle: L at 0, M at 1, S from 2, eased in between. */
const widthAt = (d: number) => {
  const x = Math.abs(d);
  if (x <= 1) return MID_W + (BIG_W - MID_W) * smooth(1 - x);
  if (x <= 2) return SMALL_W + (MID_W - SMALL_W) * smooth(2 - x);
  return SMALL_W;
};
const vhOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 1024;

/**
 * Archive (desktop). Every project in one place.
 * Grid: the designed field (data/index.json), opening centred on project 01. It moves only when you scroll:
 * vertical scroll moves it up/down, horizontal (trackpad) sideways, with soft inertia;
 * drag works too. The field repeats endlessly, so there is no edge. Hover shows title / client.
 * List: one endless column in three sizes, opening on project 01 in the middle: the middle project
 * large with its name in black, its neighbours medium, the rest small and grey; rows grow as they
 * reach the middle and shrink after. After the last project comes the first again.
 * The toggle morphs one view into the other (gather / explode sounds). Click a tile to play it.
 */
const VIEWS: [{ value: "grid" | "list"; label: string }, { value: "grid" | "list"; label: string }] = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
];

export function IndexView({ tiles, field }: { tiles: Tile[]; field: { w: number; h: number } }) {
  // The Archive opens on the list; GRID switches to the fisheye.
  const [view, setView] = useState<"grid" | "list">("list");
  // The grid only plays its flat morph phase when it comes back from the list.
  const [fromList, setFromList] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const choose = (v: "grid" | "list") => {
    sound.cue(v === "list" ? "gather" : "explode");
    setFromList(v === "grid");
    setView(v);
  };

  return (
    <main className="relative h-(--vh) overflow-hidden bg-neutral-0 select-none">
      <LayoutGroup>
        {view === "grid" ? (
          <GridView tiles={tiles} field={field} fromList={fromList} onPlay={(i) => openWithSound(() => setPlaying(i))} paused={playing !== null} />
        ) : (
          <ListView tiles={tiles} onPlay={(i) => openWithSound(() => setPlaying(i))} paused={playing !== null} />
        )}
      </LayoutGroup>

      {/* One view word next to the sound toggle, "GRID / SOUND". */}
      <Chrome toggles={<ViewToggle options={VIEWS} value={view} onChange={choose} />} />
      <Player films={tiles} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}

/* ------------------------------------------------------------------ */

/** Even out the field: push projects apart until every gap is at least MIN_GAP, and let them drift
 *  into empty areas, on the wrapping field. Deterministic, so the layout is the same on every visit. */
function relax(tiles: Tile[], field: { w: number; h: number }) {
  const c = tiles.map((t) => ({ x: t.x + t.w / 2, y: t.y + t.h / 2 }));
  const near = (d: number, size: number) => d - size * Math.round(d / size);
  for (let it = 0; it < 220; it++) {
    const f = c.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < c.length; i++) {
      for (let j = i + 1; j < c.length; j++) {
        const dx = near(c[j].x - c[i].x, field.w);
        const dy = near(c[j].y - c[i].y, field.h);
        const ox = (tiles[i].w + tiles[j].w) / 2 + MIN_GAP - Math.abs(dx);
        const oy = (tiles[i].h + tiles[j].h) / 2 + MIN_GAP - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          // Overlapping (gap included): separate along the shallower axis.
          if (ox < oy) {
            const p = (Math.sign(dx) || 1) * ox * 0.5;
            f[i].x -= p;
            f[j].x += p;
          } else {
            const p = (Math.sign(dy) || 1) * oy * 0.5;
            f[i].y -= p;
            f[j].y += p;
          }
        } else {
          // Soft long-range push so crowded areas spill into the holes.
          const d2 = dx * dx + dy * dy;
          if (d2 < 900 * 900) {
            const k = (it < 160 ? 9000 : 0) / Math.max(d2, 1e4);
            f[i].x -= dx * k * 0.02;
            f[i].y -= dy * k * 0.02;
            f[j].x += dx * k * 0.02;
            f[j].y += dy * k * 0.02;
          }
        }
      }
    }
    c.forEach((p, i) => {
      p.x = (p.x + f[i].x + field.w) % field.w;
      p.y = (p.y + f[i].y + field.h) % field.h;
    });
  }
  return tiles.map((t, i) => ({ ...t, x: c[i].x - t.w / 2, y: c[i].y - t.h / 2 }));
}

// The opening view per screen height and the evened-out layout, worked out once per visit.
const arrival = new Map<number, { x: number; y: number }>();
let relaxed: { source: Tile[]; tiles: Tile[] } | null = null;
function relaxedTiles(source: Tile[], field: { w: number; h: number }) {
  if (!relaxed || relaxed.source !== source) relaxed = { source, tiles: relax(source.map((t) => ({ ...t, x: t.x * SPREAD, y: t.y * SPREAD, w: t.w * GROW, h: t.h * GROW })), field) };
  return relaxed.tiles;
}

function GridView({
  tiles: figmaTiles,
  field: figmaField,
  fromList,
  onPlay,
  paused,
}: {
  tiles: Tile[];
  field: { w: number; h: number };
  fromList: boolean;
  onPlay: (i: number) => void;
  paused: boolean;
}) {
  const field = useMemo(() => ({ w: figmaField.w * SPREAD, h: figmaField.h * SPREAD }), [figmaField.w, figmaField.h]);
  // Evened out once per visit (the layout is the same every time).
  const tiles = useMemo(() => relaxedTiles(figmaTiles, field), [figmaTiles, field]);
  // Each tile's position on the flat grid (screen coordinates), written every frame (no re-render).
  const [pos] = useState(() => tiles.map(() => ({ left: motionValue(0), top: motionValue(0) })));
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  // Read by the scroll listeners: a ref, so opening a film doesn't restart the field (and lose the visitor's place).
  const pausedRef = useRef(paused);
  useLayoutEffect(() => {
    pausedRef.current = paused;
  });
  const target = useRef({ x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const label = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(1024);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the viewport height only exists after mount (static prerender)
  useEffect(() => setHeight(vhOf()), []);
  // The page's own tiles stay in place (hit areas, and the morph to and from the list): visible
  // while the morph plays, then the ball takes over.
  const [morphing, setMorphing] = useState(fromList);
  useEffect(() => {
    preloadArchive();
    if (!fromList) return;
    const t = setTimeout(() => setMorphing(false), MORPH.duration * 1000 + 50);
    return () => clearTimeout(t);
  }, [fromList]);
  const items = useMemo(() => tiles.map((t) => ({ poster: t.poster ?? null, w: t.w, h: r169(t.w) })), [tiles]);

  useEffect(() => {
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const h = vhOf();
    const wrapC = (v: number, size: number) => ((((v + size / 2) % size) + size) % size) - size / 2;
    // A flat point → where the ball shows it on screen.
    const onScreen = (x: number, y: number) => {
      const dx = x - 720;
      const dy = y - h / 2;
      const s = Math.hypot(dx, dy);
      const k = s ? toScreen(s) / s : 1;
      return { x: 720 + dx * k, y: h / 2 + dy * k };
    };
    const first = tiles[0];
    const base = { x: 720 - (first.x + first.w / 2), y: h / 2 - (first.y + first.h / 2) };
    const bands = [
      { x0: 0, x1: 1440, y0: 0, y1: NAV_TOP },
      { x0: 0, x1: FLOSS.w, y0: h - FLOSS.h, y1: h },
      { x0: 1440 - 200, x1: 1440, y0: h - NAV_BOTTOM, y1: h },
    ];
    // How much of the navs a view covers (0 = clear) and how full it is, as seen on the ball.
    const score = (ox: number, oy: number) => {
      let cover = 0;
      let fill = 0;
      for (const t of tiles) {
        const fx = 720 + wrapC(t.x + ox + t.w / 2 - 720, field.w) - t.w / 2;
        const fy = h / 2 + wrapC(t.y + oy + t.h / 2 - h / 2, field.h) - t.h / 2;
        const a = onScreen(fx, fy);
        const b = onScreen(fx + t.w, fy + t.h);
        const r = { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) };
        const w = Math.max(0, Math.min(r.x1, 1440) - Math.max(r.x0, 0));
        const v = Math.max(0, Math.min(r.y1, h) - Math.max(r.y0, 0));
        if (!w || !v) continue;
        // The top nav must stay clear; the floss and toggle corners count less.
        bands.forEach((band, k) => {
          const a = Math.max(0, Math.min(r.x1, band.x1) - Math.max(r.x0, band.x0)) * Math.max(0, Math.min(r.y1, band.y1) - Math.max(r.y0, band.y0));
          cover += a * (k === 0 ? 20 : 1);
        });
        fill += w * v;
      }
      return { cover, fill };
    };
    // Lowest cost wins: nav cover (top nav heavily), minus how full the screen is, plus a little
    // distance from project 01. Coarse pass over the whole field, then a fine pass around the best
    // spot; remembered for the visit, so coming back is instant.
    const cost = (dx: number, dy: number) => {
      const { cover, fill } = score(base.x + dx, base.y + dy);
      return cover - fill * 0.25 + Math.hypot(dx, dy) * 2;
    };
    let best = arrival.get(h);
    const anchor = tiles.find((t) => t.slug === OPEN.slug);
    if (!best && anchor) {
      // Where Best Job's centre must sit on the flat grid so the ball shows it at OPEN.
      const s = Math.hypot(OPEN.x, OPEN.y);
      const k = s ? toFlat(s) / s : 1;
      best = { x: 720 + OPEN.x * k - (anchor.x + anchor.w / 2), y: h / 2 + OPEN.y * k - (anchor.y + anchor.h / 2) };
      arrival.set(h, best);
    }
    if (!best) {
      let b = { dx: 0, dy: 0, c: Infinity };
      for (let dy = -field.h / 2; dy <= field.h / 2; dy += 96) {
        for (let dx = -field.w / 2; dx <= field.w / 2; dx += 128) {
          const c = cost(dx, dy);
          if (c < b.c) b = { dx, dy, c };
        }
      }
      const coarse = b;
      for (let dy = coarse.dy - 96; dy <= coarse.dy + 96; dy += 12) {
        for (let dx = coarse.dx - 128; dx <= coarse.dx + 128; dx += 16) {
          const c = cost(dx, dy);
          if (c < b.c) b = { dx, dy, c };
        }
      }
      best = { x: base.x + b.dx, y: base.y + b.dy };
      arrival.set(h, best);
    }
    target.current = { x: best.x, y: best.y };
    const cur = { ...target.current };

    let raf = 0;
    const place = () => {
      tiles.forEach((t, i) => {
        // The nearest copy of each project around the screen centre (the field repeats endlessly).
        pos[i].left.set(720 + wrapC(t.x + cur.x + t.w / 2 - 720, field.w) - t.w / 2);
        pos[i].top.set(h / 2 + wrapC(t.y + cur.y + t.h / 2 - h / 2, field.h) - t.h / 2);
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
      if (pausedRef.current) return;
      e.preventDefault();
      const s = appScale();
      // Vertical scroll moves the field up/down, horizontal (trackpad, shift) sideways.
      target.current.x -= (e.shiftKey ? e.deltaY : e.deltaX) / s;
      target.current.y -= (e.shiftKey ? 0 : e.deltaY) / s;
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const s = appScale();
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
  }, [tiles, field.w, field.h, pos]);

  // The ball is only drawn: find the project under the pointer by mapping it back to the flat grid.
  const tileAt = (clientX: number, clientY: number) => {
    const el = box.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = appScale();
    const h = vhOf();
    const dx = (clientX - r.left) / s - 720;
    const dy = (clientY - r.top) / s - h / 2;
    const d = Math.hypot(dx, dy);
    const k = d ? toFlat(d) / d : 1;
    const fx = 720 + dx * k;
    const fy = h / 2 + dy * k;
    for (let i = tiles.length - 1; i >= 0; i--) {
      const x = pos[i].left.get();
      const y = pos[i].top.get();
      if (fx >= x && fx <= x + tiles[i].w && fy >= y && fy <= y + r169(tiles[i].w)) return i;
    }
    return null;
  };
  const track = (e: React.PointerEvent) => {
    const i = drag.current?.moved ? null : tileAt(e.clientX, e.clientY);
    // Set synchronously so the cursor tag (which reads data-cursor on this same move) sees it.
    if (i === null) box.current?.removeAttribute("data-cursor");
    else box.current?.setAttribute("data-cursor", "play");
    hoverRef.current = i;
    setHover(i);
  };

  return (
    <div
      ref={box}
      className={`absolute inset-0 overflow-hidden ${hover === null ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
      onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY, tx: target.current.x, ty: target.current.y, moved: false })}
      onPointerMove={track}
      onPointerLeave={() => {
        box.current?.removeAttribute("data-cursor");
        hoverRef.current = null;
        setHover(null);
      }}
      onClick={(e) => {
        if (drag.current?.moved) return;
        const i = tileAt(e.clientX, e.clientY);
        if (i !== null) onPlay(i);
      }}
    >
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out" style={{ opacity: morphing ? 1 : 0 }}>
        {tiles.map((t, i) => (
          <motion.div
            key={t.slug}
            layoutId={t.slug}
            transition={MORPH}
            className="absolute flex flex-col gap-2 text-left"
            style={{ left: pos[i].left, top: pos[i].top, width: t.w }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.poster ?? ""} alt={`${t.client}, ${t.label}`} loading="lazy" draggable={false} className="block w-full object-cover" style={{ height: r169(t.w) }} />
          </motion.div>
        ))}
      </div>
      <BallCanvas items={items} pos={pos} height={height} radius={BALL_RADIUS} visible={!morphing} hover={hoverRef} label={label} />
      {/* The hovered project's caption, the mixer chips (client over title), laid along its bent bottom edge
          (BallCanvas moves it). */}
      <div ref={label} aria-hidden className="pointer-events-none absolute top-0 left-0 flex origin-top-left flex-col items-start whitespace-nowrap opacity-0 transition-opacity duration-300 ease-out">
        {hover !== null && (
          <>
            <span className="chip-client">{tiles[hover].client}</span>
            <span className="chip-title">{tiles[hover].label}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Row = { left: MotionValue<number>; top: MotionValue<number>; width: MotionValue<number>; fade: MotionValue<number> };

function ListView({ tiles, onPlay, paused }: { tiles: Tile[]; onPlay: (i: number) => void; paused: boolean }) {
  const [middle, setMiddle] = useState(0);
  // Wheel, keys and touch reach the window: ignore them while a film is open on top.
  const pausedRef = useRef(paused);
  useLayoutEffect(() => {
    pausedRef.current = paused;
  });
  // Only the middle project is in the tab order; arrow keys step the list and focus follows the middle.
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const active = document.activeElement;
    if (active && buttons.current.includes(active as HTMLButtonElement)) buttons.current[middle]?.focus({ preventScroll: true });
  }, [middle]);
  // One set of motion values per row, written every frame from the scroll position (no re-render).
  const [rows] = useState<Row[]>(() =>
    tiles.map(() => ({
      left: motionValue(LIST_RIGHT - SMALL_W),
      top: motionValue(0),
      width: motionValue(SMALL_W),
      fade: motionValue(0),
    })),
  );

  useEffect(() => {
    // Endless: the list is driven by the wheel, not the page, and wraps from the last project to
    // the first. It opens on project 01 in the middle of the screen, with projects above and below.
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const n = tiles.length;
    const C = (vhOf() - LIST_BOTTOM) / 2; // the window's middle
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
        r.width.set(widths[j]);
        r.left.set(LIST_RIGHT - widths[j]);
        r.top.set(centers[j] - heights[j] / 2);
        r.fade.set(1);
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
        setMiddle(middle);
      }
      draw();
    };
    // When the scroll stops, settle on the nearest project.
    const scheduleSettle = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => (target = Math.round(target)), 160);
    };
    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      target += e.deltaY / appScale() / STEP;
      scheduleSettle();
    };
    const onKey = (e: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (e.key === "ArrowDown") target = Math.round(target) + 1;
      if (e.key === "ArrowUp") target = Math.round(target) - 1;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (pausedRef.current) return;
      const y = e.touches[0].clientY;
      target += (touchY - y) / appScale() / STEP;
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
    <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ bottom: LIST_BOTTOM }}>
      {/* The middle project's caption, like the phone list: client and title in grey chips (Neue Haas), left-aligned
          on the left margin under MIXERS, mid-window; only the text changes as projects pass. No counter (the
          phone has none). */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-margin z-20 flex max-w-[calc(3*var(--grid-col)+2*var(--spacing-gutter))] -translate-y-1/2 flex-col items-start"
      >
        <span className="chip-client">{tiles[middle]?.client}</span>
        <span className="chip-title">{tiles[middle]?.label}</span>
      </div>
      {tiles.map((t, i) => {
        const r = rows[i];
        return (
          <div key={t.slug}>
            <motion.button
              layoutId={t.slug}
              transition={MORPH}
              type="button"
              ref={(el) => {
                buttons.current[i] = el;
              }}
              data-cursor="play"
              tabIndex={i === middle ? 0 : -1}
              onClick={() => onPlay(i)}
              className="absolute block cursor-pointer"
              style={{ left: r.left, top: r.top, width: r.width, opacity: r.fade }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.poster ?? ""} alt={`${t.client}, ${t.label}`} loading="lazy" draggable={false} className="block aspect-video w-full object-cover" />
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
