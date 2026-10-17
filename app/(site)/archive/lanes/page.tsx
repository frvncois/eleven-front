import type { Metadata } from "next";
import { ArchiveLab } from "@/components/archive-lab/ArchiveLab";
import { lanesSample } from "@/components/archive-lab/sample";

export const metadata: Metadata = { title: "Archive" };

/** Archive prototype · Lanes (one lane per mixer into the vanishing point). Reached from the Archive chips. */
export default function Page() {
  const { films, lanes } = lanesSample();
  return <ArchiveLab films={films} view={{ kind: "lanes", lanes }} />;
}
