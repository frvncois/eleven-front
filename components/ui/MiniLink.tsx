"use client";

import Link from "next/link";
import { useVHref } from "@/lib/version";

/** Link/Mini: 11 px uppercase, hover 50 % (0.2 s ease-out). External links open in a new tab. */
export function MiniLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const vhref = useVHref();
  const external = /^https?:/.test(href);
  const cls = `t-mini block transition-opacity duration-200 ease-out hover:opacity-50 ${className}`;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={vhref(href)} className={cls}>
      {children}
    </Link>
  );
}
