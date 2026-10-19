import type { Metadata } from "next";
import index from "@/data/index.json";
import projects from "@/data/projects.json";
import { toGridTile } from "@/lib/grid";
import type { Tile } from "@/components/index/IndexView";
import { VanishArchive } from "@/components/index/VanishArchive";

export const metadata: Metadata = { title: "Archive" };

/** Archive, option B: the mixer carousel's vanishing point instead of the ball. Not linked from the nav. */
export default function ArchiveVanishPage() {
  const tiles = index.tiles
    .map((t) => {
      const p = projects.find((x) => x.slug === t.slug);
      // 9-col grid: thumbnails 2 / 3 / 4 columns wide (lib/grid).
      return p ? (toGridTile({ ...p, short: t.title, label: t.title, client: t.client, x: t.x, y: t.y, w: t.w, h: t.h }) as Tile) : null;
    })
    .filter((t): t is Tile => t !== null);
  return <VanishArchive tiles={tiles} field={index.field} />;
}
