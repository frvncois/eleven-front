"use client";

import { useSyncExternalStore } from "react";

/**
 * Party mode on/off (the butterfly toggle), shared by the toggle and the party layer.
 * `plays` counts how many times it has been switched on this visit (V2 picks the next film from it).
 */
const listeners = new Set<() => void>();
let on = false;
let plays = -1;
let pick = -1; // V2: which item shows, random but never the same twice in a row
let size = 1;
const KEY = "eleven-party-plays";

export const party = {
  get on() {
    return on;
  },
  get plays() {
    return plays;
  },
  /** V2 registers how many items it can show, so each switch-on picks a new random one. */
  setSize(n: number) {
    size = Math.max(1, n);
  },
  set(v: boolean) {
    if (v && !on) {
      try {
        plays = Number(sessionStorage.getItem(KEY) ?? -1) + 1;
        sessionStorage.setItem(KEY, String(plays));
      } catch {
        plays += 1;
      }
      let next = Math.floor(Math.random() * size);
      if (size > 1 && next === pick) next = (next + 1 + Math.floor(Math.random() * (size - 1))) % size;
      pick = next;
    }
    on = v;
    listeners.forEach((l) => l());
  },
  toggle() {
    party.set(!on);
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function useParty() {
  return useSyncExternalStore(subscribe, () => on, () => false);
}

export function usePartyPlays() {
  return useSyncExternalStore(subscribe, () => plays, () => -1);
}

export function usePartyPick() {
  return useSyncExternalStore(subscribe, () => pick, () => -1);
}
