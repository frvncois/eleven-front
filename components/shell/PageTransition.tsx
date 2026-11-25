"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DUR, EASE_SWEEP, prefersReducedMotion, themeColor } from "@/lib/motion";
import { preloadArchive } from "@/lib/archive-preload";
import { sound, sweepSound } from "@/lib/sound";

const CARRY_KEY = "eleven-sweep";


/**
 * Page sweep: six bands cover from the left, the route changes,
 * the bands leave to the right. One colour for the whole transition, the destination's — and the
 * destination's own sound too, where Site Settings → nav gives that link one.
 * Intercepts every same-origin <a> click in the capture phase, so plain Next <Link>s get it for free.
 * Opt out with data-no-sweep.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const bandsRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ color: string; resolve: () => void } | null>(null);
  const busy = useRef(false);

  const sweep = (from: string, to: string, color: string) => {
    const bands = Array.from(bandsRef.current?.children ?? []) as HTMLElement[];
    return Promise.all(
      bands.map((b, i) => {
        b.style.background = color;
        return b.animate([{ transform: from }, { transform: to }], {
          duration: DUR.band,
          delay: i * DUR.stagger,
          easing: EASE_SWEEP,
          fill: "forwards",
        }).finished;
      }),
    );
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (busy.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-no-sweep")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const href = url.pathname + url.search + url.hash;
      if (prefersReducedMotion()) return router.push(href);

      busy.current = true;
      // Archive opens on the ball: get its thumbnails in during the sweep (keyboard clicks too).
      if (url.pathname === "/archive") preloadArchive();
      const color = themeColor(url.pathname);
      window.__lenis?.stop();
      sound.cue("sweepIn", sweepSound(url.pathname));
      sweep("translateX(-101%)", "translateX(0)", color).then(() => {
        new Promise<void>((resolve) => {
          pending.current = { color, resolve };
          // If Next falls back to a full page load (it does for unknown routes), the new page
          // picks this up on mount and finishes the reveal from a covered screen.
          try {
            sessionStorage.setItem(CARRY_KEY, JSON.stringify({ color, t: Date.now() }));
          } catch {}
          router.push(href, { scroll: false });
          // Never leave the screen covered: reveal after 2.5 s even if no route change was seen.
          setTimeout(() => {
            if (pending.current?.resolve === resolve) {
              pending.current = null;
              resolve();
            }
          }, 2500);
        }).then(() => {
          window.scrollTo(0, 0);
          window.__lenis?.scrollTo(0, { immediate: true, force: true });
          window.__lenis?.start();
          sound.cue("sweepOut");
          return sweep("translateX(0)", "translateX(101%)", color);
        }).then(() => {
          for (const b of Array.from(bandsRef.current?.children ?? [])) b.getAnimations().forEach((x) => x.cancel());
          busy.current = false;
        });
      });
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  // Arrived through a full page load mid-transition: start covered, then reveal.
  useEffect(() => {
    let carry: { color: string; t: number } | null = null;
    try {
      carry = JSON.parse(sessionStorage.getItem(CARRY_KEY) || "null");
      sessionStorage.removeItem(CARRY_KEY);
    } catch {}
    if (!carry || Date.now() - carry.t > 6000 || prefersReducedMotion()) return;
    busy.current = true;
    const bands = Array.from(bandsRef.current?.children ?? []) as HTMLElement[];
    bands.forEach((b) => {
      b.style.background = carry.color;
      b.style.transform = "translateX(0)";
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        sound.cue("sweepOut");
        sweep("translateX(0)", "translateX(101%)", carry.color).then(() => {
          bands.forEach((b) => {
            b.getAnimations().forEach((x) => x.cancel());
            b.style.transform = "translateX(-101%)";
          });
          busy.current = false;
        });
      }),
    );
  }, []);

  // The new route has rendered: wait two frames so it has painted, then reveal.
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    try {
      sessionStorage.removeItem(CARRY_KEY);
    } catch {}
    requestAnimationFrame(() => requestAnimationFrame(p.resolve));
  }, [pathname]);

  return (
    <div ref={bandsRef} aria-hidden className="pointer-events-none fixed inset-0 z-[1000] flex flex-col">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        // Inline transform, not a translate-x class: Tailwind v4 uses the `translate` property, which
        // would stack with the animated `transform` and keep the bands off screen.
        <div key={i} className="-my-px flex-1 will-change-transform" style={{ transform: "translateX(-101%)" }} />
      ))}
    </div>
  );
}
