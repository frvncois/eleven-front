import type { Metadata } from "next";
import longform from "@/data/longform.json";
import projects from "@/data/projects.json";
import { LongformReel, type Film } from "@/components/longform/LongformReel";
import { LongformMobile } from "@/components/mobile/LongformMobile";
import { ByDevice } from "@/components/mobile/ByDevice";

export const metadata: Metadata = { title: "Longform" };

export default function LongformPage() {
  const films = longform.films
    .map((f) => {
      const p = projects.find((x) => x.slug === f.slug);
      return p ? ({ ...p, short: f.label, label: f.label, color: f.color, position: "position" in f ? f.position : undefined } as Film) : null;
    })
    .filter((f): f is Film => f !== null);
  return <ByDevice desktop={<LongformReel films={films} />} phone={<LongformMobile films={films} />} />;
}
