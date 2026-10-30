"use client";

import { useState } from "react";

type Photo = { src: string; alt: string; width: number; height: number };

/**
 * A side note's text where one phrase, written `[[…]]` in data/about.json, shows a real photo: on hover (desktop)
 * or tap (phone) the picture rises just above the note (0.3 s, 8 px), so the gag reads as a real place.
 * The phrase carries a dotted underline so it reads as something to touch.
 */
export function NoteText({ text, photo }: { text: string; photo?: Photo }) {
  const [open, setOpen] = useState(false);
  if (!photo) return text;
  return (
    // The photo hangs off the note's own box (not the phrase, which can wrap), so it stays on screen on the phone.
    <span className="relative block">
      {text.split(/\[\[(.+?)\]\]/).map((part, i) =>
        i % 2 ? (
          <span
            key={i}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            className="cursor-pointer underline decoration-dotted underline-offset-[1px]"
            onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              setOpen((v) => !v);
            }}
            onBlur={() => setOpen(false)}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        className={`pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-20 h-auto w-[320px] max-w-none transition-[opacity,translate] duration-300 ease-out phone:w-[240px] ${open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      />
    </span>
  );
}
