import type { Metadata } from "next";
import index from "@/data/index.json";
import projects from "@/data/projects.json";
import { toGridTile } from "@/lib/grid";
import { IndexView, type Tile } from "@/components/index/IndexView";
import { ArchiveMobile } from "@/components/mobile/ArchiveMobile";
import { ByDevice } from "@/components/mobile/ByDevice";

export const metadata: Metadata = { title: "Archive" };

/** Archive: every project in one place. Phone: ArchiveMobile. */
export default function ArchivePage() {
  const tiles = index.tiles
    .map((t) => {
      const p = projects.find((x) => x.slug === t.slug);
      // 9-col grid: thumbnails 2 / 3 / 4 columns wide (lib/grid).
      return p ? (toGridTile({ ...p, short: t.title, label: t.title, client: t.client, x: t.x, y: t.y, w: t.w, h: t.h }) as Tile) : null;
    })
    .filter((t): t is Tile => t !== null);
  return <ByDevice desktop={<IndexView tiles={tiles} field={index.field} />} phone={<ArchiveMobile tiles={tiles} field={index.field} />} />;
}
