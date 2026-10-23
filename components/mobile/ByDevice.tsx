"use client";

import type { ReactNode } from "react";
import { usePhone } from "@/lib/device";

/**
 * A page that has its own phone layout: the route renders both elements, only one mounts. The server
 * and hydration render the desktop one (lib/device), so desktop SSR is unchanged; on a phone the stage
 * stays hidden until the phone layout has replaced it.
 */
export function ByDevice({ desktop, phone }: { desktop: ReactNode; phone: ReactNode }) {
  return <>{usePhone() ? phone : desktop}</>;
}
