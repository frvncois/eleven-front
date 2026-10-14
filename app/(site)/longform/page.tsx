import type { Metadata } from "next";
import longform from "@/data/longform.json";
import projects from "@/data/projects.json";
import { LongformReel, type Film } from "@/components/longform/LongformReel";

export const metadata: Metadata = { title: "Longform" };

export default function LongformPage() {
  const films = longform.films
    .map((f) => {
      const p = projects.find((x) => x.slug === f.slug);
      return p ? ({ ...p, short: f.label, label: f.label, color: f.color } as Film) : null;
    })
    .filter((f): f is Film => f !== null);
  return <LongformReel films={films} />;
}
