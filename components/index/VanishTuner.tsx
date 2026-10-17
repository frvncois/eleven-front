"use client";

import { useEffect, useState } from "react";

/**
 * Settings panel for the vanishing-point Archive (/archive/vanish). Lab only: every value is read
 * by the grid on each frame, so moving a slider changes the next frame. Values live in the URL, so
 * a setting can be shared as a link; "S" shows / hides the panel.
 */

type Setting = { key: string; label: string; hint: string; min: number; max: number; step: number; value: number };
type Group = { title: string; settings: Setting[] };

export const GROUPS: Group[] = [
  {
    title: "Shape",
    settings: [
      { key: "depth", label: "Depth", hint: "How far the grid falls away. 1 = the logo, 1.25 = the mixer strip", min: 0, max: 2.5, step: 0.05, value: 1.25 },
      { key: "near", label: "Near size", hint: "How big the side you come from gets", min: 0.6, max: 2, step: 0.05, value: 1.55 },
      { key: "length", label: "Taper length", hint: "Distance over which it narrows. Shorter brings the vanishing point on screen", min: 800, max: 3000, step: 20, value: 2780 },
      { key: "rest", label: "Bend at rest", hint: "0 = flat when you stop. Above 0 it keeps a tilt towards the last direction", min: 0, max: 0.8, step: 0.02, value: 0 },
      { key: "behind", label: "Point behind you", hint: "0 = the point is where you head to, 1 = where you come from", min: 0, max: 1, step: 1, value: 0 },
    ],
  },
  {
    title: "Feel",
    settings: [
      { key: "fullSpeed", label: "Speed for full bend", hint: "Lower = bends fully with a gentle scroll", min: 4, max: 60, step: 1, value: 26 },
      { key: "attack", label: "Bend in", hint: "How fast it bends when you start", min: 0.02, max: 0.5, step: 0.01, value: 0.02 },
      { key: "release", label: "Settle back", hint: "How fast it goes flat when you stop", min: 0.01, max: 0.3, step: 0.01, value: 0.03 },
      { key: "turn", label: "Turn speed", hint: "How fast the point follows a change of direction", min: 0.01, max: 0.4, step: 0.01, value: 0.08 },
      { key: "glide", label: "Scroll ease", hint: "Low = long soft glide, high = sticks to your finger", min: 0.03, max: 0.3, step: 0.01, value: 0.09 },
      { key: "wheel", label: "Scroll distance", hint: "How far one scroll moves the grid", min: 0.2, max: 3, step: 0.1, value: 1 },
      { key: "fling", label: "Drag throw", hint: "How far a flicked drag keeps travelling", min: 0, max: 30, step: 1, value: 0 },
    ],
  },
  {
    title: "Titles",
    settings: [{ key: "titlesMoving", label: "Titles while moving", hint: "0 = hide the hover title while the grid bends", min: 0, max: 1, step: 1, value: 0 }],
  },
];

const ALL = GROUPS.flatMap((g) => g.settings);
const DEFAULTS: Record<string, number> = Object.fromEntries(ALL.map((s) => [s.key, s.value]));

/** The live values. The grid reads them every frame; `rev` changes on every edit so it redraws. */
export const tune: Record<string, number> & { rev: number; preview: number } = { ...DEFAULTS, rev: 0, preview: 0 };

/** Read the URL once (and reduced motion, which starts flat). */
export function loadTune() {
  const q = new URLSearchParams(window.location.search);
  for (const s of ALL) {
    const v = parseFloat(q.get(s.key) ?? "");
    tune[s.key] = Number.isFinite(v) ? v : s.value;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) tune.depth = 0;
  tune.rev++;
}

const decimals = (step: number) => (step >= 1 ? 0 : String(step).split(".")[1].length);

export function VanishTuner() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<Record<string, number>>(DEFAULTS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTune();
    setValues(Object.fromEntries(ALL.map((s) => [s.key, tune[s.key]])));
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element)?.closest?.("input")) return;
      if (e.key === "s" || e.key === "S") setOpen((o) => !o);
    };
    // Letting go of a Shape slider lets the grid settle back.
    const onUp = () => {
      if (!tune.preview) return;
      tune.preview = 0;
      tune.rev++;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const write = (next: Record<string, number>) => {
    Object.assign(tune, next);
    tune.rev++;
    setValues(next);
    // Only the values that differ from the defaults go in the URL.
    const q = new URLSearchParams();
    for (const s of ALL) if (next[s.key] !== s.value) q.set(s.key, String(next[s.key]));
    const qs = q.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const chip = "bg-neutral-200 px-2 py-1 uppercase transition-opacity duration-200 ease-out hover:opacity-50";

  if (!open)
    return (
      <button type="button" data-tuner onClick={() => setOpen(true)} className={`fixed top-24 right-6 z-[70] text-[11px] font-medium ${chip}`} style={{ fontFamily: "var(--font-sans)" }}>
        Settings
      </button>
    );

  return (
    <aside
      data-tuner
      data-lenis-prevent
      aria-label="Vanishing point settings"
      className="fixed top-24 right-6 z-[70] max-h-[calc(var(--vh)-200px)] w-[300px] overflow-y-auto bg-neutral-0/90 p-4 text-[11px] leading-[1.3] font-medium text-neutral-1000 backdrop-blur-[10px]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="mb-3 flex items-center justify-between uppercase">
        <span>Settings</span>
        <button type="button" onClick={() => setOpen(false)} className={chip} aria-label="Hide settings (S)">
          Hide · S
        </button>
      </div>

      {GROUPS.map((g) => (
        <section key={g.title} className="border-t border-neutral-200 py-3">
          <p className="mb-2 uppercase text-neutral-500">{g.title}</p>
          {g.settings.map((s) => {
            const v = values[s.key];
            const toggle = s.max === 1 && s.step === 1;
            return (
              <label key={s.key} className="mb-3 block" title={s.hint}>
                <span className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="tabular-nums">{toggle ? (v ? "On" : "Off") : v.toFixed(decimals(s.step))}</span>
                </span>
                {toggle ? (
                  <input type="checkbox" checked={!!v} onChange={(e) => write({ ...values, [s.key]: e.target.checked ? 1 : 0 })} className="mt-1 accent-neutral-1000" />
                ) : (
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={v}
                    // Shape sliders hold the grid at full bend while dragged, so the shape shows at rest.
                    onPointerDown={() => {
                      if (g.title !== "Shape") return;
                      tune.preview = 1;
                      tune.rev++;
                    }}
                    onChange={(e) => write({ ...values, [s.key]: parseFloat(e.target.value) })}
                    className="mt-1 block w-full accent-neutral-1000"
                  />
                )}
                <span className="mt-0.5 block text-neutral-500">{s.hint}</span>
              </label>
            );
          })}
        </section>
      ))}

      <p className="border-t border-neutral-200 pt-3 pb-3 text-neutral-500">
        At rest the grid is flat: Shape sliders hold the full bend while you drag them. Feel settings only show when you scroll over the images.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => write({ ...DEFAULTS })} className={chip}>
          Reset
        </button>
        <button type="button" onClick={copy} className={chip}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </aside>
  );
}
