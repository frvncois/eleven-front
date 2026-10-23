"use client";

import { NavBar } from "./NavBar";
import { NavSub } from "./NavSub";
import { usePhone } from "@/lib/device";

type Props = { tone?: "dark" | "light"; toggles?: React.ReactNode; bareToggles?: boolean; wordmark?: boolean };

/**
 * The page's navigation, by version. V1: inline Nav/Bar on top + Nav/Sub (wordmark, toggles,
 * sound) at the bottom. V2: one sticky header (logo, toggles, sound, MENU → overlay).
 * Phone: nothing here, the dock (components/mobile/PhoneShell) is mounted once for the whole visit.
 */
export function Chrome({ tone = "dark", toggles, bareToggles, wordmark = true }: Props) {
  const phone = usePhone();
  if (phone) return null;
  return (
    <>
      <NavBar tone={tone} />
      <NavSub toggles={toggles} bareToggles={bareToggles} wordmark={wordmark} tone={tone} />
    </>
  );
}
