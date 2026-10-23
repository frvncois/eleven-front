/**
 * Review notes: a comment pinned to a spot on a page, written while previewing on the dev server
 * (components/dev/ReviewNotes, saved by app/api/review-notes to docs/review-notes.json).
 * Each note records enough to find the spot again in code: the route, the element (a CSS path, the React
 * components around it, its text) and where in that element the pin sits.
 */
export type ReviewNote = {
  id: number;
  route: string;
  text: string;
  /** open = to do, fixed = Claude changed it (see reply), closed = Amélie checked it. */
  status: "open" | "fixed" | "closed";
  reply?: string;
  device: "desktop" | "phone";
  viewport: { w: number; h: number };
  target: {
    selector: string;
    /** Nearest React components, innermost first (dev builds keep the names). */
    components: string[];
    tag: string;
    text: string;
    /** Pin position inside the element, 0..1 of its box. */
    fx: number;
    fy: number;
  };
  /** Fallback when the element is gone: page position (y includes the scroll). */
  page: { x: number; y: number };
  created: string;
  updated?: string;
};

// Framework wrappers (Next's router, boundaries, contexts): not where design lives.
const SKIP = /(Boundary|Context|Provider|Consumer|Router|Fallback|Template|Segment|Handler|Redirect|Root|Suspense|Fragment|Memo|ForwardRef)$|^(Segment|Inner|Outer|Head|Html|Body|ScrollAndFocus|RenderFromTemplate|HotReload|ReactDev|AppDev|Loading|NotFound|HTTPAccess)/;

/** A CSS path that survives re-renders: ids and data attributes when there are some, nth-of-type otherwise. */
export function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && parts.length < 12) {
    if (node.id) {
      parts.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const tag = node.tagName.toLowerCase();
    const data = [...node.attributes].find((a) => a.name.startsWith("data-") && !a.name.startsWith("data-review") && a.value.length < 40);
    let part = tag;
    if (data) part += data.value ? `[${data.name}="${CSS.escape(data.value)}"]` : `[${data.name}]`;
    const parent: Element | null = node.parentElement;
    if (parent) {
      const same = [...parent.children].filter((c) => c.tagName === node!.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return ["body", ...parts].join(" > ");
}

/** The React components around an element, read from the dev fiber tree (names only, innermost first). */
export function componentChain(el: Element, max = 5): string[] {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fiber: any = key ? (el as any)[key] : null;
  const names: string[] = [];
  while (fiber && names.length < max) {
    const type = fiber.type;
    const name = typeof type === "function" ? type.displayName || type.name : type?.displayName;
    if (name && /^[A-Z]/.test(name) && !SKIP.test(name) && names[names.length - 1] !== name) names.push(name);
    fiber = fiber.return;
  }
  return names;
}

/** Where a note's pin goes now, in viewport px: on its element if it is still there, else its page position. */
export function pinPosition(n: ReviewNote): { x: number; y: number; attached: boolean } {
  let el: Element | null = null;
  try {
    el = document.querySelector(n.target.selector);
  } catch {}
  const r = el?.getBoundingClientRect();
  if (r && r.width + r.height > 0) return { x: r.left + n.target.fx * r.width, y: r.top + n.target.fy * r.height, attached: true };
  return { x: (n.page.x / n.viewport.w) * innerWidth, y: n.page.y - scrollY, attached: false };
}
