"use client";

import Link from "next/link";
import { sound } from "@/lib/sound";

const OPTIONS = [
  { href: "/v1", n: "V1", name: "Inline nav", line: "The navigation sits on the page. Mixers opens the roster over it.", color: "aqua" },
  { href: "/v2", n: "V2", name: "Overlay nav", line: "A light sticky header. The whole menu opens over the page.", color: "red" },
];

/**
 * The prototype's front door: two halves, one per navigation option. Hover floods a half with
 * that version's gate colour; click opens it. Everything after this is the real site.
 */
export function Chooser() {
  return (
    <main className="relative flex h-(--vh) min-h-[700px] bg-neutral-0">
      <p className="t-eyebrow pointer-events-none absolute top-margin left-margin z-10">Eleven · website prototype</p>
      <p className="t-eyebrow pointer-events-none absolute top-margin right-margin z-10">Choose a navigation</p>
      {OPTIONS.map((o, i) => (
        <Link
          key={o.href}
          href={o.href}
          onPointerEnter={() => sound.cue("navHover")}
          className={`group relative flex flex-1 flex-col justify-end overflow-hidden p-margin pb-16 ${i === 0 ? "border-r border-neutral-1000" : ""}`}
        >
          <span
            aria-hidden
            className="absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.62,0.05,0.01,0.99)] group-hover:scale-y-100"
            style={{ background: `var(--color-${o.color})` }}
          />
          <span className="t-eyebrow relative mb-4">{o.n}</span>
          <span className="t-h1 relative">{o.name}</span>
          <span className="t-body-lg relative mt-6 max-w-[460px]">{o.line}</span>
        </Link>
      ))}
    </main>
  );
}
