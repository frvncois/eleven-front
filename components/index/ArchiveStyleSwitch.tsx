import Link from "next/link";

/** The Archive versions, in the order of the chips. */
export const ARCHIVE_STYLES = [
  { key: "ball", href: "/archive", label: "Fisheye" },
  { key: "vanish", href: "/archive/vanish", label: "Vanish" },
  { key: "lanes", href: "/archive/lanes", label: "Lanes" },
  { key: "corridor", href: "/archive/corridor", label: "Corridor" },
  { key: "floor", href: "/archive/floor", label: "Floor" },
  { key: "fly", href: "/archive/fly", label: "Fly" },
] as const;

export type ArchiveStyle = (typeof ARCHIVE_STYLES)[number]["key"];

/**
 * Switch between the Archive versions (Amélie, Oct 17): one grey chip per version next to the view
 * toggle, the current one in the selected grey (neutral 300), as on every toggle of the site.
 * Lanes, Corridor, Floor and Fly are prototypes of the vanishing point on a sample of projects.
 */
export function ArchiveStyleSwitch({ current }: { current: ArchiveStyle }) {
  return (
    <div className="flex gap-1">
      {ARCHIVE_STYLES.map((s) =>
        s.key === current ? (
          <span key={s.key} aria-current="page" className="t-accent block bg-neutral-300 px-2 py-1 whitespace-nowrap">
            {s.label}
          </span>
        ) : (
          <Link key={s.key} href={s.href} className="t-accent block bg-neutral-200 px-2 py-1 whitespace-nowrap transition-opacity duration-200 ease-out hover:opacity-50">
            {s.label}
          </Link>
        ),
      )}
    </div>
  );
}
