"use client";

import { useEffect } from "react";

/** Scrollbar width (0 with overlay scrollbars), measured on a probe; the page reserves it on every route. */
function scrollbarWidth() {
  const d = document.createElement("div");
  d.style.cssText = "position:absolute;top:-999px;width:99px;height:99px;overflow:scroll";
  document.documentElement.appendChild(d);
  const w = d.offsetWidth - d.clientWidth;
  d.remove();
  return w;
}

/**
 * Keeps --app-scale and --vh in step with the window (see app/layout.tsx). The scale uses the window
 * minus the scrollbar gutter (html has scrollbar-gutter: stable), so the fixed nav and the content
 * share one 1440 grid on browsers with classic scrollbars too, whether or not the page scrolls.
 */
export function StageScale() {
  useEffect(() => {
    const root = document.documentElement;
    const bar = scrollbarWidth();
    const update = () => {
      const s = (window.innerWidth - bar) / 1440;
      root.style.setProperty("--app-scale", s.toFixed(4));
      root.style.setProperty("--vh", `${(window.innerHeight / s).toFixed(2)}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return null;
}
