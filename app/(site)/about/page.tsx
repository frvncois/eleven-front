import type { Metadata } from "next";
import about from "@/data/about.json";
import team from "@/data/team.json";
import { Chrome } from "@/components/shell/Chrome";
import { TeamCard } from "@/components/about/TeamCard";
import { RoomTuner } from "@/components/about/RoomTuner";
import { StorySticker } from "@/components/about/StorySticker";

export const metadata: Metadata = { title: "About" };

const nameOf = (slug: string) => team.find((p) => p.slug === slug)?.name ?? slug;

/** V1 · 09 · About (Figma 7345:1607): story with sticky sticker, snow globe, services, rooms, team. */
export default function AboutPage() {
  const { story, services, rooms } = about;
  return (
    <main className="bg-bg">

      {/* Story. The sticker starts just above the first paragraph (x 264, the second paragraph's edge), 134 × 81.
          Revision (V2 · 09 · About, section-story): less padding on top, 604 → 300; sticker slot and end move with it, and it holds at 19 % (its new resting height, 195 / 1024). */}
      <section className="relative flex flex-col items-end px-[22px] pt-[300px]">
        <StorySticker src={story.sticker.src} width={134} height={81} top={195} left={264} end={1256} hold="19%" />
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

      {/* Revision (Figma V2 · 09 · About, section-services): name in H2 sitting on a black rule, a
          one-line description small and right-aligned at the top of the row. */}
      <section className="flex items-start justify-between pt-[120px] pb-[120px] pl-margin">
        <h2 className="t-eyebrow">{services.label}</h2>
        <ul className="flex w-[806px] flex-col gap-2">
          {services.items.map(([name, note]) => (
            <li key={name} className="flex items-start justify-between border-b border-neutral-1000 pr-margin">
              <span className="t-h2 whitespace-nowrap [text-box:trim-both_cap_alphabetic]">{name}</span>
              <span className="w-[336px] text-right font-sans text-[12px] leading-[1.4] font-medium">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <RoomTuner label={rooms.label} hint={rooms.hint} items={rooms.items} />

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
