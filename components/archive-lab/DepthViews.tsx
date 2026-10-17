"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/content";
import { useStrip, wrap } from "@/components/lab/useStrip";
import { Rays, vanishPoint, vhOf } from "./ArchiveLab";

/**
 * Archive prototypes in real 3D (CSS perspective, origin on the vanishing point), one camera that
 * travels into the screen as you scroll:
 * - corridor: projects hang on the two walls and lie on the floor of a hallway; you walk down it.
 * - floor:    rows of projects lie flat on one plane that runs to the horizon; you glide over it.
 * - fly:      one project after the other, centred on the point; you dive through them.
 */
export type DepthMode = "corridor" | "floor" | "fly";

const PERSPECTIVE = 900;
const STAGE_W = 1440;

type Spot = { film: Project; index: number };

/** Where a slot sits in the world (z = 0 at the screen, negative = deeper). */
type Place = { x: number; y: number; z: number; rot: string; w: number; h: number };

function placeOf(mode: DepthMode, k: number, vh: number, vp: [number, number]): Omit<Place, "z"> & { lane: number } {
  if (mode === "corridor") {
    const w = 520, h = 293;
    const side = k % 3; // left wall, right wall, floor
    const y = vh * (k % 2 ? 0.2 : 0.34);
    if (side === 0) return { x: 0, y, rot: "rotateY(90deg)", w, h, lane: 0 };
    if (side === 1) return { x: STAGE_W, y, rot: "rotateY(-90deg)", w, h, lane: w };
    return { x: k % 2 ? 360 : 620, y: vh, rot: "rotateX(90deg)", w: w * 0.9, h: h * 0.9, lane: h * 0.9 };
  }
  if (mode === "floor") {
    const w = 440, h = 248 + 40;
    const col = k % 3;
    return { x: vp[0] - 760 + col * 540, y: vh * 0.98, rot: "rotateX(90deg)", w, h, lane: h };
  }
  // Fly: the frames wind round the point in a slow spiral, so the queue behind the front one shows
  // (dead centre, the front frame hid all the others).
  const w = 620, h = 349;
  const a = k * 1.25;
  return { x: vp[0] - w / 2 + Math.cos(a) * 340, y: vp[1] - h / 2 + Math.sin(a) * 190, rot: "", w, h, lane: 0 };
}

export function DepthView({ mode, films, onOpen }: { mode: DepthMode; films: Spot[]; onOpen: (i: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLButtonElement | null)[]>([]);
  const caption = useRef<HTMLDivElement>(null);
  const shownCaption = useRef(-1);
  const [vh, setVh] = useState(900);
  useEffect(() => {
    const on = () => setVh(vhOf());
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // Fly and floor read the horizon higher than the corridor, so the plane has room to run.
  const vp: [number, number] = mode === "floor" ? [vanishPoint(vh)[0], vh * 0.36] : vanishPoint(vh);
  // Depth between slots: the corridor alternates walls, the floor holds rows of three.
  const step = mode === "corridor" ? 300 : mode === "floor" ? 420 / 3 : 420;
  const items = useMemo(() => Array.from({ length: Math.max(24, films.length) }, (_, k) => films[k % films.length]), [films]);

  const click = useStrip(root, (s) => {
    const n = items.length;
    const total = n * step;
    const v = vhOf();
    const p = mode === "floor" ? [vanishPoint(v)[0], v * 0.36] as [number, number] : vanishPoint(v);
    let front = -1, frontZ = -Infinity;
    items.forEach((_, k) => {
      const el = els.current[k];
      if (!el) return;
      const pl = placeOf(mode, k, v, p);
      // Floor rows: three slots share one depth.
      const depthIndex = mode === "floor" ? Math.floor(k / 3) * 3 : k;
      const z = wrap(depthIndex * step + s.offset * 1.6, total) - total + (mode === "fly" ? 500 : 600);
      const zz = z - pl.lane;
      // Fade in from the far end, fade out as it passes the camera.
      const far = Math.min(1, (z + total - 400) / 900);
      const near = mode === "fly" ? Math.min(1, Math.max(0, (480 - z) / 300)) : Math.min(1, Math.max(0, (PERSPECTIVE * 0.75 - z) / 260));
      el.style.opacity = String(Math.max(0, Math.min(far, near)));
      el.style.visibility = far <= 0 || near <= 0 ? "hidden" : "visible";
      el.style.transform = `translate3d(${pl.x}px, ${pl.y}px, ${zz}px) ${pl.rot}`;
      el.style.width = `${pl.w}px`;
      el.style.height = `${pl.h}px`;
      if (mode === "fly" && z < 200 && z > frontZ) {
        frontZ = z;
        front = k;
      }
    });
    if (mode === "fly" && front !== shownCaption.current && caption.current) {
      shownCaption.current = front;
      const f = items[front]?.film;
      if (f) caption.current.innerHTML = `<span>${f.short ?? f.title}</span><span class="text-neutral-500">${f.client}</span>`;
    }
  }, { drift: mode === "fly" ? 0.9 : 0.7 });

  const rays: [number, number][] =
    mode === "floor"
      ? [[0, vh], [360, vh], [720, vh], [1080, vh], [STAGE_W, vh], [-1600, vh], [3040, vh]]
      : [[0, 0], [STAGE_W, 0], [0, vh], [STAGE_W, vh]];

  return (
    <div ref={root} data-lenis-prevent className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing">
      <Rays vp={vp} from={rays} />
      {mode === "floor" && <div className="pointer-events-none absolute inset-x-0 h-px bg-neutral-200" style={{ top: vp[1] }} />}
      <div className="absolute inset-0" style={{ perspective: PERSPECTIVE, perspectiveOrigin: `${vp[0]}px ${vp[1]}px` }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {items.map(({ film, index }, k) => (
            <button
              key={k}
              ref={(el) => {
                els.current[k] = el;
              }}
              type="button"
              data-cursor="play"
              onClick={click(() => onOpen(index))}
              className="group absolute top-0 left-0 flex origin-top-left cursor-pointer flex-col gap-2 text-left will-change-transform [backface-visibility:hidden]"
              style={{ visibility: "hidden" }}
            >
              <span className="relative block w-full flex-1 overflow-hidden bg-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={film.poster ?? ""} alt={`${film.client}, ${film.short ?? film.title}`} draggable={false} className="absolute inset-0 size-full object-cover" />
              </span>
              {mode === "floor" && (
                <span className="t-body flex justify-between whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ fontSize: 22 }}>
                  <span>{film.short ?? film.title}</span>
                  <span>{film.client}</span>
                </span>
              )}
              {mode === "corridor" && (
                <span className="t-body absolute inset-x-2 bottom-2 flex justify-between whitespace-nowrap text-neutral-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span>{film.short ?? film.title}</span>
                  <span>{film.client}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {mode === "fly" && <div ref={caption} className="t-body pointer-events-none absolute left-margin flex gap-3" style={{ top: vh - 150 }} />}
    </div>
  );
}
