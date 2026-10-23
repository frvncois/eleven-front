"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Link/Mini: 11 px uppercase, hover 50 % (0.2 s ease-out). External links open in a new tab.
 * On the page it points to, a small dot in the page accent follows the label (Legal in the
 * footer gets a lime dot on /legal); the label itself stays where it is.
 */
export function MiniLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const current = usePathname() === href;
  const external = /^https?:/.test(href);
  const cls = `t-mini block transition-opacity duration-200 ease-out hover:opacity-50 ${className}`;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} aria-current={current ? "page" : undefined} className={cls}>
      {children}
      {current && <span aria-hidden className="ml-1 inline-block size-[6px] rounded-full bg-(--accent) align-[0.1em]" />}
    </Link>
  );
}
