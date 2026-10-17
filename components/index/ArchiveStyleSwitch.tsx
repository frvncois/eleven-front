import Link from "next/link";

/**
 * Switch between the two Archive options (Amélie, Oct 17): the fisheye ball (/archive) and the
 * vanishing-point bend (/archive/vanish). A grey chip like every button; it names the version you
 * will switch to. Sits with the view toggle, bottom right.
 */
export function ArchiveStyleSwitch({ current }: { current: "ball" | "vanish" }) {
  const to = current === "ball" ? { href: "/archive/vanish", label: "Vanishing point" } : { href: "/archive", label: "Fisheye" };
  return (
    <Link href={to.href} className="t-accent block bg-neutral-200 px-2 py-1 whitespace-nowrap transition-opacity duration-200 ease-out hover:opacity-50">
      {to.label}
    </Link>
  );
}
