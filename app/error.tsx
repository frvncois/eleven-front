"use client";

import { Chrome } from "@/components/shell/Chrome";
import { Chip } from "@/components/ui/Chip";

/** Runtime error on a page: the 404's layout, with a retry next to the way home. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative flex h-[max(var(--vh),1024px)] flex-col items-center justify-center gap-5 bg-neutral-0 text-center">
      <h1 className="t-display-big">Oops</h1>
      <p className="t-body-lg">Something on this page went wrong.</p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reset} className="t-accent inline-block cursor-pointer bg-neutral-100 px-2 py-1 transition-opacity duration-200 ease-out hover:opacity-50">
          Try again
        </button>
        <Chip href="/">Back to the homepage</Chip>
      </div>
      <Chrome />
    </main>
  );
}
