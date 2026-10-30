"use client";

/**
 * The sound gate, once per visit (session). The floss logo goes straight to the home; on the home
 * itself, clicking the floss reopens the gate (desktop and phone).
 */
const KEY = "eleven-gate";
const EVENT = "eleven-gate";

export function gateSeen() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setGateSeen(seen: boolean) {
  try {
    if (seen) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeGate(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
