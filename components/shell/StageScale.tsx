"use client";

import { useEffect } from "react";

/** Keeps --app-scale and --vh in step with the window (see app/layout.tsx). */
export function StageScale() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const s = window.innerWidth / 1440;
      root.style.setProperty("--app-scale", s.toFixed(4));
      root.style.setProperty("--vh", `${(window.innerHeight / s).toFixed(2)}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return null;
}
