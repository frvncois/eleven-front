const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * A story note's number as a Roman numeral: Neue Haas bold 8, black, centred in a small pink square.
 * The same mark in the text (raised like a footnote) and beside the side note, so the pair reads.
 */
export function NoteNumber({ n, className = "" }: { n: string; className?: string }) {
  const numeral = ROMAN[parseInt(n, 10)] ?? n;
  return (
    <span
      className={`inline-flex h-3 min-w-3 items-center justify-center bg-pink px-[2px] indent-0 font-sans text-[8px] leading-none font-bold not-italic text-neutral-1000 ${className}`}
    >
      {numeral}
    </span>
  );
}

/** Story text with its note markers, written `{01}` in data/about.json, raised like footnote marks (indent-0 above: the paragraph's first-line indent would shift them). */
export function StoryText({ text }: { text: string }) {
  return text.split(/\{(\d+)\}/).map((part, i) =>
    i % 2 ? <NoteNumber key={i} n={part} className="mx-[0.15em] align-super" /> : part,
  );
}
