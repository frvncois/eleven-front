"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DUR, EASE_SWEEP, SWEEP_COLORS, prefersReducedMotion } from "@/lib/motion";
import { sound } from "@/lib/sound";

function colorFor(path: string) {
  let best = "/";
  for (const k of Object.keys(SWEEP_COLORS)) {
    if (k !== "/" && (path === k || path.startsWith(k + "/")) && k.length > best.length) best = k;
  }
  return SWEEP_COLORS[best];
}

/**
 * Page sweep (Figma "V1 · PAGE TRANSITIONS", 7405:4175): six bands cover from the left, the route changes,
 * the bands leave to the right. One colour for the whole transition, the destination's.
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
      const color = colorFor(url.pathname);
      window.__lenis?.stop();
      sound.cue("sweepIn");
      sweep("translateX(-101%)", "translateX(0)", color).then(() => {
        new Promise<void>((resolve) => {
          pending.current = { color, resolve };
          router.push(href, { scroll: false });
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

  // The new route has rendered: wait two frames so it has painted, then reveal.
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
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
