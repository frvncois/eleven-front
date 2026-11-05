"use client";

import about from "@/data/about.json";
import { sound } from "@/lib/sound";

// Each sound word's file (data/about.json services.sounds, keyed by the word as written): Eleven's own takes
// (Nov 2, public/sounds/eleven/service-*.m4a), one per word.
const SOUNDS: Record<string, string[]> = about.services.sounds;

// A word can't restart while its sound is still playing (Amélie, 2026-11-03): hover again once it has ended.
const playing = new Set<string>();
function playWord(word: string) {
  if (playing.has(word)) return;
  playing.add(word);
  sound.play(SOUNDS[word] ?? [], `service-${word}`).finally(() => playing.delete(word));
}

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
        onPointerEnter={(e) => e.pointerType === "mouse" && playWord(part)}
        onClick={() => playWord(part)}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}
