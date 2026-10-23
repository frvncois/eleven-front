import type { Metadata } from "next";
import index from "@/data/index.json";
import projects from "@/data/projects.json";
import { IndexView, type Tile } from "@/components/index/IndexView";

export const metadata: Metadata = { title: "Archive" };

/** Archive (Figma V1 · 08 · Index, renamed by Amélie 2026-10-15). */
export default function ArchivePage() {
  const tiles = index.tiles
    .map((t) => {
      const p = projects.find((x) => x.slug === t.slug);
      return p ? ({ ...p, short: t.title, label: t.title, client: t.client, x: t.x, y: t.y, w: t.w, h: t.h } as Tile) : null;
    })
    .filter((t): t is Tile => t !== null);
  return <IndexView tiles={tiles} field={index.field} />;
}
