import type { Metadata } from "next";
import index from "@/data/index.json";
import projects from "@/data/projects.json";
import type { Project } from "@/lib/content";
import { TiltView } from "@/components/archive-lab/TiltView";

export const metadata: Metadata = { title: "Archive" };

/** Archive · Tilt: the whole Archive as a readable grid, laid back like the wordmark. */
export default function Page() {
  const films = index.tiles
    .map((t) => {
      const p = projects.find((x) => x.slug === t.slug);
      return p ? ({ ...p, short: t.title, client: t.client } as Project) : null;
    })
    .filter((p): p is Project => p !== null);
  return <TiltView films={films} />;
}
