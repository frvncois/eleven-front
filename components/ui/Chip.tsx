import Link from "next/link";

/** Button/Chip: grey chip, Label/Accent, 4/8 padding, radius 0. Hover = one grey step darker, no motion (the chip rule in globals.css). */
export function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="t-accent inline-block bg-neutral-100 px-2 py-1 transition-colors duration-150 ease-out hover:bg-neutral-200">
      {children}
    </Link>
  );
}
