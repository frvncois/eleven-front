"use client";

import { useEffect } from "react";
import { DESKTOP_W, PHONE_W, detectPhone, setPhone } from "@/lib/device";

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
 * On a phone (lib/device) the stage is 390 wide instead; html.phone flips with the window.
 */
export function StageScale() {
  useEffect(() => {
    const root = document.documentElement;
    const bar = scrollbarWidth();
    const update = () => {
      const phone = detectPhone();
      setPhone(phone);
      const s = (window.innerWidth - (phone ? 0 : bar)) / (phone ? PHONE_W : DESKTOP_W);
      root.style.setProperty("--app-scale", s.toFixed(4));
      root.style.setProperty("--vh", `${(window.innerHeight / s).toFixed(2)}px`);
    };
    update();
    // The phone layouts have replaced the hydrated desktop ones by the second frame: show the stage.
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("phone-ready")));
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return null;
}
