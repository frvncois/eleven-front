"use client";

import { useSyncExternalStore } from "react";

/**
 * Party mode on/off (the butterfly toggle), shared by the toggle and the party layer.
 */
const listeners = new Set<() => void>();
let on = false;
let pick = -1; // which item shows, random but never the same twice in a row
let size = 1;
// Where the butterfly that opened the party sits (viewport px), so the party keeps one in the same spot.
let origin: { x: number; y: number; w: number; h: number } | null = null;

export const party = {
  get on() {
    return on;
  },
  get origin() {
    return origin;
  },
  /** The butterfly that was pressed: the party opens from it and keeps a butterfly right there. */
  setOrigin(r: { x: number; y: number; w: number; h: number }) {
    origin = r;
  },
  /** The party layer registers how many items it can show, so each switch-on picks a new random one. */
  setSize(n: number) {
    size = Math.max(1, n);
  },
  set(v: boolean) {
    if (v && !on) {
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

export function usePartyPick() {
  return useSyncExternalStore(subscribe, () => pick, () => -1);
}
