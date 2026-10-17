import type { Metadata } from "next";
import { ArchiveLab } from "@/components/archive-lab/ArchiveLab";
import { sample } from "@/components/archive-lab/sample";

export const metadata: Metadata = { title: "Archive" };

/** Archive prototype · Floor (vanishing point, sample of projects). Reached from the Archive chips. */
export default function Page() {
  const { films, spots } = sample();
  return <ArchiveLab films={films} view={{ kind: "floor", spots }} />;
}
