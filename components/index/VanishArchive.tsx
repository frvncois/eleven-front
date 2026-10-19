"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { LayoutGroup, motion, motionValue, type MotionValue } from "framer-motion";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";
import { preloadArchive } from "@/lib/archive-preload";
import { ArchiveStyleSwitch } from "./ArchiveStyleSwitch";
import { rectToQuadCss, type Pt, type Quad } from "@/lib/perspective";
import type { Tile } from "./IndexView";
import { VanishTuner, tune } from "./VanishTuner";

/**
 * Archive, option B (Amélie, Oct 17): the vanishing point of the mixer carousel instead of the ball.
 * A copy of IndexView with its grid swapped, so the live /archive stays untouched until one is picked.
 *
 * At rest the field is flat: the Figma grid as drawn, readable and clickable. Scrolling bends it
 * along the ELEVEN wordmark's taper (the same lines as the mixer Warp strip): the field keeps its
 * length in the direction you travel and loses height towards the vanishing point, which sits on
 * the side you are heading to. Scroll down, it sits below; swipe right, it sits to the right;
 * diagonal swipes put it in a corner. Change direction and the field first flattens, then tilts
 * the other way, so the point never spins across the screen. Stop, and it settles back flat.
 */

const MORPH = { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const };
const r169 = (w: number) => Math.round((w * 9) / 16);

// Field: IndexView's evened-out layout, then packed into even rows (Amélie, Oct 17: no channels of
// white between groups). Gaps are image to image: the 30 px title line counts in the vertical one.
const SPREAD = 0.95;
// More air (Amélie, Oct 17: "not too much at one spot"): 150 between images, was 80 (min 64 → 120).
const MIN_GAP = 120;
const FIELD_GAP = 150;
const ROWS = 9;
// Arrival (Amélie, Oct 17): C4 · Winter at this spot, with its neighbours around it.
const ARRIVE = { slug: "c4-winter", x: 615, y: 554 };

// The bend's values (depth, near size, taper length, speeds…) live in VanishTuner, read every frame.
// Depth 1 = the logo's own taper (far side at 0.378 of the near side); the mixer strip runs at 1.25.
const LOGO_RATIO = 108 / 285.8;
const META = 30; // gap 8 + one 22 px line of title / client under each thumbnail
const COPIES = [-1, 0, 1]; // the field repeats: each project is drawn from the 3 × 3 nearest copies

const scaleOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
const vhOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 1024;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function VanishArchive({ tiles, field }: { tiles: Tile[]; field: { w: number; h: number } }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const fromList = useRef(false);
  const [playing, setPlaying] = useState<number | null>(null);

  const toggle = () => {
    sound.cue(view === "grid" ? "gather" : "explode");
    fromList.current = view === "list";
    setView(view === "grid" ? "list" : "grid");
  };

  return (
    <main className="relative h-(--vh) overflow-hidden bg-neutral-0 select-none">
      <LayoutGroup>
        {view === "grid" ? (
          <VanishGrid tiles={tiles} field={field} fromList={fromList.current} onPlay={(i) => openWithSound(() => setPlaying(i))} paused={playing !== null} />
        ) : (
          <ListView tiles={tiles} onPlay={(i) => openWithSound(() => setPlaying(i))} />
        )}
      </LayoutGroup>

      <Chrome
        toggles={
          <>
            <ArchiveStyleSwitch current="vanish" />
          <button
            type="button"
            onClick={toggle}
            data-sound="off"
            aria-label={view === "grid" ? "Show as list" : "Show as grid"}
            className="block size-8 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view === "grid" ? "/icons/view-list.svg" : "/icons/view-grid.svg"} alt="" width={32} height={32} />
          </button>
          </>
        }
      />
      <VanishTuner />
      <Player films={tiles} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}

/* ------------------------------------------------------------------ */

/** Same evening-out as IndexView (deterministic, so both options share the layout). */
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

/**
 * Even rows: the evened-out field read top to bottom, cut into ROWS rows, then tiles swapped or moved
 * between neighbouring rows until every row's gap is as close to FIELD_GAP as it gets. Each row keeps its
 * left-to-right order and its start, and every tile rises until it sits one gap below the tiles
 * above it, so rows interlock like bricks instead of lining up into a grid.
 */
function pack(tiles: Tile[]) {
  const GV = FIELD_GAP - META;
  const seq = [...tiles].sort((a, b) => a.y + a.h / 2 - (b.y + b.h / 2) || a.x - b.x);
  const per = seq.length / ROWS;
  const rows = Array.from({ length: ROWS }, (_, r) => seq.slice(Math.round(r * per), Math.round((r + 1) * per)));
  const sumW = (r: Tile[]) => r.reduce((s, t) => s + t.w, 0);
  const score = () => {
    const fw = Math.max(...rows.map((r) => sumW(r) + r.length * FIELD_GAP));
    return { fw, cost: rows.reduce((c, r) => c + r.length * ((fw - sumW(r)) / r.length - FIELD_GAP) ** 2, 0) };
  };
  let cost = score().cost;
  for (let improved = true; improved; ) {
    improved = false;
    search: for (let a = 0; a < ROWS; a++) {
      for (const b of [(a + 1) % ROWS, (a + ROWS - 1) % ROWS]) {
        for (let i = 0; i < rows[a].length; i++) {
          if (rows[a].length > 5) {
            const [t] = rows[a].splice(i, 1);
            rows[b].push(t);
            const c = score().cost;
            if (c < cost - 1e-6) {
              cost = c;
              improved = true;
              break search;
            }
            rows[b].pop();
            rows[a].splice(i, 0, t);
          }
          for (let j = 0; j < rows[b].length; j++) {
            [rows[a][i], rows[b][j]] = [rows[b][j], rows[a][i]];
            const c = score().cost;
            if (c < cost - 1e-6) {
              cost = c;
              improved = true;
              break search;
            }
            [rows[a][i], rows[b][j]] = [rows[b][j], rows[a][i]];
          }
        }
      }
    }
  }
  const fw = score().fw;
  const overlapX = (a0: number, a1: number, b0: number, b1: number) => [-fw, 0, fw].some((o) => b0 + o < a1 && b1 + o > a0);
  const out: Tile[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    const gap = (fw - sumW(row)) / row.length;
    let x = Math.min(...row.map((t) => t.x));
    const above = [...out];
    for (const t of row) {
      let y = 0;
      for (const p of above) if (overlapX(x, x + t.w, p.x, p.x + p.w)) y = Math.max(y, p.y + p.h + GV);
      out.push({ ...t, x: ((x % fw) + fw) % fw, y });
      x += t.w + gap;
    }
  }
  // The copy below must clear every tile of this one.
  let fh = 0;
  for (const a of out) for (const b of out) if (overlapX(a.x, a.x + a.w, b.x, b.x + b.w)) fh = Math.max(fh, a.y + a.h + GV - b.y);
  return { tiles: out, field: { w: fw, h: fh } };
}

let packed: { source: Tile[]; tiles: Tile[]; field: { w: number; h: number } } | null = null;

function VanishGrid({
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
  // Worked out once per visit (the layout is the same every time).
  const { tiles, field } = useMemo(() => {
    if (!packed || packed.source !== figmaTiles) {
      const spread = { w: figmaField.w * SPREAD, h: figmaField.h * SPREAD };
      packed = { source: figmaTiles, ...pack(relax(figmaTiles.map((t) => ({ ...t, x: t.x * SPREAD, y: t.y * SPREAD })), spread)) };
    }
    return packed;
  }, [figmaTiles, figmaField.w, figmaField.h]);
  // One element per project per field copy; each frame maps it onto its bent quad (no re-render).
  const slots = useMemo(() => tiles.flatMap((t, i) => COPIES.flatMap((a) => COPIES.map((b) => ({ i, a, b })))), [tiles]);
  const els = useRef<(HTMLButtonElement | null)[]>([]);
  // Flat position of each project's nearest copy: drives the morph to and from the list.
  const [pos] = useState(() => tiles.map(() => ({ left: motionValue(0), top: motionValue(0) })));
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean; vx: number; vy: number; lx: number; ly: number } | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const [morphing, setMorphing] = useState(fromList);
  useEffect(() => {
    preloadArchive();
    if (!fromList) return;
    const t = setTimeout(() => setMorphing(false), MORPH.duration * 1000 + 50);
    return () => clearTimeout(t);
  }, [fromList]);

  useEffect(() => {
    window.__lenis?.stop();
    window.scrollTo(0, 0);
    const h = vhOf();
    const C: Pt = [720, h / 2];
    const wrapC = (v: number, size: number) => ((((v + size / 2) % size) + size) % size) - size / 2;

    // Opening view: the arrival project at its spot (the field wraps, so any offset works).
    const anchor = tiles.find((t) => t.slug === ARRIVE.slug) ?? tiles[0];
    const best = { x: ARRIVE.x - anchor.x, y: ARRIVE.y - anchor.y };
    target.current = { x: best.x, y: best.y };
    const cur = { ...target.current };

    // Bend state: amount 0 (flat) → 1 (the logo's taper), and the heading as a smoothed vector,
    // so a reversal passes through flat instead of swinging the vanishing point across the screen.
    const bend = { amount: 0, want: 0, hx: 0, hy: 1, speed: 0 };

    const draw = (vx: number, vy: number) => {
      // Anti-jiggle (Amélie, Oct 17): wheel events arrive unevenly, so the raw speed flickers and the
      // bend pumped in and out with it. The bend now follows a slow average of the speed.
      const raw = Math.hypot(vx, vy);
      bend.speed += (raw - bend.speed) * 0.06;
      const speed = bend.speed;
      // The camera heads opposite to the content: scroll down, the field moves up, you travel down.
      // "Point behind you" flips it to the side you come from. The heading snaps to the dominant axis,
      // so the small sideways drift of a trackpad scroll no longer wobbles the vanishing point.
      const side = tune.behind ? -1 : 1;
      if (raw > 0.6) {
        const k = tune.turn * Math.min(1, raw / 4);
        const horizontal = Math.abs(vx) > Math.abs(vy) * 1.5;
        const tx = horizontal ? -side * Math.sign(vx) : 0;
        const ty = horizontal ? 0 : -side * Math.sign(vy || 1);
        bend.hx += (tx - bend.hx) * k;
        bend.hy += (ty - bend.hy) * k;
      }
      const hl = Math.hypot(bend.hx, bend.hy);
      const want = Math.max(tune.preview, tune.rest, Math.min(1, speed / tune.fullSpeed)) * smooth(Math.min(1, hl));
      bend.amount += (want - bend.amount) * (want > bend.amount ? tune.attack : tune.release);
      if (bend.amount < 0.001) bend.amount = 0;
      bend.want = want;
      const amt = bend.amount;
      const dx = hl ? bend.hx / hl : 0;
      const dy = hl ? bend.hy / hl : 1;
      const ratio = 1 - (1 - LOGO_RATIO) * tune.depth;
      const near = tune.near;
      // The taper runs over one length whatever the heading (default: the logo's, the stage width),
      // so a vertical scroll bends exactly as much as a sideways one.
      const L = tune.length;
      const map = (x: number, y: number): [Pt, number] => {
        if (!amt) return [[x, y], 1];
        const rx = x - C[0];
        const ry = y - C[1];
        const u = rx * dx + ry * dy; // along the heading
        const w = -rx * dy + ry * dx; // across it
        const t = (u + L / 2) / L;
        const s = Math.max(0.02, near * (1 + (ratio - 1) * t));
        const bx = C[0] + u * dx - w * s * dy;
        const by = C[1] + u * dy + w * s * dx;
        return [[x + (bx - x) * amt, y + (by - y) * amt], 1 + (s - 1) * amt];
      };

      tiles.forEach((t, i) => {
        const fx = 720 + wrapC(t.x + cur.x + t.w / 2 - 720, field.w) - t.w / 2;
        const fy = h / 2 + wrapC(t.y + cur.y + t.h / 2 - h / 2, field.h) - t.h / 2;
        pos[i].left.set(fx);
        pos[i].top.set(fy);
      });
      slots.forEach(({ i, a, b }, k) => {
        const el = els.current[k];
        if (!el) return;
        const t = tiles[i];
        const x0 = pos[i].left.get() + a * field.w;
        const y0 = pos[i].top.get() + b * field.h;
        const H = r169(t.w) + META;
        const x1 = x0 + t.w;
        const y1 = y0 + H;
        // Far copies only matter once the field is bent: skip them cheaply at rest.
        if (!amt && (x1 < -40 || x0 > 1480 || y1 < -40 || y0 > h + 40)) {
          el.style.visibility = "hidden";
          return;
        }
        const [p0, s0] = map(x0, y0);
        const [p1, s1] = map(x1, y0);
        const [p2, s2] = map(x1, y1);
        const [p3, s3] = map(x0, y1);
        const q: Quad = [p0, p1, p2, p3];
        const xs = q.map((p) => p[0]);
        const ys = q.map((p) => p[1]);
        const scale = (s0 + s1 + s2 + s3) / 4;
        if (Math.max(...xs) < -40 || Math.min(...xs) > 1480 || Math.max(...ys) < -40 || Math.min(...ys) > h + 40 || Math.max(...ys) - Math.min(...ys) < 1) {
          el.style.visibility = "hidden";
          return;
        }
        el.style.visibility = "visible";
        el.style.transform = rectToQuadCss(t.w, H, q);
        // The side you come from is in front.
        el.style.zIndex = String(Math.round(scale * 100));
      });
      // Titles show on hover only while the field is (nearly) still.
      box.current?.toggleAttribute("data-moving", !tune.titlesMoving && Math.abs(amt - tune.rest) > 0.08);
    };

    let raf = 0;
    let settled = false;
    let rev = tune.rev;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const vx = (target.current.x - cur.x) * tune.glide;
      const vy = (target.current.y - cur.y) * tune.glide;
      // A settings change redraws even when the grid is still.
      if (rev !== tune.rev) {
        rev = tune.rev;
        settled = false;
      }
      const still = Math.abs(vx) < 0.005 && Math.abs(vy) < 0.005 && Math.abs(bend.amount - bend.want) < 0.001;
      if (still && settled) return;
      settled = still;
      cur.x += vx;
      cur.y += vy;
      draw(vx, vy);
    };
    draw(0, 0);
    raf = requestAnimationFrame(tick);

    const onWheel = (e: WheelEvent) => {
      if (paused || (e.target as Element)?.closest?.("[data-tuner]")) return;
      e.preventDefault();
      const s = scaleOf() / tune.wheel;
      target.current.x -= (e.shiftKey ? e.deltaY : e.deltaX) / s;
      target.current.y -= (e.shiftKey ? 0 : e.deltaY) / s;
      settled = false;
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const s = scaleOf();
      const mx = (e.clientX - d.x) / s;
      const my = (e.clientY - d.y) / s;
      if (Math.abs(mx) + Math.abs(my) > 4) d.moved = true;
      // Pointer speed, for the fling on release.
      d.vx = d.vx * 0.6 + (mx - d.lx) * 0.4;
      d.vy = d.vy * 0.6 + (my - d.ly) * 0.4;
      d.lx = mx;
      d.ly = my;
      target.current = { x: d.tx + mx, y: d.ty + my };
      settled = false;
    };
    const onUp = () => {
      const d = drag.current;
      // A flick keeps travelling a little, so a drag reads like a throw, not a stop.
      if (d?.moved) {
        target.current.x += d.vx * tune.fling;
        target.current.y += d.vy * tune.fling;
      }
      setTimeout(() => (drag.current = null));
    };
    const onKey = (e: KeyboardEvent) => {
      if (paused || (e.target as Element)?.closest?.("input")) return;
      const step = { ArrowUp: [0, 260], ArrowDown: [0, -260], ArrowLeft: [260, 0], ArrowRight: [-260, 0] }[e.key];
      if (!step) return;
      e.preventDefault();
      target.current.x += step[0];
      target.current.y += step[1];
      settled = false;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start();
    };
  }, [tiles, slots, field.w, field.h, pos, paused]);

  return (
    <div
      ref={box}
      className="group/field absolute inset-0 isolate cursor-grab overflow-hidden active:cursor-grabbing"
      onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY, tx: target.current.x, ty: target.current.y, moved: false, vx: 0, vy: 0, lx: 0, ly: 0 })}
    >
      {/* Flat stand-ins for the morph to and from the list, visible only while it plays. */}
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out" style={{ opacity: morphing ? 1 : 0 }}>
        {tiles.map((t, i) => (
          <motion.div key={t.slug} layoutId={t.slug} transition={MORPH} className="absolute" style={{ left: pos[i].left, top: pos[i].top, width: t.w }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.poster ?? ""} alt="" draggable={false} className="block w-full object-cover" style={{ height: r169(t.w) }} />
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-0 transition-opacity duration-300 ease-out" style={{ opacity: morphing ? 0 : 1 }}>
        {slots.map(({ i }, k) => {
          const t = tiles[i];
          return (
            <button
              key={k}
              ref={(el) => {
                els.current[k] = el;
              }}
              type="button"
              data-cursor="play"
              tabIndex={k % 9 === 4 ? 0 : -1}
              aria-label={`${t.client}, ${t.label}`}
              onClick={() => !drag.current?.moved && onPlay(i)}
              className="group absolute top-0 left-0 flex origin-top-left cursor-pointer flex-col gap-2 text-left will-change-transform"
              style={{ width: t.w, height: r169(t.w) + META, visibility: "hidden" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.poster ?? ""} alt="" draggable={false} decoding="async" className="block w-full shrink-0 bg-neutral-200 object-cover" style={{ height: r169(t.w) }} />
              <span className="t-h5 flex w-full justify-between gap-4 whitespace-nowrap opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-data-moving/field:opacity-0!">
                <span className="truncate">{t.label}</span>
                <span>{t.client}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List view: unchanged copy of IndexView's, so this option is complete on its own. */

const LIST_RIGHT = 1002;
const SMALL_W = 332;
const MID_W = 448;
const BIG_W = 564;
const GAP = 16;
const STEP = 300;
const widthAt = (d: number) => {
  const x = Math.abs(d);
  if (x <= 1) return MID_W + (BIG_W - MID_W) * smooth(1 - x);
  if (x <= 2) return SMALL_W + (MID_W - SMALL_W) * smooth(2 - x);
  return SMALL_W;
};

type Row = { left: MotionValue<number>; top: MotionValue<number>; width: MotionValue<number>; name: MotionValue<number>; color: MotionValue<string>; fade: MotionValue<number> };

function ListView({ tiles, onPlay }: { tiles: Tile[]; onPlay: (i: number) => void }) {
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
      const a = Math.floor(cur);
      const frac = cur - a;
      const ks = Array.from({ length: 13 }, (_, j) => j - 6);
      const idx = ks.map((k) => mod(a + k));
      const widths = ks.map((k) => widthAt(k - frac));
      const heights = widths.map(r169);
      const centers = new Array<number>(ks.length);
      const pitch = (j: number) => heights[j] / 2 + GAP + heights[j + 1] / 2;
      centers[6] = C - frac * pitch(6);
      for (let j = 7; j < ks.length; j++) centers[j] = centers[j - 1] + pitch(j - 1);
      for (let j = 5; j >= 0; j--) centers[j] = centers[j + 1] - pitch(j);
      const shown = new Set<number>();
      ks.forEach((k, j) => {
        const i = idx[j];
        if (shown.has(i)) return;
        shown.add(i);
        const r = rows[i];
        const d = k - frac;
        r.width.set(widths[j]);
        r.left.set(LIST_RIGHT - widths[j]);
        r.top.set(centers[j] - heights[j] / 2);
        r.name.set(centers[j]);
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
            <motion.p
              className="t-h5 pointer-events-none absolute left-[37px] -translate-y-1/2 whitespace-nowrap"
              style={{ top: r.name, color: r.color, opacity: r.fade }}
              initial={{ x: -16 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + Math.min(i, 8) * 0.04, ease: [0, 0, 0.58, 1] }}
            >
              {/* Revision (Figma V2 · 08 · Index · List): client first, the title on its own line. */}
              {t.client} /
              <br />
              {t.label}
            </motion.p>
          </div>
        );
      })}
    </div>
  );
}
