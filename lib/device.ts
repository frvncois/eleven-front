"use client";

import { useSyncExternalStore } from "react";

/**
 * Phone or desktop (mobile plan, Oct 19): a phone is a window under 1024 px or a touch-only pointer.
 * The phone gets the 390-unit stage (Figma "V2 · MOBILE (390) · phone mocks", 7696:1980) and the
 * pages render their `*Mobile` layouts. Decided before paint in app/layout.tsx (html.phone) and kept
 * in step on resize by components/shell/StageScale, which fires EVENT when it flips.
 */
export const PHONE_W = 390;
export const DESKTOP_W = 1440;
const EVENT = "eleven-device";

export function detectPhone() {
  const coarse = window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches;
  return window.innerWidth < 1024 || coarse;
}

/** The stage zoom (--app-scale, set in app/layout.tsx and components/shell/StageScale): screen px per design px. */
export const appScale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;

export const isPhone = () => typeof document !== "undefined" && document.documentElement.classList.contains("phone");

export function setPhone(phone: boolean) {
  const root = document.documentElement;
  if (root.classList.contains("phone") === phone) return;
  root.classList.toggle("phone", phone);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/**
 * True on the phone stage. The server and the hydration render say desktop; on a phone the stage is
 * hidden until the phone layouts have replaced it (html.phone:not(.phone-ready) in globals.css).
 */
export function usePhone() {
  return useSyncExternalStore(subscribe, isPhone, () => false);
}
