/**
 * A story note's number as two digits ("01", "02"…): Neue Haas bold 10, black, centred in a 16 px pink square.
 * The same mark in the text (raised like a footnote) and beside the side note, so the pair reads.
 */
export function NoteNumber({ n, className = "" }: { n: string; className?: string }) {
  return (
    <span
      className={`inline-flex size-4 items-center justify-center bg-pink indent-0 font-sans text-[10px] leading-none font-bold not-italic text-neutral-1000 ${className}`}
    >
      {n}
    </span>
  );
}

/** Story text with its note markers, written `{01}` in data/about.json, raised like footnote marks (indent-0 above: the paragraph's first-line indent would shift them). */
export function StoryText({ text }: { text: string }) {
  return text.split(/\{(\d+)\}/).map((part, i) =>
    i % 2 ? <NoteNumber key={i} n={part} className="mx-[0.15em] align-super" /> : part,
  );
}
