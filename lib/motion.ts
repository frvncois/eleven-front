/** Motion tokens, from the Mockup V1 prototype and the Framer spikes. Every animation reads these. */
export const EASE_OUT = [0, 0, 0.58, 1] as const; // Figma "ease out": hovers, chips
export const EASE_SWEEP = "cubic-bezier(0.62,0.05,0.01,0.99)"; // page sweep bands
export const EASE_DISSOLVE = [0.4, 0, 0.2, 1] as const; // fades, overlays

export const DUR = {
  chip: 0.2, // Button/Chip, Link/Mini hover
  link: 0.3, // Nav/Link hover
  overlay: 0.6, // Mixers overlay dissolve
  band: 650, // ms per sweep band
  stagger: 70, // ms between bands
} as const;

/** Destination colour of the page sweep, by path. Longest prefix wins. */
export const SWEEP_COLORS: Record<string, string> = {
  "/": "#0f0d0d",
  "/mixers": "#032daf",
  "/longform": "#1a8240",
  "/index": "#ed2024",
  "/about": "#ff7fe7",
  "/contact": "#00a7d9",
  "/terms": "#0f0d0d",
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
