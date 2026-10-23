"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { party, useParty } from "@/lib/party";
import { VideoParty } from "./VideoParty";

/**
 * The butterfly party (Contact, Legal): the funny-animals easter egg (VideoParty).
 */
export function PartyMode() {
  const on = useParty();
  const pathname = usePathname();

  // Leaving the page ends the party.
  useEffect(() => {
    party.set(false);
  }, [pathname]);

  return <VideoParty on={on} />;
}
