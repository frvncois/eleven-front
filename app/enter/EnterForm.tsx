"use client";

import { useActionState } from "react";
import { enter, type EnterState } from "./actions";
import { StageScale } from "@/components/shell/StageScale";

/** Password screen. Aqua like the gate it leads to; one field, one chip. */
export function EnterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<EnterState, FormData>(enter, { error: false });

  return (
    <main className="stage flex h-(--vh) flex-col justify-between bg-aqua p-margin text-ink">
      <StageScale />
      <p className="t-eyebrow">Website prototype · lab-a for Eleven</p>

      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="t-h2 w-[720px] border-b border-ink bg-transparent pb-2 placeholder:text-ink/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="t-eyebrow bg-neutral-100 px-2 py-1 transition-opacity duration-200 ease-out hover:opacity-50 disabled:opacity-50"
        >
          {pending ? "…" : "Enter"}
        </button>
        <p aria-live="polite" className="t-eyebrow ml-4">
          {state.error ? "Not quite. Try again." : ""}
        </p>
      </form>

      <p className="t-display-big leading-none">Eleven</p>
    </main>
  );
}
