"use client";

// Static class names per page accent (Tailwind needs them written out).
const ACCENT = {
  red: { on: "text-red", hover: "hover:text-red" },
  yellow: { on: "text-yellow", hover: "hover:text-yellow" },
} as const;

type Props<V extends string> = {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  accent: keyof typeof ACCENT;
  label: string;
  className?: string;
};

/**
 * LIST / GRID style text switch in Heading/H6 (Figma Revisions, Oct 19, Mixer + Archive): the current
 * option in the page accent, the others neutral/200, hover goes to the accent (0.3 s ease-out, like
 * the nav). Clicking the current option does nothing. Layout (gap, position) comes from `className`.
 */
export function TextToggle<V extends string>({ options, value, onChange, accent, label, className = "" }: Props<V>) {
  const c = ACCENT[accent];
  return (
    <div role="group" aria-label={label} className={`t-h6 flex ${className}`}>
      {options.map((o) => {
        const current = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            data-sound="off"
            aria-pressed={current}
            onClick={() => !current && onChange(o.value)}
            className={`cursor-pointer uppercase transition-colors duration-300 ease-out ${c.hover} ${current ? c.on : "text-neutral-200"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
