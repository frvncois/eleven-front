import type { Metadata } from "next";
import privacy from "@/data/privacy.json";
import { Chrome } from "@/components/shell/Chrome";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";
import { ByDevice } from "@/components/mobile/ByDevice";
import { FooterLinks } from "@/components/ui/FooterLinks";
import { PrivacyMobile } from "@/components/mobile/PrivacyMobile";

export const metadata: Metadata = { title: "Privacy Policy" };

/**
 * Privacy Policy (no terms of use: only the privacy policy is required, CalOPPA). About's ruled-section system on the 9-col grid: title on the 24 margin,
 * each section a 4-col label (24 to 634) and the text from col 5 to col 9 (650 to 1416).
 * Ends on Contact's footer line (© / Privacy / Credits / LinkedIn, Instagram) in a 360 tall last section, so it sits
 * well apart from "Last updated". The butterfly stays bottom right next to SOUND.
 * Phone (PrivacyMobile): one column, each label above its text.
 */
export default function PrivacyPage() {
  return <ByDevice desktop={<PrivacyDesktop />} phone={<PrivacyMobile />} />;
}

function PrivacyDesktop() {
  return (
    <main className="bg-bg">
      <section className="px-margin pt-[240px] pb-[160px]">
        <h1 className="t-h2">{privacy.title}</h1>
      </section>
      {privacy.sections.map((s) => (
        <section key={s.id} id={s.id} className="flex scroll-mt-24 gap-gutter border-t border-neutral-1000 px-margin pt-margin pb-[120px]">
          <h2 className="t-h6 w-span-4 shrink-0 whitespace-pre">{s.label}</h2>
          <div className="t-body-lg flex flex-1 flex-col gap-5">
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
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
