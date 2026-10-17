"use client";

import Link from "next/link";
import { useState } from "react";
import { sound } from "@/lib/sound";
import type { Person } from "@/lib/content";

/**
 * Section/Whos Next (Figma 7372:2334): the other mixers in a row. Hovering a name shows that
 * mixer's icon under it (black versions); click goes to their page. The section colours the page
 * red while it is on screen (see SectionColor); was yellow in the Figma, red since 15 Oct (the Mixers accent).
 */
export function WhosNext({ others }: { others: Person[] }) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section data-section-color="red" className="flex h-[1024px] w-[1440px] flex-col px-8">
      <div className="flex h-[550px] items-end justify-center pb-16">
        <h2 className="t-h5">WHO’S NEXT?</h2>
      </div>
      <div className="flex h-[422px] items-start justify-between">
        {others.map((m) => (
          <Link
            key={m.slug}
            href={`/mixers/${m.slug}`}
            onPointerEnter={() => {
              setHover(m.slug);
              sound.cue("navHover");
            }}
            onPointerLeave={() => setHover((h) => (h === m.slug ? null : h))}
            className="relative flex flex-col items-start"
          >
            <span className="t-nav-lg whitespace-nowrap">{m.name}</span>
            {m.icon?.black && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.icon.black}
                alt=""
                className="pointer-events-none absolute top-[60px] left-1/2 h-40 max-w-none -translate-x-1/2 object-contain transition-opacity duration-300 ease-out"
                style={{ opacity: hover === m.slug ? 1 : 0 }}
              />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
