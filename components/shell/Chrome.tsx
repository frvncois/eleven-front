"use client";

import { NavBar } from "./NavBar";
import { NavSub } from "./NavSub";

type Props = { tone?: "dark" | "light"; toggles?: React.ReactNode; wordmark?: boolean };

/**
 * The page's navigation, by version. V1: inline Nav/Bar on top + Nav/Sub (wordmark, toggles,
 * sound) at the bottom. V2: one sticky header (logo, toggles, sound, MENU → overlay).
 */
export function Chrome({ tone = "dark", toggles, wordmark = true }: Props) {
  return (
    <>
      <NavBar tone={tone} />
      <NavSub toggles={toggles} wordmark={wordmark} />
    </>
  );
}
