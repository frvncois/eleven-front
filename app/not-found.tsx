import type { Metadata } from "next";
import { Chrome } from "@/components/shell/Chrome";
import { Stretch404 } from "@/components/ui/Stretch404";

export const metadata: Metadata = { title: "Not found" };

/**
 * 404: the giant pink "404" bent towards the pointer (Stretch404), "Sorry we lost you." in H2 on
 * its midline over the 0. The nav takes you back.
 */
export default function NotFound() {
  return (
    <main className="relative h-(--vh) overflow-hidden bg-bg">
      <Stretch404 />
      <h1 className="t-h2 absolute inset-x-0 top-[calc(var(--vh)*0.496)] -translate-y-1/2 px-margin text-center text-neutral-1000 [text-box:trim-both_cap_alphabetic] phone:text-[24px]">
        Sorry we lost you.
      </h1>
      <Chrome />
    </main>
  );
}
