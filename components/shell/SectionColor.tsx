"use client";

import { useEffect } from "react";

/**
 * Page background follows the section on screen: any element with data-section-color="<brand>"
 * turns the page that colour while it fills most of the view (annotation: "when you arrive in this
 * section, the background becomes yellow"), and it eases back when you scroll up. 0.6 s ease.
 */
export function SectionColor({ base }: { base: string }) {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("[data-page]");
    if (!main) return;
    main.style.transition = "background-color 0.6s cubic-bezier(0.4,0,0.2,1)";
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section-color]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const c = (e.target as HTMLElement).dataset.sectionColor;
          main.style.backgroundColor = e.isIntersecting ? `var(--color-${c})` : `var(--color-${base})`;
          // Lets the nav keep its current-page link readable on the coloured section (globals.css).
          if (e.isIntersecting) document.documentElement.dataset.section = c;
          else delete document.documentElement.dataset.section;
        }
      },
      { threshold: 0.45 },
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      delete document.documentElement.dataset.section;
    };
  }, [base]);
  return null;
}
