"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Person, Project } from "@/lib/content";
import { PHONE_MOTION } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { openWithSound } from "@/components/mixers/Player";
import { ViewToggle } from "@/components/shell/ViewToggle";
import { PlayerMobile } from "./PlayerMobile";
import { useDockToggle } from "./dock";
import { STEPPER, landing } from "@/lib/stepper";
import { lerpQuad, rectToQuadCss, taperField, type Quad } from "@/lib/perspective";

type View = "carousel" | "grid";
const VIEWS: [{ value: View; label: string }, { value: View; label: string }] = [
  { value: "carousel", label: "List" },
  { value: "grid", label: "Grid" },
];

const CARD = { w: 300, h: 168.75, gap: 8 };
const STEP = CARD.w + CARD.gap;
const COPIES = 3;
/**
 * The desktop Warp on the phone (Oct 23): flat at rest, speed bends the strip into the ELEVEN wordmark's taper, the
 * vanishing point on the side it travels from. The field spans the 390 screen like the desktop's spans 1440; a little
 * gentler than the desktop's 1.25 since one card fills most of the screen.
 * depth: taper strength · grow: left-edge height vs a flat card · full: px per frame for the full bend ·
 * bendIn / bendOut: share of the gap closed per frame.
 */
const WARP = { depth: 1, grow: 1.3, full: 18, bendIn: 0.12, bendOut: 0.05 };
const SWAP = PHONE_MOTION.layer;
const LAYER = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(8px)" },
};

const label = (p: Project) => `${p.client}, ${p.short ?? p.title}`;

/** The caption every project has (Oct 22): client and title as two grey chips, stacked flush, no gap (Amélie, Oct 23). */
function Caption({ p }: { p: Project }) {
  return (
    <span className="flex flex-col items-start">
      <span className="chip-client">{p.client}</span>
      <span className="chip-title">{p.short ?? p.title}</span>
    </span>
  );
}

/**
 * Figma M · 05 · Mixer (7696:2002). The name in serif 40 caps (Junicode, first and last name
 * on two lines, centred 150 from the top), then the strip: 300-wide cards, the centred one with its
 * neighbours cut at both edges. Every card carries its caption under it (client and title chips), so it travels
 * with it; the card in the middle pushes in slowly (the desktop's 10 s preview stand-in). The strip is endless,
 * follows the finger and lands on a card (lib/stepper). Tap the middle card = the player, another = to the middle.
 * GRID in the dock = one column, edge to edge, each film's caption under it (mobile plan 3.3).
 */
export function MixerMobile({ mixer, spots }: { mixer: Person; spots: Project[] }) {
  const [view, setView] = useState<View>("carousel");
  const [playing, setPlaying] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const [first, ...rest] = mixer.name.split(" ");

  const choose = (v: View) => {
    sound.cue(v === "grid" ? "explode" : "gather");
    setView(v);
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
  };
  useDockToggle(<ViewToggle options={VIEWS} value={view} onChange={choose} />);

  // The endless strip: a finger drags it and on release it lands on a card (lib/stepper, the same feel as the Archive
  // list and Longform, sideways); it loops (three copies of the spots), so there is no first or last card. The card in
  // the middle is the current one (it pushes in, a soft step plays when it changes). The page is one screen, so a
  // swipe anywhere on it drives the strip, up or down as well as sideways (up = later cards, like the desktop wheel),
  // and the strip bends with its speed (WARP).
  const dragged = useRef(false);
  const goTo = useRef<number | null>(null); // a card (index over all copies) to bring to the middle
  // A layout effect with one tick before the first paint, so the strip never shows unplaced while the view fades in.
  useLayoutEffect(() => {
    const el = pageRef.current;
    const track = trackRef.current;
    if (!el || !track || view !== "carousel") return;
    const n = spots.length;
    const set = n * STEP;
    const scale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
    const lead = (390 - CARD.w) / 2; // x of the middle card's left edge
    let x = lead - set; // first card of the middle copy in the middle
    let v = 0; // px per frame while dragging, positive to the right
    let drag: { x: number; y: number; t: number; id: number; moved: number; start: number; axis: "x" | "y" | null } | null = null;
    let raf = 0;
    let last = -1;
    let push: Animation[] = [];
    const at = () => (lead - x) / STEP; // which card is in the middle, fractional

    // The bend. Fields are in strip coordinates: x on the 390 screen, y from the top of the film (the caption under it
    // rides along, v > 1). Each card maps its own box onto its quad, offset by where it sits flat.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fieldOpts = { midY: CARD.h / 2, hLeft: CARD.h * WARP.grow, depth: WARP.depth, width: 390 };
    const fwd = taperField(fieldOpts);
    const back = taperField({ ...fieldOpts, mirror: true });
    const heights = cards.current.map((c) => c?.offsetHeight ?? CARD.h);
    const warp = { amount: 0, dir: 1 };
    let prevX = x;
    let bent = true; // so the first frame clears any transform
    const bend = (speed: number) => {
      const target = still ? 0 : Math.min(1, Math.abs(speed) / WARP.full);
      warp.amount += (target - warp.amount) * (target > warp.amount ? WARP.bendIn : WARP.bendOut);
      if (Math.abs(speed) > 0.8) warp.dir += (Math.sign(speed) - warp.dir) * 0.08;
      if (warp.amount < 0.002) {
        warp.amount = 0;
        if (!bent) return;
        cards.current.forEach((c) => c && (c.style.transform = ""));
        bent = false;
        return;
      }
      bent = true;
      cards.current.forEach((c, k) => {
        if (!c) return;
        const x0 = x + k * STEP;
        if (x0 > 390 + STEP || x0 < -2 * STEP) return; // off screen, never seen
        const h = heights[k];
        const vb = h / CARD.h;
        const quad = (f: typeof fwd): Quad => [f.at(x0, 0), f.at(x0 + CARD.w, 0), f.at(x0 + CARD.w, vb), f.at(x0, vb)];
        const flat: Quad = [[x0, 0], [x0 + CARD.w, 0], [x0 + CARD.w, h], [x0, h]];
        const q = lerpQuad(flat, lerpQuad(quad(back), quad(fwd), (warp.dir + 1) / 2), warp.amount);
        c.style.transform = rectToQuadCss(CARD.w, h, q.map(([px, py]) => [px - x0, py]) as Quad);
      });
    };
    // The middle card pushes in slowly, in all three copies, on the image that is already there (re-keying it
    // remounted the image and flashed its grey box on every new card, the Archive list's bug, Oct 23).
    const pushIn = (i: number) => {
      push.forEach((a) => a.cancel());
      if (still) return;
      push = [0, 1, 2].flatMap((c) => {
        const img = cards.current[c * n + i]?.firstElementChild?.firstElementChild;
        return img ? [img.animate([{ transform: "scale(1)" }, { transform: "scale(1.06)" }], { duration: 10000, iterations: Infinity })] : [];
      });
    };
    const tick = () => {
      if (!drag && goTo.current !== null) {
        const tx = lead - goTo.current * STEP;
        x += (tx - x) * STEPPER.ease;
        if (Math.abs(tx - x) < 0.5) {
          x = tx;
          goTo.current = null;
        }
      }
      // Keep x inside the middle copy so both neighbours always exist (and the target with it).
      // Speed before the loop jump, positive while the strip travels left (later cards in), as on the desktop.
      const speed = prevX - x;
      if (x > lead - set + STEP / 2) {
        x -= set;
        if (goTo.current !== null) goTo.current += n;
      }
      if (x < lead - 2 * set + STEP / 2) {
        x += set;
        if (goTo.current !== null) goTo.current -= n;
      }
      prevX = x;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      bend(speed);
      const best = ((Math.round(at()) % n) + n) % n;
      if (best !== last) {
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
      if (playingRef.current !== null) return; // the player sits on top
      drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, moved: 0, start: Math.round(at()), axis: null };
      dragged.current = goTo.current !== null; // a touch on a landing strip only catches it
      goTo.current = null;
      v = 0;
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const mx = (e.clientX - drag.x) / scale();
      const my = (e.clientY - drag.y) / scale();
      // The gesture keeps the axis it starts on, so a slightly diagonal swipe never jitters between the two.
      if (!drag.axis && Math.hypot(mx, my) > 4) drag.axis = Math.abs(mx) >= Math.abs(my) ? "x" : "y";
      const dx = drag.axis === "y" ? my : drag.axis === "x" ? mx : 0;
      const now = performance.now();
      x += dx;
      v = v * 0.6 + (dx / Math.max(1, now - drag.t)) * 16.7 * 0.4;
      drag.moved += Math.abs(mx) + Math.abs(my);
      if (drag.moved > 8) dragged.current = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.t = now;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (performance.now() - drag.t > 80) v = 0;
      // Moving the strip left (v < 0) brings later cards in.
      if (drag.moved > 8) goTo.current = landing(drag.start, at(), -v, STEP);
      drag = null;
      v = 0;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      push.forEach((a) => a.cancel());
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [view, spots.length]);

  // A new card in the middle: a soft step, like the desktop strip.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    sound.cue("step");
  }, [current]);

  // The rule on every page (Oct 22): tap the card in the middle = play it; tap another = bring it to the middle.
  const tap = (k: number) => {
    const i = k % spots.length;
    if (i === current) openWithSound(() => setPlaying(i));
    else goTo.current = k;
  };

  return (
    <main
      ref={pageRef}
      data-lenis-prevent={view === "carousel" ? true : undefined}
      className={`relative bg-neutral-0 ${view === "carousel" ? "h-(--vh) touch-none overflow-hidden select-none" : "min-h-(--vh) pb-[140px]"}`}
    >
      <h1 className="px-margin pt-[150px] text-center font-serif text-[40px] leading-[0.95] uppercase">
        {first}
        <br />
        {rest.join(" ")}
      </h1>

      <AnimatePresence mode="popLayout" initial={false}>
        {view === "carousel" ? (
          <motion.section key="carousel" aria-label="Projects" className="absolute inset-x-0 top-[calc(var(--vh)*0.52)]" {...LAYER} transition={SWAP}>
            <div className="overflow-x-clip py-1">
              <div ref={trackRef} className="flex w-max items-start gap-2 will-change-transform">
                {Array.from({ length: COPIES }, (_, c) =>
                  spots.map((p, i) => (
                    <button
                      key={`${c}-${p.slug}`}
                      ref={(b) => {
                        cards.current[c * spots.length + i] = b;
                      }}
                      type="button"
                      tabIndex={c === 1 ? 0 : -1}
                      aria-hidden={c === 1 ? undefined : true}
                      aria-label={`Play ${label(p)}`}
                      // A drag is not a tap.
                      onClick={() => !dragged.current && tap(c * spots.length + i)}
                      onDragStart={(e) => e.preventDefault()}
                      className="flex shrink-0 origin-top-left flex-col gap-2 text-left will-change-transform"
                      style={{ width: CARD.w }}
                    >
                      <span className="relative block shrink-0 overflow-hidden bg-neutral-100" style={{ width: CARD.w, height: CARD.h }}>
                        {/* Eager: a lazy image only starts loading once a throw has already brought it on screen. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.poster ?? ""} alt="" draggable={false} decoding="async" className="absolute inset-0 size-full object-cover" />
                      </span>
                      {/* Each card carries its own caption, so the titles travel with the projects. No number. */}
                      <Caption p={p} />
                    </button>
                  )),
                )}
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section key="grid" aria-label="Projects" className="mt-[88px] flex flex-col gap-8" {...LAYER} transition={SWAP}>
            {spots.map((p, i) => (
              <button key={p.slug} type="button" onClick={() => openWithSound(() => setPlaying(i))} className="flex flex-col gap-2 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.poster ?? ""} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                <span className="px-margin">
                  <Caption p={p} />
                </span>
              </button>
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      <PlayerMobile films={spots} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
