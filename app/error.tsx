"use client";

import { Chrome } from "@/components/shell/Chrome";
import { Chip } from "@/components/ui/Chip";
import ui from "@/data/ui.json";

/** Runtime error on a page: the 404's layout, with a retry next to the way home. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative flex h-[max(var(--vh),1024px)] flex-col items-center justify-center gap-5 bg-neutral-0 text-center">
      <h1 className="t-display-big">{ui.errorPage.title}</h1>
      <p className="t-body-lg">{ui.errorPage.body}</p>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reset} className="t-accent inline-block cursor-pointer bg-neutral-100 px-2 py-1 transition-colors duration-150 ease-out hover:bg-neutral-200">
          {ui.errorPage.retry}
        </button>
        <Chip href="/">{ui.errorPage.cta}</Chip>
      </div>
      <Chrome />
    </main>
  );
}
