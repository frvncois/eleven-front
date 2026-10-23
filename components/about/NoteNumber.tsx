const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * A story note's number as a Roman numeral in Junicode (review note 11, Oct 23). In the text: pink, raised like a
 * footnote mark. Beside the side note (`boxed`): black in a small pink square (review note 23), so the pair still reads.
 */
export function NoteNumber({ n, boxed = false, className = "" }: { n: string; boxed?: boolean; className?: string }) {
  const numeral = ROMAN[parseInt(n, 10)] ?? n;
  if (boxed)
    return (
      <span className={`inline-flex h-4 min-w-4 items-center justify-center bg-pink px-1 indent-0 font-serif text-[12px] leading-none not-italic text-neutral-1000 ${className}`}>
        {numeral}
      </span>
    );
  return <span className={`indent-0 font-serif leading-none not-italic text-pink ${className}`}>{numeral}</span>;
}

/** Story text with its note markers, written `{01}` in data/about.json, raised like footnote marks (indent-0 above: the paragraph's first-line indent would shift them). */
export function StoryText({ text }: { text: string }) {
  return text.split(/\{(\d+)\}/).map((part, i) =>
    i % 2 ? <NoteNumber key={i} n={part} className="mx-[0.1em] align-super text-[0.45em]" /> : part,
  );
}
