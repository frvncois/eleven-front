"use client";

import { useEffect, useState } from "react";

const FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZoneName: "short",
});

/** The studio's time in Los Angeles, ticking (V2 annotation "time clock"): "14:07:32 PDT". */
export function Clock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(FMT.format(new Date()).replace(/^24:/, "00:"));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className={`tabular-nums ${className}`} suppressHydrationWarning>
      {now ?? "00:00:00 PST"}
    </time>
  );
}
