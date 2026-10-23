/**
 * One scrolling feel for the phone lists that step through projects (the Archive stack and Longform). While the finger is down the list
 * follows it; on release it projects the throw, lands on the nearest project and eases into it, so one project always
 * sits square. A short or gentle swipe moves exactly one; a hard flick may skip more, never more than MAX_SKIP.
 */
export const STEPPER = {
  /** frames of travel a release speed is projected over (px per frame × this = px of throw) */
  project: 12,
  /** fewest px per frame that still counts as a flick (moves one even if the drag was short) */
  flick: 2.5,
  /** most projects one flick can move */
  maxSkip: 3,
  /** share of the remaining distance covered each frame while landing (~0.35 s to settle) */
  ease: 0.16,
};

/**
 * Where a released drag lands, in items. `start`: the item when the finger went down; `pos`: the current position in
 * items (fractional); `v`: release speed in px per frame, positive towards higher items; `pitch`: px per item;
 * `project`: frames of throw (Longform's items are a whole screen tall, so it projects further to feel the same).
 */
export function landing(start: number, pos: number, v: number, pitch: number, project = STEPPER.project) {
  let target = Math.round(pos + (v * project) / pitch);
  if (target === start && Math.abs(v) >= STEPPER.flick) target = start + Math.sign(v);
  return Math.max(start - STEPPER.maxSkip, Math.min(start + STEPPER.maxSkip, target));
}
