import type { Metadata } from "next";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { Chip } from "@/components/ui/Chip";

export const metadata: Metadata = { title: "Not found" };

/**
 * 404. Only V2 has one in Figma (7345:1673, still wireframe copy + the dropped sound-shop samples);
 * this is the V1 adaptation: V1 nav, the centred Display/Big "404", one line, one chip home.
 * Copy is a proposal, to confirm with Amélie.
 */
export default function NotFound() {
  return (
    <main className="relative flex h-[max(var(--vh),1024px)] flex-col items-center justify-center gap-5 bg-neutral-0 text-center">
      <NavBar />
      <h1 className="t-display-big">404</h1>
      <p className="t-body-lg">
        This page went one louder and blew out.
        <br />
        The rest of the site is fine, we checked.
      </p>
      <div className="mt-6">
        <Chip href="/">Back to the homepage</Chip>
      </div>
      <NavSub />
    </main>
  );
}
