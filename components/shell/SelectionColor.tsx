"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { THEME_INK, themeColor } from "@/lib/motion";

/**
 * Text selection in the page's accent (Amélie, Oct 19): sets --accent / --accent-ink on <html> from
 * the route's theme colour (the same as its sweep and cursor tag: Mixers red, Archive aqua, Longform
 * dark green, About pink, Contact royal blue), read by ::selection in globals.css.
 */
export function SelectionColor() {
  const path = usePathname();
  useEffect(() => {
    const bg = themeColor(path);
    const root = document.documentElement.style;
    root.setProperty("--accent", bg);
    root.setProperty("--accent-ink", THEME_INK[bg] ?? "#bdbdbd");
  }, [path]);
  return null;
}
