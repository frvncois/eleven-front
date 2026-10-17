"use client";

/**
 * The sound gate, once per visit. The ELEVEN wordmark reopens it (Amélie, 15 Oct): going "home" by it
 * asks for sound again, like arriving on the site; nav links do not.
 * The wordmark carries `data-gate`; PageTransition (which intercepts every link click) reopens it.
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
