"use client";

import about from "@/data/about.json";
import { sound } from "@/lib/sound";

// Each sound word's file (data/about.json services.sounds, keyed by the word as written). Empty until Eleven's
// takes arrive: the words are already underlined and hover-ready, they just stay silent.
const SOUNDS: Record<string, string[]> = about.services.sounds;

/**
 * A service description where the sound words, written `[[…]]` in data/about.json ("boom", "splash", "meh"),
 * carry a dotted underline and play their own sound on hover (desktop) or tap (phone).
 */
export function ServiceText({ text }: { text: string }) {
  return text.split(/\[\[(.+?)\]\]/).map((part, i) =>
    i % 2 ? (
      <span
        key={i}
        className="cursor-pointer underline decoration-dotted decoration-[0.06em] underline-offset-[0.12em]"
        onPointerEnter={(e) => e.pointerType === "mouse" && sound.play(SOUNDS[part] ?? [], `service-${part}`)}
        onClick={() => sound.play(SOUNDS[part] ?? [], `service-${part}`)}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}
