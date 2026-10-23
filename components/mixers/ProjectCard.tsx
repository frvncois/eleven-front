"use client";

import type { Project } from "@/lib/content";

/**
 * Card/Project (Figma 7356:3387), the mixer page's grid view. Default: thumbnail, then the caption 8 below it in the
 * same style as the List view (the Warp carousel): client chip over title chip (Amélie, Oct 23; was title / client
 * on one Body line). Hover: the image takes the full card and the chips sit over its bottom edge (0.3 s ease-out).
 * Click opens the player.
 */
export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (p: Project) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      data-cursor="play"
      className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col text-left"
    >
      <span className="relative block w-full flex-1 overflow-hidden pb-[46px] transition-[padding] duration-300 ease-out group-hover:pb-0">
        <span className="relative block size-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.poster ?? ""}
            alt={`${project.client}, ${project.short ?? project.title}`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        </span>
      </span>
      {/* The caption pair, 38 tall: 8 + 38 = the 46 the image leaves free at rest. */}
      <span className="absolute bottom-0 left-0 flex flex-col items-start whitespace-nowrap">
        <span className="chip-client">{project.client}</span>
        <span className="chip-title">{project.short ?? project.title}</span>
      </span>
    </button>
  );
}
