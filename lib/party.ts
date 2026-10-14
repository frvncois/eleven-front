"use client";

import { useSyncExternalStore } from "react";

/** Party mode on/off (the butterfly toggle), shared by the toggle and the party layer. */
const listeners = new Set<() => void>();
let on = false;

export const party = {
  get on() {
    return on;
  },
  set(v: boolean) {
    on = v;
    listeners.forEach((l) => l());
  },
  toggle() {
    party.set(!on);
  },
};

export function useParty() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    () => on,
    () => false,
  );
}
