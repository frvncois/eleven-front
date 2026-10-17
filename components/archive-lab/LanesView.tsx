"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Person, Project } from "@/lib/content";
import { quadVisible, rectToQuadCss, squareToQuad, type Pt, type Quad } from "@/lib/perspective";
import { useStrip, wrap } from "@/components/lab/useStrip";
import { Rays, vanishPoint, vhOf } from "./ArchiveLab";

const CW = 480;
const IMG_H = 270;
const TITLE_H = 34;
const CH = IMG_H + TITLE_H;

/**
 * Archive prototype · Lanes. One lane per mixer, all fanning out of the same vanishing point like
 * rails on a road (the wordmark's geometry, six times). Each lane is that mixer's strip: big at the
 * left edge, shrinking into the point. Scrolling slides every lane towards the point; hovering a
 * lane slows it down and shows the titles. The mixer's name sits at the mouth of their lane.
 */
export function LanesView({ lanes, onOpen }: { lanes: { mixer: Person; films: { film: Project; index: number }[] }[]; onOpen: (i: number) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[][]>([]);
  const hover = useRef(-1);
  const laneSpeed = useRef(lanes.map(() => 1));
  const laneOffset = useRef(lanes.map(() => 0));
  const [geo, setGeo] = useState<{ vp: Pt; mouths: [number, number][] } | null>(null);

  // Each lane's cards, repeated so the loop never runs dry before the point.
  const items = useMemo(() => lanes.map((l) => Array.from({ length: Math.max(16, l.films.length * 2) }, (_, k) => l.films[k % l.films.length])), [lanes]);

  const layout = () => {
    const vh = vhOf();
    const vp = vanishPoint(vh);
    const top = 96, bottom = vh - 170, gap = 14;
    const h = (bottom - top - gap * (lanes.length - 1)) / lanes.length;
    const mouths = lanes.map((_, j): [number, number] => [top + j * (h + gap), top + j * (h + gap) + h]);
    return { vp, mouths };
  };

  useEffect(() => {
    setGeo(layout());
    const onResize = () => setGeo(layout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const click = useStrip(root, (s) => {
    const { vp, mouths } = layout();
    lanes.forEach((_, j) => {
      // Hovered lane slows to a crawl so its titles can be read; the others keep going.
      const want = hover.current === j ? 0.15 : 1;
      laneSpeed.current[j] += (want - laneSpeed.current[j]) * 0.08;
      laneOffset.current[j] += s.velocity * laneSpeed.current[j];

      // The lane's quad: its mouth on the left edge, its two edges running to the point. The right
      // side stops at 85 % of the way; cards past it keep shrinking into the point.
      const [yT, yB] = mouths[j];
      const xr = vp[0] * 0.85;
      const q: Quad = [[0, yT], [xr, yT + (vp[1] - yT) * 0.85], [xr, yB + (vp[1] - yB) * 0.85], [0, yB]];
      const H = squareToQuad(q);
      const dXdu = (H.project(0.001, 0.5)[0] - H.project(0, 0.5)[0]) / 0.001;
      const cardW = ((yB - yT) * CW) / CH; // the near card keeps the card's proportions
      const du = cardW / dXdu, gapU = 10 / dXdu, pitch = du + gapU;
      const list = items[j], total = list.length * pitch;
      list.forEach((_, k) => {
        const el = cards.current[j]?.[k];
        if (!el) return;
        const u = wrap(k * pitch - laneOffset.current[j] / dXdu, total) - pitch;
        if (H.depthAt(u, 0) < 0.25) {
          el.style.visibility = "hidden";
          return;
        }
        const qk: Quad = [H.project(u, 0), H.project(u + du, 0), H.project(u + du, 1), H.project(u, 1)];
        if (!quadVisible(qk)) {
          el.style.visibility = "hidden";
          return;
        }
        el.style.visibility = "visible";
        el.style.transform = rectToQuadCss(CW, CH, qk);
      });
    });
  }, { drift: 0.8 });

  return (
    <div ref={root} data-lenis-prevent className="absolute inset-0 touch-none">
      {geo && <Rays vp={geo.vp} from={geo.mouths.flatMap(([a, b]) => [[0, a], [0, b]] as [number, number][])} />}
      {lanes.map((lane, j) => (
        <div key={lane.mixer.slug} className="group/lane" onPointerEnter={() => (hover.current = j)} onPointerLeave={() => (hover.current = hover.current === j ? -1 : hover.current)}>
          {items[j].map(({ film, index }, k) => (
            <button
              key={k}
              ref={(el) => {
                (cards.current[j] ??= [])[k] = el;
              }}
              type="button"
              data-cursor="play"
              onClick={click(() => onOpen(index))}
              className="group absolute top-0 left-0 block origin-top-left cursor-pointer text-left will-change-transform"
              style={{ width: CW, height: CH, visibility: "hidden" }}
            >
              <span className="relative block overflow-hidden bg-neutral-200" style={{ height: IMG_H }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={film.poster ?? ""} alt={`${film.client}, ${film.short ?? film.title}`} draggable={false} className="absolute inset-0 size-full object-cover" />
              </span>
              <span
                className="flex items-end justify-between px-2 whitespace-nowrap opacity-0 transition-opacity duration-300 ease-out group-hover/lane:opacity-100"
                style={{ height: TITLE_H, fontSize: 24, fontFamily: "var(--font-sans)", fontWeight: 500 }}
              >
                <span>{film.short ?? film.title}</span>
                <span>{film.client}</span>
              </span>
            </button>
          ))}
          {geo && (
            <span className="t-accent pointer-events-none absolute left-margin z-10 bg-neutral-0 px-1" style={{ top: geo.mouths[j][0] + 6 }}>
              {lane.mixer.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
