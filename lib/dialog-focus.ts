"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard focus for a full-screen layer (Mixers wedge, players, party): while `open`, focus moves into the
 * layer, Tab cycles inside it, and on close focus returns to what opened it. The layer element takes
 * tabIndex={-1} so it can hold focus itself.
 */
export function useDialogFocus(open: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    // The layer mounts with `open` (AnimatePresence): wait a frame for it.
    const raf = requestAnimationFrame(() => ref.current?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      const layer = ref.current;
      if (e.key !== "Tab" || !layer) return;
      const items = Array.from(layer.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length);
      if (!items.length) return e.preventDefault();
      const first = items[0];
      const last = items[items.length - 1];
      const inside = layer.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first || document.activeElement === layer)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, [open, ref]);
}
