"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

/**
 * What the phone dock shows besides the floss, MENU and SOUND: the page's own control top right
 * (GRID / LIST on Mixer and Archive, set in a chip; the butterfly on Contact, `bare`, it is a chip
 * already), and whether a full-screen layer (the player) has taken the screen. Pages write it,
 * PhoneShell reads it.
 */
type State = { toggle: ReactNode; bare: boolean; covered: boolean };
let state: State = { toggle: null, bare: false, covered: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const SERVER: State = { toggle: null, bare: false, covered: false };
export const useDock = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

/** Put a control top right of the dock while the calling page is mounted (`bare`: no chip around it). */
export function useDockToggle(node: ReactNode, bare = false) {
  useEffect(() => {
    set({ toggle: node, bare });
  });
  useEffect(() => () => set({ toggle: null, bare: false }), []);
}

/** Hide the dock while a full-screen layer (the player) is open. */
export function useDockCovered(covered: boolean) {
  useEffect(() => {
    set({ covered });
    return () => set({ covered: false });
  }, [covered]);
}
