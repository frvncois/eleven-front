"use client";

import { useSyncExternalStore } from "react";

// Studio time in Los Angeles, 12-hour with seconds and the zone ("3:42:07 PM PST", PDT in summer).
const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZoneName: "short",
});

// One tick a second; the snapshot is the current whole second, so it stays stable between ticks.
const subscribe = (tick: () => void) => {
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
};
const second = () => Math.floor(Date.now() / 1000);

/**
 * The studio clock on the home, light grey bold 12. Desktop: left of the SOUND chip, 24 apart, on its middle line.
 * Phone: top-right corner of the dock.
 * Empty on the server, so its time never mismatches the visitor's.
 */
export function PacificClock() {
  const s = useSyncExternalStore(subscribe, second, () => null);
  const now = s === null ? null : new Date(s * 1000);

  return (
    <time
      dateTime={now?.toISOString()}
      className="mr-4 font-sans phone:mr-0 text-[12px] leading-none font-bold whitespace-nowrap text-neutral-200 tabular-nums"
    >
      {now ? FORMAT.format(now) : null}
    </time>
  );
}
