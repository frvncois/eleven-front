"use client";

import { useEffect, useState } from "react";

/**
 * Dev only: press G to show the 9-column grid (24 margin, 16 gutter at 1440) and the centre axis,
 * the same as the Figma "9-col overlay" layer. Mounted in app/layout.tsx, inside the stage, so it
 * scales with --app-scale. Not rendered in production builds.
 */
function Overlay() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "g" && e.key !== "G") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      setOn((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!on) return null;
  return (
    <div aria-hidden data-grid-overlay className="pointer-events-none fixed inset-y-0 left-0 z-[9999] w-[1440px]">
      <div className="grid-site h-full">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="h-full bg-[rgb(237_32_36/0.1)] outline outline-[rgb(237_32_36/0.35)]" />
        ))}
      </div>
      <div className="absolute inset-y-0 left-[719.5px] w-px bg-[rgb(3_45_175/0.6)]" />
    </div>
  );
}

export const GridOverlay = process.env.NODE_ENV === "production" ? () => null : Overlay;
