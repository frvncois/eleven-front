"use client";

/**
 * The sound gate, one per version per visit (V1 aqua, V2 red), so both can be seen when comparing.
 * V1's ELEVEN wordmark reopens it (Amélie, 15 Oct): going "home" by it asks for sound again, like
 * arriving on the site. V2's floss logo does not (home with the choice kept), nor do nav links.
 * The wordmark carries `data-gate`; PageTransition (which intercepts every link click) reopens it.
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
