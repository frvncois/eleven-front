"use client";

import type { Project } from "@/lib/content";

/**
 * Card/Project (Figma 7356:3387). Default: thumbnail, then title / client below in Body.
 * Hover: the image takes the full card and the meta sits over its bottom edge in white
 * (smart animate 0.3 ease-out in the prototype). Click opens the player.
 */
export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (p: Project) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      data-cursor="play"
      className="group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col text-left"
    >
      <span className="relative block w-full flex-1 overflow-hidden pb-[30px] transition-[padding] duration-300 ease-out group-hover:pb-0">
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
      <span className="t-body absolute inset-x-0 bottom-0 flex justify-between px-2 whitespace-nowrap text-neutral-1000 transition-colors duration-300 ease-out group-hover:text-neutral-0">
        <span>{project.short ?? project.title}</span>
        <span>{project.client}</span>
      </span>
    </button>
  );
}
