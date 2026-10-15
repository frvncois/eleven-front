"use client";

import Link from "next/link";
import site from "@/data/site.json";
import { mixers } from "@/lib/content";
import { sound } from "@/lib/sound";
import { useVHref } from "@/lib/version";

// The three columns of the V2 menu (Figma V2 · 02 · Home / V2 · 03 · Menu · Open), x in design px.
const accentOf = (label: string) => site.nav.find((n) => n.label === label)?.color ?? "neutral-1000";

/**
 * Mixers / Work / Info, in Nav/Link Serif. Each link hovers in its section's accent
 * (mixers red, Archive yellow, Longform dark green, About pink, Contact aqua).
 */
export function MenuColumns({ tone = "dark", onNavigate }: { tone?: "dark" | "light"; onNavigate?: () => void }) {
  const vhref = useVHref();
  const ink = tone === "light" ? "text-neutral-0" : "text-neutral-1000";
  const column = (label: string, x: string, width: number, links: { label: string; href: string; accent: string }[]) => (
    <div className={`absolute top-[33px] flex flex-col gap-3 ${ink}`} style={{ left: x, width }}>
      <p className="t-h6">{label}</p>
      <ul className="flex flex-col gap-4 pt-2 pb-5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={vhref(l.href)}
              onClick={onNavigate}
              onPointerEnter={() => sound.cue("navHover")}
              className="t-nav whitespace-nowrap transition-colors duration-300 ease-out hover:text-(--hover) [text-box:trim-both_cap_alphabetic]"
              style={{ "--hover": `var(--color-${l.accent})` } as React.CSSProperties}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <>
      {column("Mixers", "32px", 439, mixers.map((m) => ({ label: m.name, href: `/mixers/${m.slug}`, accent: accentOf("Mixers") })))}
      {column("Work", "calc(33.33% + 16px)", 218, ["Archive", "Longform"].map((l) => ({ label: l, href: site.nav.find((n) => n.label === l)!.href, accent: accentOf(l) })))}
      {column("Info", "66.67%", 181, ["About", "Contact"].map((l) => ({ label: l, href: site.nav.find((n) => n.label === l)!.href, accent: accentOf(l) })))}
    </>
  );
}
