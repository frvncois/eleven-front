"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import site from "@/data/site.json";

/**
 * Nav/Bar (Figma 7356:3252): five links spread edge to edge, Heading/H4.
 * Hover = 50 % (0.3 s ease-out); the current page keeps the hover state (annotation).
 * `tone="light"` (neutral/300) where it sits on video: home, player.
 */
export function NavBar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between p-margin ${tone === "light" ? "text-neutral-300" : "text-neutral-1000"}`}
    >
      {site.nav.map((item) => {
        const current = pathname === item.match || pathname.startsWith(item.match + "/");
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`t-h4 transition-opacity duration-300 ease-out hover:opacity-50 ${current ? "opacity-50" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
