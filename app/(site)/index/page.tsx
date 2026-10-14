import type { Metadata } from "next";
import index from "@/data/index.json";
import projects from "@/data/projects.json";
import { IndexView, type Tile } from "@/components/index/IndexView";

export const metadata: Metadata = { title: "Index" };

export default function IndexPage() {
  const tiles = index.tiles
    .map((t) => {
      const p = projects.find((x) => x.slug === t.slug);
      return p ? ({ ...p, short: t.title, label: t.title, client: t.client, x: t.x, y: t.y, w: t.w, h: t.h } as Tile) : null;
    })
    .filter((t): t is Tile => t !== null);
  return <IndexView tiles={tiles} field={index.field} />;
}
