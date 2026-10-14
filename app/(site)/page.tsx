import Link from "next/link";

/** Temporary index until the gate + home land (Day 2). */
const SCREENS = [
  ["Gate + Home", "/"],
  ["Mixer page", "/mixers/jordan-meltzer"],
  ["Longform", "/longform"],
  ["Index", "/index"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Terms & Policy", "/terms"],
];

export default function Home() {
  return (
    <main className="stage p-margin">
      <p className="t-eyebrow">Eleven · website prototype · in progress</p>
      <ul className="mt-40 space-y-2">
        {SCREENS.map(([label, href]) => (
          <li key={href} className="t-h2">
            <Link href={href} className="transition-opacity duration-200 hover:opacity-50">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
