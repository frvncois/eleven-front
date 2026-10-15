"use client";

import { useVersion } from "@/lib/version";
import { NavBar } from "./NavBar";
import { NavSub } from "./NavSub";
import { NavSticky } from "./NavSticky";

type Props = { tone?: "dark" | "light"; toggles?: React.ReactNode; wordmark?: boolean };

/**
 * The page's navigation, by version. V1: inline Nav/Bar on top + Nav/Sub (wordmark, toggles,
 * sound) at the bottom. V2: one sticky header (logo, toggles, sound, MENU → overlay).
 */
export function Chrome({ tone = "dark", toggles, wordmark = true }: Props) {
  const v = useVersion();
  if (v === "v2") return <NavSticky tone={tone} toggles={toggles} />;
  return (
    <>
      <NavBar tone={tone} />
      <NavSub toggles={toggles} wordmark={wordmark} />
    </>
  );
}
