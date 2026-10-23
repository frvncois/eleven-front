import Link from "next/link";
import about from "@/data/about.json";
import team from "@/data/team.json";
import { RoomCarousel } from "@/components/about/RoomCarousel";
import { StorySticker } from "@/components/about/StorySticker";
import { NoteNumber, StoryText } from "@/components/about/NoteNumber";
import { TeamBarsMobile } from "./TeamBarsMobile";

const nameOf = (slug: string) => team.find((p) => p.slug === slug)?.name ?? slug;
// Story, after ascension.pegassi.be/about on a phone (Amélie, Oct 22): one continuous text, no space
// between paragraphs, same size and leading throughout. A new paragraph only shows by where it starts:
// the blocks alternate full width / inset one column, and each first line is indented on the grid.
//   intro        full width, first line in 1 col
//   paragraph 1  inset 1 col (284.8 wide), first line in 1 more col
//   paragraph 2  full width, first line in 2 cols
// The notes leave the flow (Pegassi hides its side notes on the phone) and sit together under it.
const STORY = [
  { inset: 0, indent: 1 },
  { inset: 1, indent: 1 },
  { inset: 0, indent: 2 },
];
const block = (k: number) => {
  const { inset, indent } = STORY[Math.min(k, STORY.length - 1)];
  return { marginLeft: `calc(var(--grid-step) * ${inset})`, textIndent: `calc(var(--grid-step) * ${indent})` };
};

/**
 * About on a phone (mobile plan 3.7; the team is Figma M · 08 · About · Team 7696:2005, the rest
 * straight to code from the annotation). Story in Mobile/Story (Junicode 32) as one continuous text
 * (STORY above), the sticker held on screen, the snow globe, services as name over description, the room banner, the team bars
 * that open as they cross the middle, then "work together?" on one screen with a CONTACT US chip.
 */
export function AboutMobile() {
  const { story, services } = about;
  const cards = about.team.rows.flat().map((c) => ({ ...c, name: nameOf(c.slug) }));
  return (
    <main className="bg-bg">
      <div className="relative">
        {/* The sticker at 60 %, resting in the intro's first-line indent (col 1), held at 14 % of the
            screen and riding over the story like desktop. */}
        <StorySticker src={story.sticker.src} width={72} height={43} top={170} left={16} hold="14%" />
        {/* Top padding 324, from Figma M · 10 · About section-story (Amélie, Oct 22). */}
        <section className="flex flex-col px-margin pt-[324px]">
          <p className="font-serif text-[28px] leading-none" style={block(0)}>
            {story.intro}
          </p>
          {story.paragraphs.map((p, i) => (
            <p key={p.note.n} className="font-serif text-[28px] leading-none" style={block(i + 1)}>
              <StoryText text={p.text} />
            </p>
          ))}
          <div className="mt-8 flex flex-col gap-3">
            {story.paragraphs.map((p) => (
              <aside key={p.note.n} className="t-body-sm flex w-span-3 gap-2">
                <NoteNumber n={p.note.n} boxed className="shrink-0" />
                <span>{p.note.text}</span>
              </aside>
            ))}
          </div>
        </section>
        <div className="relative h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.globe.src}
            alt="Snow globe of the old Santa Monica studio"
            width={story.globe.width}
            height={story.globe.height}
            className="absolute top-12 left-col-2 h-auto w-span-4"
          />
        </div>
      </div>

      {/* Services: the label, then each service as its name (condensed serif caps) over its note, right-aligned. */}
      <section className="border-t border-neutral-1000 px-margin pt-margin pb-20">
        <h2 className="t-eyebrow pb-8">{services.label}</h2>
        <ul className="flex flex-col">
          {services.items.map(([name, note], i) => (
            <li key={name} className={`flex flex-col gap-3 py-4 ${i < services.items.length - 1 ? "border-b border-neutral-1000" : ""}`}>
              <span className="font-serif text-[20px] leading-none uppercase [font-stretch:87.5%]">{name}</span>
              <span className="ml-auto w-span-4 text-right font-sans text-[16px] leading-[1.15] font-bold text-pretty">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <RoomCarousel items={about.roomCarousel.items} />

      {/* "This is our team" spread over the 358, the bars under it. */}
      <section className="flex flex-col gap-4 px-margin pt-20 pb-20">
        <h2 className="t-eyebrow flex justify-between">
          {about.team.label.split(" ").map((w) => (
            <span key={w}>{w}</span>
          ))}
        </h2>
        <TeamBarsMobile cards={cards} />
      </section>

      {/* The question in Mobile/Line (40) and a pink CONTACT US chip, on one full screen (Revision notes on
          M · 10 · About, Oct 22: "this section needs to take 100vh", "button needs to be pink"); the
          whole screen links. The team above ends on an 80 padding, like its 80 top. */}
      <Link href={about.contact.href} className="flex h-(--vh) flex-col items-center justify-center gap-6 px-margin">
        <h2 className="w-span-4 text-center font-serif text-[28px] leading-none text-balance">{about.contact.title}</h2>
        <span className="chip bg-pink">{about.contact.cursor}</span>
      </Link>
    </main>
  );
}
