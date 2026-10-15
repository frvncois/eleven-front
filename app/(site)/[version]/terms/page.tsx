import type { Metadata } from "next";
import terms from "@/data/terms.json";
import { Chrome } from "@/components/shell/Chrome";
import { ToggleButterfly } from "@/components/ui/ToggleButterfly";

export const metadata: Metadata = { title: "Terms & Policy" };

/** V1 · 12 · Terms & Policy (Figma 7453:4225): About's ruled-section system, label column 578, text from x 610. */
export default function TermsPage() {
  return (
    <main className="bg-bg">
      <section className="px-[22px] pt-[240px] pb-[160px]">
        <h1 className="t-h2">{terms.title}</h1>
      </section>
      {terms.sections.map((s) => (
        <section key={s.id} id={s.id} className="flex scroll-mt-24 gap-2 border-t border-neutral-1000 px-margin pt-margin pb-[120px]">
          <h2 className="t-h6 w-[578px] shrink-0 whitespace-pre">{s.label}</h2>
          <div className="t-body-lg flex flex-1 flex-col gap-5">
            {s.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
      ))}
      <Chrome toggles={<ToggleButterfly />} />
    </main>
  );
}
