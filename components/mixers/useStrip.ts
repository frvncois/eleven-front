"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Stage units per CSS px (the 1440 stage is zoomed to the window). */
const appScale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;

export type StripState = {
  /** Distance travelled, in stage px (or slots, for the stepped options). */
  offset: number;
  /** Last frame's movement, signed. */
  velocity: number;
  /** True while a pointer holds the strip. */
  dragging: boolean;
};

/**
 * Wheel, drag and an idle drift (off under reduced motion) for a horizontal strip, in one rAF loop.
 * `frame(state)` runs every frame and writes transforms straight to the DOM (no React renders).
 * Clicks are only passed through when the pointer did not travel (a drag is never a click).
 */
export function useStrip(
  ref: React.RefObject<HTMLElement | null>,
  frame: (s: StripState) => void,
  {
    drift = 0.6,
    friction = 0.93,
    wheel = 1,
    maxSpeed = Infinity,
    passVertical = false,
  }: {
    drift?: number;
    friction?: number;
    /** Wheel gain. At 1 the strip ends up travelling ~1.6× the scroll (impulse + glide). */
    wheel?: number;
    /** Top speed from the wheel or a fling, stage px per frame (a drag itself is never capped). */
    maxSpeed?: number;
    /**
     * On a page (mixer pages): the wheel is read anywhere on the page, not only over the strip, and
     * is never swallowed, so the page keeps its own scroll.
     */
    passVertical?: boolean;
  } = {},
) {
  const frameRef = useRef(frame);
  useLayoutEffect(() => {
    frameRef.current = frame;
  });
  const moved = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s: StripState = { offset: 0, velocity: 0, dragging: false };
    let push = 0;
    let lastInput = -1e9;
    let lastX = 0;
    let raf = 0;

    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (passVertical) {
        push += (horizontal ? e.deltaX : e.deltaY) * wheel;
        lastInput = performance.now();
        return;
      }
      e.preventDefault();
      push += (horizontal ? e.deltaX : e.deltaY) * wheel;
      lastInput = performance.now();
    };
    const onDown = (e: PointerEvent) => {
      s.dragging = true;
      moved.current = 0;
      lastX = e.clientX;
      lastInput = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = (e.clientX - lastX) / appScale();
      lastX = e.clientX;
      moved.current += Math.abs(dx);
      push -= dx;
      lastInput = performance.now();
    };
    const onUp = () => {
      s.dragging = false;
    };

    const still = prefersReducedMotion(); // reduced motion: no idle drift, the strip only moves when asked
    const tick = () => {
      const idle = !still && performance.now() - lastInput > 1600;
      // Drag moves the strip 1:1 and leaves a fling; the wheel gives impulses; friction lets it
      // glide out; after 1.6 s without input it eases back into a slow drift so it never sits dead.
      if (s.dragging) {
        s.velocity = push;
        s.offset += push;
      } else {
        s.velocity = (s.velocity + push * 0.12) * friction;
        s.velocity = Math.max(-maxSpeed, Math.min(maxSpeed, s.velocity));
        if (idle) s.velocity += (drift - s.velocity) * 0.03;
        s.offset += s.velocity;
      }
      push = 0;
      frameRef.current(s);
      raf = requestAnimationFrame(tick);
    };

    const wheelOn: HTMLElement | Window = passVertical ? window : el;
    wheelOn.addEventListener("wheel", onWheel as EventListener, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      wheelOn.removeEventListener("wheel", onWheel as EventListener);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [ref, drift, friction, wheel, maxSpeed, passVertical]);

  /** Wrap a click handler so it only fires for a real click, not the end of a drag. */
  return (fn: () => void) => () => {
    if (moved.current < 6) fn();
  };
}

/** Positive modulo. */
export const wrap = (n: number, m: number) => ((n % m) + m) % m;

