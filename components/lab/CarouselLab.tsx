"use client";

import { useEffect, useState } from "react";
import type { Person, Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { VanishStrip, type StripMode } from "./VanishStrip";
import { LetterStrip } from "./LetterStrip";
import { WordmarkStrip } from "./WordmarkStrip";

type Option = { n: number; name: string; line: string; mode?: StripMode; depth?: number };

const OPTIONS: Option[] = [
  { n: 1, name: "Taper", mode: "taper", depth: 1, line: "The logo's exact lines. Cards keep their width and lose height to the right, like the letters." },
  { n: 2, name: "Vanish", mode: "vanish", depth: 1.25, line: "True perspective on the same lines. Cards narrow and pile up into the vanishing point." },
  { n: 3, name: "Warp", mode: "warp", depth: 1.25, line: "Flat at rest, speed bends it into the logo. Titles appear on hover." },
  { n: 4, name: "Letters", line: "Six slots cut like E L E V E N. Projects step through the letters, one title at a time." },
  { n: 5, name: "Wordmark", line: "The ELEVEN outline is the window: one project per letter, sliding letter to letter." },
];

/**
 * Carousel lab (not linked from the site): ways to bend the mixer-page carousel along the ELEVEN
 * wordmark's vanishing point. Jordan's page as the test bed; 1 to 5 switch options, the URL keeps
 * the choice (?o=3) so a link opens the right one.
 */
export function CarouselLab({ mixer, spots }: { mixer: Person; spots: Project[] }) {
  const [o, setO] = useState(1);
  const [depth, setDepth] = useState<Record<number, number>>(() => Object.fromEntries(OPTIONS.map((x) => [x.n, x.depth ?? 1])));
  const [titles, setTitles] = useState(true);
  const [playing, setPlaying] = useState<number | null>(null);
  const opt = OPTIONS[o - 1];

  useEffect(() => {
    const q = Number(new URLSearchParams(location.search).get("o"));
    if (q >= 1 && q <= OPTIONS.length) setO(q);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = Number(e.key);
      if (k >= 1 && k <= OPTIONS.length) choose(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Written on choice, not in an effect: an effect would overwrite ?o= before it is read. */
  function choose(n: number) {
    setO(n);
    history.replaceState(null, "", `?o=${n}`);
  }

  const open = (i: number) => openWithSound(() => setPlaying(i));

  return (
    <main data-page className="relative h-[var(--vh)] overflow-hidden bg-neutral-0">
      <h1 className="t-display-big absolute inset-x-0 top-[calc(var(--vh)*0.2)] text-center">{mixer.name}</h1>

      {opt.mode && <VanishStrip key={`${o}-${titles}`} films={spots} mode={opt.mode} depth={depth[o]} titles={titles} onOpen={open} />}
      {o === 4 && <LetterStrip films={spots} onOpen={open} />}
      {o === 5 && <WordmarkStrip films={spots} onOpen={open} />}

      {/* Option switcher: chips (neutral 200, selected 300), the option's one-liner, and its knobs. */}
      <div className="absolute inset-x-0 bottom-[132px] z-40 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {OPTIONS.map((x) => (
            <button
              key={x.n}
              type="button"
              onClick={() => choose(x.n)}
              className={`t-accent px-2 py-1 transition-opacity duration-200 ease-out hover:opacity-50 ${x.n === o ? "bg-neutral-300" : "bg-neutral-200"}`}
            >
              {String(x.n).padStart(2, "0")}. {x.name}
            </button>
          ))}
        </div>
        <p className="t-body-sm text-neutral-500">{opt.line}</p>
        {opt.mode && (
          <div className="t-body-sm flex items-center gap-4 text-neutral-500">
            <label className="flex items-center gap-2">
              Depth
              <input
                type="range"
                min={0}
                max={1.9}
                step={0.05}
                value={depth[o]}
                onChange={(e) => setDepth((d) => ({ ...d, [o]: Number(e.target.value) }))}
                className="w-[140px] accent-neutral-1000"
              />
              <span className="w-8 tabular-nums">{depth[o].toFixed(2)}</span>
            </label>
            {opt.mode !== "warp" && (
            <label className="flex cursor-pointer items-center gap-1">
              <input type="checkbox" checked={titles} onChange={(e) => setTitles(e.target.checked)} className="accent-neutral-1000" />
              Titles
            </label>
            )}
          </div>
        )}
      </div>

      <Chrome />
      <Player films={spots} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
    </main>
  );
}
