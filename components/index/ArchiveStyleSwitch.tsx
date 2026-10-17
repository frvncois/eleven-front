import Link from "next/link";

/** The Archive versions, in the order of the chips. */
export const ARCHIVE_STYLES = [
  { key: "ball", href: "/archive", label: "Fisheye" },
  { key: "vanish", href: "/archive/vanish", label: "Vanish" },
  // Dropped for the eclectic grid (Amélie, Oct 17): out of the chips, page kept.
  { key: "tilt", href: "/archive/tilt", label: "Tilt", hidden: true },
  // Too much (Amélie, Oct 17: the projects don't read): out of the chips, pages kept.
  { key: "lanes", href: "/archive/lanes", label: "Lanes", hidden: true },
  { key: "corridor", href: "/archive/corridor", label: "Corridor", hidden: true },
  { key: "floor", href: "/archive/floor", label: "Floor", hidden: true },
  { key: "fly", href: "/archive/fly", label: "Fly", hidden: true },
] as const;

export type ArchiveStyle = (typeof ARCHIVE_STYLES)[number]["key"];

/**
 * Switch between the Archive versions (Amélie, Oct 17): one grey chip per version next to the view
 * toggle, the current one in the selected grey (neutral 300), as on every toggle of the site.
 * Tilt, Lanes, Corridor, Floor and Fly were dropped: they only show on their own page.
 */
export function ArchiveStyleSwitch({ current }: { current: ArchiveStyle }) {
  return (
    <div className="flex gap-1">
      {ARCHIVE_STYLES.filter((s) => s.key === current || !("hidden" in s)).map((s) =>
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
