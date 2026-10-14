"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Project } from "@/lib/content";
import { sound } from "@/lib/sound";
import { EASE_DISSOLVE } from "@/lib/motion";

/** Vimeo share link (vimeo.com/<id>/<hash>) → player URL. */
function embedUrl(vimeo: string) {
  const m = vimeo.match(/vimeo\.com\/(\d+)(?:\/(\w+))?/);
  if (!m) return vimeo;
  const q = new URLSearchParams({ autoplay: "1", title: "0", byline: "0", portrait: "0", dnt: "1" });
  if (m[2]) q.set("h", m[2]);
  return `https://player.vimeo.com/video/${m[1]}?${q}`;
}

/**
 * First pass of V1 · 06 · Project player (7345:1485): an overlay, not a page, so the mixer page
 * stays behind and closing is instant. Black stage, the film, close top-left, title / client.
 * The custom controls and credits panel (Player/Stage, Player/Info Panel) come next.
 */
export function Player({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return;
    sound.duck();
    window.__lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      sound.unduck();
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${project.client}, ${project.short ?? project.title}`}
          className="fixed inset-0 z-[70] bg-neutral-1000"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_DISSOLVE }}
        >
          <iframe
            src={embedUrl(project.vimeo)}
            title={project.title}
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute inset-x-0 top-[80px] bottom-[80px] h-[calc(100%-160px)] w-full"
          />
          <button
            type="button"
            onClick={onClose}
            className="t-accent absolute top-6 left-6 bg-neutral-100 px-2 py-1 text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
          >
            Close
          </button>
          <div className="t-body absolute inset-x-6 bottom-7 flex justify-between text-neutral-0">
            <span>{project.short ?? project.title}</span>
            <span>{project.client}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
