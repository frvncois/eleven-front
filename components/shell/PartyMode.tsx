"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { party, useParty } from "@/lib/party";
import { sound } from "@/lib/sound";
import { mixers } from "@/lib/content";

// Eleven's brand colours, in the order they flash, and the text that reads on each.
const PALETTE: [string, string][] = [
  ["var(--color-pink)", "#000"],
  ["var(--color-royal-blue)", "#fff"],
  ["var(--color-yellow)", "#000"],
  ["var(--color-red)", "#fff"],
  ["var(--color-aqua)", "#000"],
  ["var(--color-purple)", "#fff"],
  ["var(--color-bright-green)", "#000"],
  ["var(--color-dark-green)", "#fff"],
];

type Bouncer = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number };

/**
 * The butterfly party (Contact, Terms). On: the page flashes through the brand colours on every
 * beat, a synthesized loop plays (placeholder track), and the mixers' icons bounce around the
 * screen. Click the butterfly again, press Esc or leave the page to stop.
 */
export function PartyMode() {
  const on = useParty();
  const pathname = usePathname();
  const [beat, setBeat] = useState(0);
  const layer = useRef<HTMLDivElement>(null);

  // Leaving the page ends the party.
  useEffect(() => {
    party.set(false);
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (!on) {
      root.classList.remove("party");
      return;
    }
    root.classList.add("party");
    // The butterfly click is a gesture: unlock audio and make sure we can hear it.
    sound.setMuted(false);
    sound.unlock();
    sound.duck();
    sound.startParty((b) => setBeat(b));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && party.set(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("party");
      sound.stopParty();
      sound.unduck();
      window.removeEventListener("keydown", onKey);
    };
  }, [on]);

  // Colour on the beat.
  useEffect(() => {
    if (!on) return;
    const [bg, ink] = PALETTE[beat % PALETTE.length];
    document.documentElement.style.setProperty("--party-bg", bg);
    document.documentElement.style.setProperty("--party-ink", ink);
  }, [on, beat]);

  // Bouncing icons (DVD-logo style), in design units inside the stage.
  useEffect(() => {
    if (!on || !layer.current) return;
    const imgs = Array.from(layer.current.children) as HTMLElement[];
    const vw = 1440;
    const vh = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 1024;
    const b: Bouncer[] = imgs.map((_, i) => ({
      x: 120 + ((i * 211) % (vw - 360)),
      y: 120 + ((i * 157) % (vh - 360)),
      vx: (i % 2 ? 1 : -1) * (2.2 + (i % 3)),
      vy: (i % 3 ? 1 : -1) * (1.8 + (i % 2)),
      r: 0,
      vr: (i % 2 ? 1 : -1) * 0.6,
      w: 160,
    }));
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      b.forEach((o, i) => {
        o.x += o.vx;
        o.y += o.vy;
        o.r += o.vr;
        if (o.x < 0 || o.x > vw - o.w) o.vx *= -1;
        if (o.y < 0 || o.y > vh - o.w) o.vy *= -1;
        imgs[i].style.transform = `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)`;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  return (
    <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 z-[40] overflow-hidden">
      {mixers.map(
        (m) =>
          m.icon?.white && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.slug} src={m.icon.white} alt="" className="absolute top-0 left-0 h-40 w-40 object-contain mix-blend-difference" />
          ),
      )}
    </div>
  );
}
