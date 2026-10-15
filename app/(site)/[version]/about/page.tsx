import type { Metadata } from "next";
import about from "@/data/about.json";
import team from "@/data/team.json";
import { Chrome } from "@/components/shell/Chrome";
import { TeamCard } from "@/components/about/TeamCard";
import { RoomsRow } from "@/components/about/RoomsRow";
import { StorySticker } from "@/components/about/StorySticker";

export const metadata: Metadata = { title: "About" };

const nameOf = (slug: string) => team.find((p) => p.slug === slug)?.name ?? slug;

/** V1 · 09 · About (Figma 7345:1607): story with sticky sticker, snow globe, services, rooms, team. */
export default function AboutPage() {
  const { story, services, rooms } = about;
  return (
    <main className="bg-bg">

      {/* Story. The sticker starts just above the first paragraph (x 264, the second paragraph's edge), 134 × 81. */}
      <section className="relative flex flex-col items-end px-[22px] pt-[604px]">
        <StorySticker src={story.sticker.src} width={134} height={81} top={499} left={264} end={1560} />
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

      <section className="flex items-start justify-between border-t border-neutral-1000 px-margin pt-margin pb-[120px]">
        <h2 className="t-eyebrow">{services.label}</h2>
        <ul className="t-h2 flex w-[806px] flex-col gap-2 text-balance">
          {services.items.map(([name, note], i) => (
            <li
              key={name}
              className={`flex justify-between whitespace-nowrap [text-box:trim-both_cap_alphabetic] ${i === 0 ? "pb-4" : "border-t border-muted py-4"}`}
            >
              <span>{name}</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Annotation: 100vh, minus the nav and 24 px, so the bar never overlaps it. */}
      <section className="flex h-[calc(var(--vh)-78px)] min-h-[600px] items-start justify-between overflow-hidden border-t border-neutral-1000 p-margin">
        <h2 className="t-eyebrow">{rooms.label}</h2>
        <div className="flex h-full w-[1084px] flex-col">
          <RoomsRow rooms={rooms.items} />
        </div>
      </section>

      <section className="flex h-[1024px] flex-col gap-[53px] px-margin pt-[148px] pb-[290px]">
        <h2 className="t-h6">{about.team.label}</h2>
        <div className="flex flex-col gap-2">
          {about.team.rows.map((row, r) => (
            <div key={r} className="flex gap-2">
              {row.map((c) => (
                <TeamCard key={c.slug} {...c} name={nameOf(c.slug)} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <Chrome />
    </main>
  );
}
