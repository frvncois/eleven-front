"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { VERSIONS, stripVersion } from "@/lib/versions";

/**
 * Review tool, not part of the design (remove before launch): a small pill bottom-centre on every
 * versioned page. V1 / V2 switch to the same page in the other version; "All versions" goes back
 * to the chooser. The V key does the same.
 */
export function VersionPill() {
  const pathname = usePathname();
  const router = useRouter();
  const current = VERSIONS.find((v) => pathname === `/${v}` || pathname.startsWith(`/${v}/`));
  const rest = stripVersion(pathname);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "v" || e.key === "V") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, router]);

  if (!current) return null;
  const chip = "t-accent px-2 py-1 transition-opacity duration-200 ease-out hover:opacity-50";
  return (
    <nav aria-label="Prototype versions" className="fixed bottom-4 left-1/2 z-[55] flex -translate-x-1/2 items-center gap-px">
      {VERSIONS.map((v) =>
        v === current ? (
          <span key={v} aria-current="page" className={`${chip} bg-neutral-1000 text-neutral-0 hover:opacity-100`}>
            {v.toUpperCase()}
          </span>
        ) : (
          <Link key={v} href={`/${v}${rest === "/" ? "" : rest}`} className={`${chip} bg-neutral-200 text-neutral-1000`}>
            {v.toUpperCase()}
          </Link>
        ),
      )}
      <Link href="/" className={`${chip} bg-neutral-200 text-neutral-1000`}>
        All versions
      </Link>
    </nav>
  );
}
