"use client";

import privacy from "@/data/privacy.json";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import { FooterMobile } from "./FooterMobile";
import { useDockToggle } from "./dock";

/**
 * Privacy on a phone: one column, each label above its text. Ends on the phone footer and carries
 * the butterfly in the dock's top-right slot, like Contact (desktop has both).
 */
export function PrivacyMobile() {
  useDockToggle(<ToggleButterfly />, true);
  return (
    <main className="bg-bg pb-[150px]">
      <section className="px-margin pt-[150px] pb-20">
        <h1 className="font-serif text-[40px] leading-none">{privacy.title}</h1>
      </section>
      {privacy.sections.map((s) => (
        <section key={s.id} id={s.id} className="flex scroll-mt-24 flex-col gap-4 border-t border-neutral-1000 px-margin pt-margin pb-14">
          <h2 className="t-h6 whitespace-pre">{s.label}</h2>
          <div className="t-body flex flex-col gap-4">
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
      ))}
      {/* Well apart from "Last updated", like the desktop's 360 last section (review note 18, carried to the phone Oct 23). */}
      <FooterMobile className="mt-[180px]" />
    </main>
  );
}
