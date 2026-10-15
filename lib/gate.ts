"use client";

/**
 * The sound gate, one per version per visit (V1 aqua, V2 red), so both can be seen when comparing.
 * The ELEVEN / floss logo reopens it (Amélie, 15 Oct): going "home" by the logo always asks for
 * sound again, like arriving on the site. Nav links never do. Logo links carry `data-gate`;
 * PageTransition (which intercepts every link click) reopens the gate for them.
 */
const key = (v: string) => `eleven-gate-${v}`;
const EVENT = "eleven-gate";

export function gateSeen(v: string) {
  try {
    return sessionStorage.getItem(key(v)) === "1";
  } catch {
    return false;
  }
}

export function setGateSeen(v: string, seen: boolean) {
  try {
    if (seen) sessionStorage.setItem(key(v), "1");
    else sessionStorage.removeItem(key(v));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeGate(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
