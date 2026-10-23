import Link from "next/link";

/** Button/Chip: grey chip, Label/Accent, 4/8 padding, radius 0, hover 50 % (0.2 s ease-out). */
export function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="t-accent inline-block bg-neutral-100 px-2 py-1 transition-opacity duration-200 ease-out hover:opacity-50">
      {children}
    </Link>
  );
}
