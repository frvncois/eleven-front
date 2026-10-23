"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Tile } from "@/components/index/IndexView";
import { PHONE_MOTION } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { openWithSound } from "@/components/mixers/Player";
import { ViewToggle } from "@/components/shell/ViewToggle";
import { PlayerMobile } from "./PlayerMobile";
import { useDockToggle } from "./dock";
import { STEPPER, landing } from "@/lib/stepper";
import { rectToQuadCss, type Quad } from "@/lib/perspective";
import { appScale } from "@/lib/device";

type View = "field" | "list";
const VIEWS: [{ value: View; label: string }, { value: View; label: string }] = [
  { value: "list", label: "List" },
  { value: "field", label: "Grid" },
];

// The desktop field (lib/grid tiles, 2 / 3 / 4 columns) drawn at 26 %: S ≈ 78, M ≈ 118, L ≈ 157 wide
// (22 % felt crowded).
const K = 0.26;
// Positions: the desktop field's are uneven (and leave white holes on the phone), so the
// phone lays the 66 projects on its own even, staggered grid: 6 rows (even, so the stagger repeats
// cleanly where the field wraps), each row a band of the desktop field read left to right, so
// neighbours stay neighbours. 205 / 170 apart: the L tile plus its two-chip caption still
// has ~40 around it.
// A small fixed jitter keeps it from reading as a spreadsheet.
const ROWS = 6;
const DX = 205;
const DY = 170;
const JITTER = { x: 10, y: 8 };

function phoneField(tiles: Tile[]) {
  const cols = Math.ceil(tiles.length / ROWS);
  const byY = tiles.map((t, i) => i).sort((a, b) => tiles[a].y + tiles[a].h / 2 - (tiles[b].y + tiles[b].h / 2));
  const pos = tiles.map(() => ({ x: 0, y: 0 }));
  for (let r = 0; r < ROWS; r++) {
    const row = byY.slice(r * cols, (r + 1) * cols).sort((a, b) => tiles[a].x - tiles[b].x);
    row.forEach((i, c) => {
      // Deterministic jitter from the index, in −1…1.
      const j = (k: number) => Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 % 1;
      pos[i] = { x: c * DX + (r % 2) * (DX / 2) + j(1) * JITTER.x, y: r * DY + j(2) * JITTER.y };
    });
  }
  return { pos, W: cols * DX, H: ROWS * DY };
}
// The desktop fisheye (BallCanvas): the field is bent over a ball, a point s px from the screen centre shows at R·sin(s/R). Flat and
// true size in the middle, rolling away and shrinking towards the edges; nothing grows, nothing is pushed. Same
// curve as desktop's 1150 on 1440, scaled to the phone's screen. Each tile maps its four corners onto the ball
// (one matrix3d), so its caption bends with it.
const BALL_R = 520;
const BALL_REACH = BALL_R * 1.4; // beyond this a tile is round the back of the ball
const ball = (x: number, y: number): [number, number] => {
  const s = Math.hypot(x, y);
  const k = s ? (BALL_R * Math.sin(Math.min(s, BALL_R * 1.5) / BALL_R)) / s : 1;
  return [x * k, y * k];
};
const FRICTION = 0.94;
const SWAP = PHONE_MOTION.layer;
const LAYER = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(8px)" },
};

const wrap = (v: number, size: number) => ((v % size) + size) % size;

/**
 * The Archive on a phone. The same 66 projects as the desktop field, panned with one
 * finger (it flings on release and repeats endlessly, so there is no edge), bent over the desktop's ball (BALL_R).
 * Every tile carries its client and title from the start, small and grey under it; no counter, and no big caption
 * above LIST on the field. The project nearest the centre settles there; tap it = the player.
 * Stills only. LIST = the stack (List below): the projects against the right edge, the middle one wide,
 * its client and title in grey chips on the left.
 */
export function ArchiveMobile({ tiles }: { tiles: Tile[]; field: { w: number; h: number } }) {
  // Opens on the list, like desktop; GRID switches to the field.
  const [view, setView] = useState<View>("list");
  const [playing, setPlaying] = useState<number | null>(null);

  const choose = (v: View) => {
    sound.cue(v === "list" ? "gather" : "explode");
    setView(v);
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
  };
  useDockToggle(<ViewToggle options={VIEWS} value={view} onChange={choose} />);
  const open = (i: number) => openWithSound(() => setPlaying(i));

  return (
    <main className="relative h-(--vh) overflow-hidden bg-neutral-0">
      <AnimatePresence mode="popLayout" initial={false}>
        {view === "field" ? (
          <motion.div key="field" className="absolute inset-0" {...LAYER} transition={SWAP}>
            <Field tiles={tiles} onOpen={open} />
          </motion.div>
        ) : (
          <motion.div key="list" className="absolute inset-0" {...LAYER} transition={SWAP}>
            <List tiles={tiles} onOpen={open} />
          </motion.div>
        )}
      </AnimatePresence>

      <PlayerMobile films={tiles} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}

function Field({ tiles, onOpen }: { tiles: Tile[]; onOpen: (i: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  // The loop below lives as long as the field; the callback it calls is read fresh each time.
  const cb = useRef(onOpen);
  useEffect(() => {
    cb.current = onOpen;
  });

  // A layout effect with one frame drawn before the first paint: the tiles never show piled in the corner.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const { pos, W, H } = phoneField(tiles);
    // Open on project 01 under the lens.
    const pan = { x: -pos[0].x, y: -pos[0].y };
    const vel = { x: 0, y: 0 };
    let drag: { x: number; y: number; moved: number; id: number } | null = null;
    let last = -1;
    let drawnAt = ""; // the pan and size last drawn: at rest the loop writes nothing
    let raf = 0;
    // Where each tile was drawn this frame (for taps): centre and half size; and where it sits from the lens before
    // the fisheye (to bring it there).
    const drawn = tiles.map(() => ({ x: 0, y: 0, hw: 0, hh: 0 }));
    const rel = tiles.map(() => ({ x: 0, y: 0 }));
    // The rest of a glide to bring one project under the lens (the same landing as the lists, lib/stepper).
    let aim: { x: number; y: number } | null = null;
    let best = 0;

    const draw = () => {
      if (!drag) {
        if (aim) {
          const sx = aim.x * STEPPER.ease;
          const sy = aim.y * STEPPER.ease;
          pan.x += sx;
          pan.y += sy;
          aim = { x: aim.x - sx, y: aim.y - sy };
          if (Math.hypot(aim.x, aim.y) < 0.5) aim = null;
        } else if (vel.x || vel.y) {
          pan.x += vel.x;
          pan.y += vel.y;
          vel.x *= FRICTION;
          vel.y *= FRICTION;
          // The field roams freely (it's a map), but when the throw dies the nearest project settles under the lens.
          if (Math.hypot(vel.x, vel.y) < 0.4) {
            vel.x = vel.y = 0;
            aim = { x: -rel[best].x, y: -rel[best].y };
          }
        }
      }
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const seen = `${pan.x.toFixed(2)} ${pan.y.toFixed(2)} ${cw} ${ch}`;
      if (seen === drawnAt) return;
      drawnAt = seen;
      const cx = cw / 2;
      const cy = ch / 2;
      best = 0;
      let bestD = Infinity;
      tiles.forEach((t, i) => {
        const node = els.current[i];
        if (!node) return;
        // Wrapped into one field-sized window centred on the screen, so every tile shows once.
        const x = wrap(pos[i].x + pan.x + W / 2, W) - W / 2;
        const y = wrap(pos[i].y + pan.y + H / 2, H) - H / 2;
        rel[i] = { x, y };
        const r = Math.hypot(x, y);
        const w = t.w * K;
        const h = ((t.w * 9) / 16) * K;
        if (r > BALL_REACH) {
          node.style.visibility = "hidden";
          drawn[i] = { x: 0, y: 0, hw: -1, hh: -1 };
        } else {
          const at = (u: number, v: number): [number, number] => {
            const [bx, by] = ball(x - w / 2 + u, y - h / 2 + v);
            return [cx + bx, cy + by];
          };
          const q: Quad = [at(0, 0), at(w, 0), at(w, h), at(0, h)];
          node.style.visibility = "visible";
          node.style.transform = rectToQuadCss(w, h, q);
          const xs = q.map((p) => p[0]);
          const ys = q.map((p) => p[1]);
          const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
          drawn[i] = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2 };
        }
        if (r < bestD) {
          bestD = r;
          best = i;
        }
      });
      if (best !== last) {
        if (last !== -1) sound.cue("step");
        last = best;
      }
    };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      draw();
    };
    draw();
    raf = requestAnimationFrame(frame);

    const toLocal = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const k = appScale();
      return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
    };
    const down = (e: PointerEvent) => {
      const p = toLocal(e);
      drag = { ...p, moved: 0, id: e.pointerId };
      vel.x = vel.y = 0;
      aim = null;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = toLocal(e);
      const dx = p.x - drag.x;
      const dy = p.y - drag.y;
      pan.x += dx;
      pan.y += dy;
      vel.x = dx;
      vel.y = dy;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = p.x;
      drag.y = p.y;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const tap = drag.moved < 8;
      drag = null;
      if (!tap) {
        // Released without a throw: settle the nearest project under the lens right away.
        if (!vel.x && !vel.y) aim = { x: -rel[best].x, y: -rel[best].y };
        return;
      }
      vel.x = vel.y = 0;
      // The biggest tile under the finger wins (the lens draws it on top).
      const p = toLocal(e);
      let hit = -1;
      let hitS = 0;
      drawn.forEach((d, i) => {
        if (Math.abs(p.x - d.x) <= d.hw && Math.abs(p.y - d.y) <= d.hh && d.hw > hitS) {
          hit = i;
          hitS = d.hw;
        }
      });
      // The rule on every page: the project under the lens plays; another comes under the lens.
      if (hit === best) cb.current(hit);
      else if (hit >= 0) aim = { x: -rel[hit].x, y: -rel[hit].y };
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [tiles]);

  return (
    <div ref={root} data-lenis-prevent role="application" aria-label="Archive, drag to explore" className="absolute inset-0 touch-none overflow-hidden select-none">
      {tiles.map((t, i) => (
        <div
          key={t.slug}
          ref={(n) => {
            els.current[i] = n;
          }}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: t.w * K, height: ((t.w * 9) / 16) * K }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.poster ?? ""} alt="" draggable={false} className="size-full object-cover" />
          {/* The caption under the still; it rides the tile's transform, so it bends and shrinks with it on the ball. */}
          <TileLabel tile={t} className="absolute top-full left-0 mt-[4px]" />
        </div>
      ))}
    </div>
  );
}

// List on a phone: one screen, the projects stacked against the right
// edge, 12 apart; the one crossing the middle grows (16:9 always, 128 → 200 wide) and its neighbours step up with
// it, a pyramid pointing at the caption on the left (client and title in grey chips). A finger drags the stack and
// on release it lands on a project (lib/stepper, the same feel as Longform); it loops, no first or last one.
const ROW_H = 72; // the scroll pitch's base: one project at rest is 72 tall (128 × 72)
const GAP = 12;
const PITCH = ROW_H + GAP;
const BASE_W = 128;
const WIDE_W = 200; // the middle one: its left edge stops at 190, clear of the caption
const R169 = 9 / 16;
const REACH = 2.4; // projects over which the pyramid steps back down to BASE_W

function List({ tiles, onOpen }: { tiles: Tile[]; onOpen: (i: number) => void }) {
  const root = useRef<HTMLElement>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  // Only the caption follows the middle project in React; the rows never re-render while the stack moves (a re-keyed
  // row would remount its image and flash its grey box on every step).
  const [current, setCurrent] = useState(0);
  const cb = useRef({ onOpen, current });
  useEffect(() => {
    cb.current = { onOpen, current };
  });
  // Tap a row: the middle one plays; another glides to the middle (target set here, run by the loop).
  const jump = useRef<number | null>(null);

  // A layout effect with one tick before the first paint: the stack never shows piled at the top while the view fades in.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const n = tiles.length;
    const set = n * PITCH;
    const COPIES = 3;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let y = -set; // the middle copy's first row in the middle
    let v = 0; // px per frame while dragging, the release speed
    let drag: { y: number; t: number; id: number; moved: number; start: number } | null = null;
    let wheelEnd: ReturnType<typeof setTimeout> | undefined;
    let last = -1;
    let drawn = ""; // the offset and height last drawn: at rest the loop writes nothing
    let push: Animation[] = [];
    let raf = 0;

    // The active project pushes in slowly (the Mixer card and Longform film's signal), in all three copies.
    const pushIn = (i: number) => {
      push.forEach((a) => a.cancel());
      if (still) return;
      push = [0, 1, 2].flatMap((c) => {
        const img = rows.current[c * n + i]?.firstElementChild;
        return img ? [img.animate([{ transform: "scale(1)" }, { transform: "scale(1.06)" }], { duration: 10000, iterations: Infinity })] : [];
      });
    };

    const tick = () => {
      if (!drag && jump.current !== null) {
        // Landing (lib/stepper): ease into the target project.
        y += (jump.current - y) * STEPPER.ease;
        if (Math.abs(jump.current - y) < 0.5) {
          y = jump.current;
          jump.current = null;
        }
      }
      // Keep the offset inside the middle copy (and any glide target with it).
      if (y > -set + set / 2) {
        y -= set;
        if (jump.current !== null) jump.current -= set;
      }
      if (y < -2 * set + set / 2) {
        y += set;
        if (jump.current !== null) jump.current += set;
      }
      const mid = el.clientHeight / 2;
      const key = `${y.toFixed(2)} ${mid}`;
      if (key === drawn) return;
      drawn = key;
      // c = which project (of all copies, fractional) is in the middle. Each project's size comes from its
      // distance to c; positions are then stacked outward from the nearest one with the real heights + GAP,
      // so the growing ones push their neighbours instead of overlapping them.
      const c = -y / PITCH;
      const width = (k: number) => {
        const near = Math.max(0, 1 - Math.abs(k - c) / REACH);
        return BASE_W + (WIDE_W - BASE_W) * near * near * (3 - 2 * near);
      };
      const k0 = Math.round(c);
      const total = n * COPIES;
      const centre: number[] = [];
      centre[k0] = mid + (k0 - c) * (width(k0) * R169 + GAP);
      for (let k = k0 + 1; k < total; k++) centre[k] = centre[k - 1] + ((width(k - 1) + width(k)) * R169) / 2 + GAP;
      for (let k = k0 - 1; k >= 0; k--) centre[k] = centre[k + 1] - ((width(k + 1) + width(k)) * R169) / 2 - GAP;
      for (let k = 0; k < total; k++) {
        const node = rows.current[k];
        if (!node) continue;
        // Every row is drawn WIDE_W and scaled from its top-right corner: transforms only, no layout per frame.
        const w = width(k);
        node.style.transform = `translate3d(0, ${(centre[k] - (w * R169) / 2).toFixed(1)}px, 0) scale(${(w / WIDE_W).toFixed(4)})`;
      }
      const best = ((k0 % n) + n) % n;
      if (best !== last) {
        if (last !== -1) sound.cue("step");
        last = best;
        setCurrent(best);
        pushIn(best);
      }
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      tick();
    };
    tick();
    raf = requestAnimationFrame(loop);

    const down = (e: PointerEvent) => {
      drag = { y: e.clientY, t: performance.now(), id: e.pointerId, moved: 0, start: Math.round(-y / PITCH) };
      v = 0;
      jump.current = null;
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = (e.clientY - drag.y) / appScale();
      const now = performance.now();
      y += dy;
      v = v * 0.6 + (dy / Math.max(1, now - drag.t)) * 16.7 * 0.4;
      drag.moved += Math.abs(dy);
      drag.y = e.clientY;
      drag.t = now;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const tap = drag.moved < 8;
      if (performance.now() - drag.t > 80) v = 0;
      const start = drag.start;
      drag = null;
      // Land on a project: the throw is projected, one at least for a flick, three at most (lib/stepper).
      // Moving the content up (v < 0) goes to later projects.
      jump.current = -landing(start, -y / PITCH, -v, PITCH) * PITCH;
      v = 0;
      if (!tap) return;
      // Which row was tapped: the middle one plays, another comes to the middle.
      const hit = (e.target as Element | null)?.closest?.("[data-row]") as HTMLElement | null;
      if (!hit) return;
      const k = Number(hit.dataset.row);
      if (k % n === cb.current.current) cb.current.onOpen(k % n);
      else jump.current = -k * PITCH;
    };
    // Wheel / trackpad: follow it, then land on the nearest project once it stops.
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      jump.current = null;
      y -= e.deltaY / appScale();
      clearTimeout(wheelEnd);
      wheelEnd = setTimeout(() => (jump.current = Math.round(y / PITCH) * PITCH), 140);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wheelEnd);
      push.forEach((a) => a.cancel());
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [tiles]);

  // The 3 × 66 rows depend on the tiles only, so a new middle project re-renders the caption and nothing else.
  const stack = useMemo(
    () =>
      [0, 1, 2].flatMap((c) =>
        tiles.map((p, i) => (
          <button
            key={`${c}-${p.slug}`}
            ref={(node) => {
              rows.current[c * tiles.length + i] = node;
            }}
            type="button"
            data-row={c * tiles.length + i}
            tabIndex={c === 1 ? 0 : -1}
            aria-hidden={c === 1 ? undefined : true}
            aria-label={`${p.client}, ${p.short ?? p.label}`}
            // Taps go through the list's own gesture code (no onClick), so keyboards open a row here: Enter or Space.
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              cb.current.onOpen(i);
            }}
            className="absolute top-0 right-0 block origin-top-right overflow-hidden bg-neutral-100 will-change-transform"
            style={{ width: WIDE_W, height: WIDE_W * R169 }}
          >
            {/* Eager: a lazy image only starts loading once a fast throw has already brought it on screen. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.poster ?? ""} alt="" draggable={false} decoding="async" className="block size-full object-cover" />
          </button>
        )),
      ),
    [tiles],
  );

  const t = tiles[current];
  return (
    <section ref={root} aria-label="Projects" data-lenis-prevent className="absolute inset-0 touch-none overflow-hidden select-none">
      {stack}
      {/* The caption, pinned mid-screen on the left: client and title in grey chips. */}
      <div className="pointer-events-none absolute top-1/2 left-margin flex max-w-[166px] -translate-y-1/2 flex-col items-start">
        <span className="chip-client">{t.client}</span>
        <span className="chip-title">{t.short ?? t.label}</span>
      </div>
    </section>
  );
}

/**
 * The caption under every tile: the mixer caption's hierarchy, client (bold caps) over title (bold),
 * but small and grey, text only, so the field reads as pictures first. It may run wider than a small tile, up to the
 * space before the next column, and truncates past that.
 */
function TileLabel({ tile, className = "" }: { tile: Tile; className?: string }) {
  return (
    <span
      className={`pointer-events-none flex flex-col items-start font-sans font-bold whitespace-nowrap text-neutral-500 ${className}`}
      style={{ width: DX - 24 }}
    >
      <span className="max-w-full truncate text-[8px] leading-[1.2] uppercase">{tile.client}</span>
      <span className="max-w-full truncate text-[9px] leading-[1.2]">{tile.short ?? tile.label}</span>
    </span>
  );
}
