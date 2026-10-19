import type { Metadata } from "next";
import Link from "next/link";
import about from "@/data/about.json";
import team from "@/data/team.json";
import { Chrome } from "@/components/shell/Chrome";
import { TeamCard } from "@/components/about/TeamCard";
import { RoomCarousel } from "@/components/about/RoomCarousel";
import { StorySticker } from "@/components/about/StorySticker";

export const metadata: Metadata = { title: "About" };

const nameOf = (slug: string) => team.find((p) => p.slug === slug)?.name ?? slug;

/** About (Figma V1 7345:1607, revised on V2 · 09 · About 7653:2391): story with sticky sticker, snow globe, services, rooms, team, contact. */
export default function AboutPage() {
  const { story, services } = about;
  return (
    <main className="bg-bg">

      {/* Story + snow globe share one container so the sticker can run through both.
          Amélie, Oct 19: the second paragraph always starts level with the top of the floss (Nav/Sub,
          bottom 16 + 113.35 tall = vh − 129.35), the intro (5 lines, 320) sits on top of it, so the
          padding is vh − 449.35 (≈ 575 on a 1024 screen). Revisions (V2 · 09 · About): the sticker starts higher (rests at
          120, held at 12 % ≈ 120 / 1024) and stays until after the snow globe, fading out at its end. */}
      <div className="relative">
        <StorySticker src={story.sticker.src} width={134} height={81} top={120} left={264} hold="12%" />
        <section className="relative flex flex-col items-end px-[22px] pt-[calc(var(--vh)-449.35px)]">
          <div className="relative flex w-[1385px] flex-col items-end">
            <p className="t-h2-indent w-full">{story.intro}</p>
            {story.paragraphs.map((p, i) => (
              <div key={p.note.n} className={`flex w-full justify-between ${i === 0 ? "items-end" : "items-center"}`}>
                <aside className="t-body-sm flex gap-2">
                  <span className="w-[15px] shrink-0">{p.note.n}</span>
                  <span className="w-[151.8px]">{p.note.text}</span>
                </aside>
                <p className="t-h2-indent shrink-0" style={{ width: p.width }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="relative h-[674px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.globe.src}
            alt="Snow globe of the old Santa Monica studio"
            width={story.globe.width}
            height={story.globe.height}
            className="absolute top-[134px] left-[494px]"
          />
        </div>
      </div>

      {/* Revision (Figma V2 · 09 · About, section-services 7671:2339): black rule on top, the label left,
          and from x 633 one row per service: the name in condensed serif capitals (Junicode wdth 87.5,
          50/100) and a big bold description (Neue 75, 46/100) right-aligned, rules between rows. */}
      <section className="flex items-start justify-between border-t border-neutral-1000 pt-margin pb-[120px] pl-margin">
        <h2 className="t-eyebrow">{services.label}</h2>
        <ul className="flex w-[807px] flex-col">
          {services.items.map(([name, note], i) => (
            <li
              key={name}
              className={`flex items-start justify-between pr-margin pb-margin ${i ? "pt-margin" : ""} ${i < services.items.length - 1 ? "border-b border-neutral-1000" : ""}`}
            >
              <span className="w-[322px] shrink-0 font-serif text-[50px] leading-none uppercase [font-stretch:87.5%]">{name}</span>
              <span className="w-[462px] text-right font-sans text-[46px] leading-none font-bold text-pretty">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <RoomCarousel items={about.roomCarousel.items} />

      {/* Revision (M2/Section/Team, "new layout"): THIS IS OUR TEAM spread edge to edge, then one
          full-width colour bar per person. */}
      <section className="flex h-[1024px] flex-col gap-6 px-margin pt-[120px] pb-16">
        <h2 className="t-h6 flex justify-between">
          {about.team.label.split(" ").map((w) => (
            <span key={w}>{w}</span>
          ))}
        </h2>
        <div className="flex flex-col gap-2">
          {about.team.rows.flat().map((c) => (
            <TeamCard key={c.slug} {...c} name={nameOf(c.slug)} />
          ))}
        </div>
      </section>

      {/* Revision (section-contact, "new layout"): one screen, the question centred; the whole section
          is the link to Contact, with the CONTACT US cursor tag. */}
      <Link
        href={about.contact.href}
        data-cursor={about.contact.cursor}
        className="flex h-[1024px] items-center justify-center px-margin pt-[120px] pb-16"
      >
        <h2 className="t-h2 w-[792px] text-center">{about.contact.title}</h2>
      </Link>

      <Chrome />
    </main>
  );
}
