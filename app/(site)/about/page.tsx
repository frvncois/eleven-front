import type { Metadata } from "next";
import Link from "next/link";
import about from "@/data/about.json";
import team from "@/data/team.json";
import { Chrome } from "@/components/shell/Chrome";
import { TeamCard } from "@/components/about/TeamCard";
import { NoteNumber, StoryText } from "@/components/about/NoteNumber";
import { NoteText } from "@/components/about/NoteText";
import { ServiceText } from "@/components/about/ServiceText";
import { RoomCarousel } from "@/components/about/RoomCarousel";
import { StorySticker } from "@/components/about/StorySticker";
import { AboutMobile } from "@/components/mobile/AboutMobile";
import { ByDevice } from "@/components/mobile/ByDevice";

export const metadata: Metadata = { title: "About" };

const nameOf = (slug: string) => team.find((p) => p.slug === slug)?.name ?? slug;
// TeamCard gets no `icon` here: no icon pops on the team bars.

/** About: story with sticky sticker, snow globe, services, rooms, team, contact. */
// The team title on the 9-col grid, one cell per word.
const TEAM_WORD_CELLS = ["col-start-1", "col-start-4", "col-start-6 justify-self-end", "col-start-9 justify-self-end"];

export default function AboutPage() {
  return <ByDevice desktop={<AboutDesktop />} phone={<AboutMobile />} />;
}

function AboutDesktop() {
  const { story, services } = about;
  return (
    <main className="bg-bg">

      {/* Story + snow globe share one container so the sticker can run through both.
          The second paragraph always starts level with the top of the floss (Nav/Sub,
          bottom 16 + 72.54 tall = vh − 88.54, the floss at 64 %), the intro (6 lines of 56, 332.5) sits
          on top of it, so the padding is vh − 425.67 (≈ 598 on a 1024 screen). The sticker rests at
          120 (held at 12 % ≈ 120 / 1024) and stays until after the snow globe, fading out at its end. */}
      <div className="relative">
        {/* 9-col grid: the sticker starts on col 3. */}
        <StorySticker src={story.sticker.src} width={134} height={81} top={120} left={336.89} hold="12%" />
        {/* 9-col grid: text on the 24 margin, the notes 1 col wide, paragraph 1 from col 3, paragraph 2 from col 4, both to 1416.
            Each first line is indented one column step (indent-col), so it starts on the next column:
            intro col 2, paragraph 1 col 4, paragraph 2 col 5. */}
        <section className="relative flex flex-col px-margin pt-[calc(var(--vh)-425.67px)]">
          <div className="relative flex w-full flex-col items-end">
            <p className="t-story indent-col w-full">{story.intro}</p>
            {story.paragraphs.map((p, i) => (
              <div key={p.note.n} className={`flex w-full justify-between ${i === 0 ? "items-end" : "items-center"}`}>
                <aside className="t-body-sm flex w-span-1 shrink-0 gap-2">
                  <NoteNumber n={p.note.n} className="shrink-0" />
                  <span className="w-[151.8px] shrink-0">
                    <NoteText text={p.note.text} photo={"photo" in p.note ? p.note.photo : undefined} />
                  </span>
                </aside>
                <p className={`t-story indent-col shrink-0 ${i === 0 ? "w-span-7" : "w-span-6"}`}>
                  <StoryText text={p.text} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="relative h-[674px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.globe.src}
            alt={story.globe.alt}
            width={story.globe.width}
            height={story.globe.height}
            className="absolute top-[134px] left-col-5 h-auto w-span-4"
          />
          {/* The globe's note on col 9, right beside it, level with its top. */}
          <aside className="t-body-sm absolute top-[134px] left-col-9 flex w-span-1 gap-2">
            <NoteNumber n={story.globe.note.n} className="shrink-0" />
            <span className="min-w-0">{story.globe.note.text}</span>
          </aside>
        </div>
      </div>

      {/* Services: black rule on top, the label left,
          and from x 633 one row per service: the name in condensed serif capitals (Junicode wdth 87.5,
          44/100) and a big bold description (Neue 75, 40/100) right-aligned, rules between rows (a step down
          from 50 / 46, with the story, so the page hits less hard). */}
      {/* 9-col grid: label column 4 cols (24 to 634), the list from col 5 (650), text ending at 1416. */}
      <section className="flex items-start border-t border-neutral-1000 pt-margin pb-[120px] pl-margin">
        <h2 className="t-eyebrow w-span-4 shrink-0">{services.label}</h2>
        <ul className="ml-gutter flex flex-1 flex-col">
          {services.items.map(([name, note], i) => (
            <li
              key={name}
              className={`flex items-start justify-between pr-margin pb-margin ${i ? "pt-margin" : ""} ${i < services.items.length - 1 ? "border-b border-neutral-1000" : ""}`}
            >
              <span className="w-[322px] shrink-0 font-serif text-[44px] leading-none uppercase [font-stretch:87.5%]">{name}</span>
              <span className="min-w-0 flex-1 text-right font-sans text-[40px] leading-none font-bold text-pretty">
                <ServiceText text={note} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <RoomCarousel items={about.roomCarousel.items} />

      {/* Team: THESE ARE OUR HUMANS spread edge to edge, then one
          full-width colour bar per person. */}
      <section className="flex h-[1024px] flex-col gap-6 px-margin pt-[120px] pb-16">
        {/* 9-col grid: word 1 starts col 1, word 2 starts col 4, word 3 ends col 6, word 4 ends col 9. */}
        {/* Neue Haas bold caps at 40, the sans of the bars' roles. */}
        <h2 className="grid grid-cols-9 gap-x-gutter font-sans text-[40px] leading-none font-bold uppercase">
          {about.team.label.split(" ").map((w, i) => (
            <span key={w} className={TEAM_WORD_CELLS[i]}>{w}</span>
          ))}
        </h2>
        <div className="flex flex-col gap-2">
          {about.team.rows.flat().map((c) => (
            <TeamCard key={c.slug} {...c} name={nameOf(c.slug)} />
          ))}
        </div>
      </section>

      {/* Contact: one screen, the question centred; the whole section
          is the link to Contact, with the CONTACT US cursor tag. */}
      <Link
        href={about.contact.href}
        data-cursor={about.contact.cursor}
        className="flex h-[1024px] items-center justify-center px-margin pt-[120px] pb-16"
      >
        <div className="flex w-span-5 flex-col items-center text-center">
          <h2 className="t-story text-balance">{about.contact.title}</h2>
          <p className="t-story">{about.contact.line}</p>
          <p className="t-mini mt-4 normal-case">{about.contact.aside}</p>
        </div>
      </Link>

      <Chrome />
    </main>
  );
}
