import type { Metadata } from "next";
import legal from "@/data/legal.json";
import { Chrome } from "@/components/shell/Chrome";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import { ByDevice } from "@/components/mobile/ByDevice";
import { FooterLinks } from "@/components/ui/FooterLinks";
import { LegalMobile } from "@/components/mobile/LegalMobile";

export const metadata: Metadata = { title: "Legal" };

/**
 * Legal: privacy (CalOPPA's points, for a site that collects nothing, with its small effective date), cookies, use of the films.
 * No separate terms of use: nothing on the site to govern (no shop, accounts or forms). About's ruled-section system on the 9-col grid: title on the 24 margin,
 * each section a 4-col label (24 to 634) and the text from col 5 to col 9 (650 to 1416).
 * Ends on Contact's footer line (© / Legal / Credits / LinkedIn, Instagram) in a 360 tall last section.
 * The butterfly stays bottom right next to SOUND.
 * Phone (LegalMobile): one column, each label above its text.
 */
export default function LegalPage() {
  return <ByDevice desktop={<LegalDesktop />} phone={<LegalMobile />} />;
}

function LegalDesktop() {
  return (
    <main className="bg-bg">
      <section className="px-margin pt-[240px] pb-[160px]">
        <h1 className="t-h2">{legal.title}</h1>
      </section>
      {legal.sections.map((s) => (
        <section key={s.id} id={s.id} className="flex scroll-mt-24 gap-gutter border-t border-neutral-1000 px-margin pt-margin pb-[120px]">
          <h2 className="t-h6 w-span-4 shrink-0 whitespace-pre">{s.label}</h2>
          <div className="t-body-lg flex flex-1 flex-col gap-5">
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.note && <p className="t-body-sm mt-3">{s.note}</p>}
          </div>
        </section>
      ))}
      <footer className="relative h-[360px]">
        <FooterLinks />
      </footer>
      <Chrome toggles={<ToggleButterfly />} bareToggles />
    </main>
  );
}
