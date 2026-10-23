"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { componentChain, cssPath, pinPosition, type ReviewNote } from "@/lib/review-notes";

const API = "/api/review-notes";
const MODE_KEY = "eleven-review-mode";
const FOCUS_KEY = "eleven-review-focus";
const PHONE_KEY = "eleven-review-phone";
const Z = 2147483000;

type Draft = { target: ReviewNote["target"]; page: ReviewNote["page"]; x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
};
const isPhone = () => document.documentElement.classList.contains("phone");
/** The page element under a point, skipping this tool's own layers. */
const pageElementAt = (x: number, y: number) => document.elementsFromPoint(x, y).find((e) => !e.closest("[data-review-ui]")) ?? null;

/** sessionStorage, quietly: private windows can throw. */
const store = {
  get: (k: string) => {
    try {
      return typeof window === "undefined" ? null : sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) sessionStorage.removeItem(k);
      else sessionStorage.setItem(k, v);
    } catch {}
  },
};
const noop = () => () => {};

async function api<T>(method: string, body?: unknown, query = ""): Promise<T> {
  const res = await fetch(API + query, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return (res.status === 204 ? null : res.json()) as T;
}

/**
 * Review notes, Figma-style comments on the running prototype (dev server only, mounted in app/layout).
 * C = comment mode: hover outlines the element, click drops a pin and a note box (Enter saves, Shift+Enter = new line,
 * Esc cancels / leaves). Pins show only in comment mode, so the site stays clean. NOTES (top) lists every note on every
 * page; click one to jump to it. On a phone open the page once with ?notes to get a NOTES chip (no keyboard).
 * Notes land in docs/review-notes.json; Claude reads them, fixes, and marks them "fixed" with a reply; you check and close.
 */
export function ReviewNotes() {
  const route = usePathname();
  // Nothing renders until hydrated (the state below reads sessionStorage on the client).
  const ready = useSyncExternalStore(noop, () => true, () => false);
  // Comment mode survives a reload or a jump to another page.
  const [on, setOn] = useState(() => store.get(MODE_KEY) === "1");
  // ?notes once on a phone keeps the NOTES chip for the visit.
  const [phoneChip] = useState(() => {
    if (typeof window !== "undefined" && new URLSearchParams(location.search).has("notes")) store.set(PHONE_KEY, "1");
    return store.get(PHONE_KEY) === "1";
  });
  const [notes, setNotes] = useState<ReviewNote[]>([]);
  const [hover, setHover] = useState<Box | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  // The note to open after jumping to its page from the list.
  const [openId, setOpenId] = useState<number | null>(() => {
    const id = Number(store.get(FOCUS_KEY));
    store.set(FOCUS_KEY, null);
    return id || null;
  });
  const [list, setList] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [, setFrame] = useState(0);

  const reload = useCallback(() => api<ReviewNote[]>("GET").then(setNotes).catch(() => {}), []);

  const toggle = useCallback((next?: boolean) => {
    setOn((v) => {
      const n = next ?? !v;
      store.set(MODE_KEY, n ? "1" : "0");
      return n;
    });
    setDraft(null);
    setHover(null);
  }, []);

  // Fetch whenever the mode opens, and when the window comes back (to pick up Claude's replies).
  useEffect(() => {
    if (!on) return;
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [on, reload]);

  // Keys: C toggles, Esc closes the box / card / list, then leaves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && on) {
        if (draft) setDraft(null);
        else if (openId) setOpenId(null);
        else if (list) setList(false);
        else toggle(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on, draft, openId, list, toggle]);

  // Pins follow their elements (scroll, transitions, animations): redraw every frame while the mode is on.
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const tick = () => {
      setFrame((f) => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  const onMove = (e: React.PointerEvent) => {
    if (draft) return;
    const el = pageElementAt(e.clientX, e.clientY);
    const r = el?.getBoundingClientRect();
    setHover(r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null);
  };
  const onPick = (e: React.PointerEvent) => {
    e.preventDefault(); // no focus change or text selection on the page: the note box keeps the keyboard
    if (draft) return setDraft(null);
    setOpenId(null);
    const el = pageElementAt(e.clientX, e.clientY);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDraft({
      x: e.clientX,
      y: e.clientY,
      page: { x: e.clientX, y: e.clientY + scrollY },
      target: {
        selector: cssPath(el),
        components: componentChain(el),
        tag: el.tagName.toLowerCase(),
        text: ((el as HTMLElement).innerText || el.getAttribute("aria-label") || el.getAttribute("alt") || "").trim().replace(/\s+/g, " ").slice(0, 120),
        fx: r.width ? (e.clientX - r.left) / r.width : 0,
        fy: r.height ? (e.clientY - r.top) / r.height : 0,
      },
    });
  };

  const create = async (text: string) => {
    if (!draft || !text.trim()) return setDraft(null);
    const note = await api<ReviewNote>("POST", {
      route,
      text: text.trim(),
      device: isPhone() ? "phone" : "desktop",
      viewport: { w: innerWidth, h: innerHeight },
      target: draft.target,
      page: draft.page,
    });
    setNotes((ns) => [...ns, note]);
    setDraft(null);
  };
  const patch = async (id: number, fields: Partial<ReviewNote>) => {
    const note = await api<ReviewNote>("PATCH", { id, ...fields });
    setNotes((ns) => ns.map((n) => (n.id === id ? note : n)));
  };
  const remove = async (id: number) => {
    await api("DELETE", undefined, `?id=${id}`);
    setNotes((ns) => ns.filter((n) => n.id !== id));
    setOpenId(null);
  };
  const jump = (n: ReviewNote) => {
    if (n.route === route) {
      setOpenId(n.id);
      setList(false);
      return;
    }
    store.set(FOCUS_KEY, String(n.id));
    store.set(MODE_KEY, "1");
    location.assign(n.route);
  };

  if (!ready) return null;

  const here = notes.filter((n) => n.route === route && (showClosed || n.status !== "closed"));
  const openCount = notes.filter((n) => n.status === "open").length;
  const fixedCount = notes.filter((n) => n.status === "fixed").length;
  const active = notes.find((n) => n.id === openId);

  return (
    <>
      {phoneChip && !on && (
        <button type="button" data-review-ui data-sound="off" onClick={() => toggle(true)} className="chip fixed top-[60px] left-1/2 -translate-x-1/2 cursor-pointer" style={{ zIndex: Z }}>
          Notes
        </button>
      )}

      {on && (
        <div data-review-ui className="font-sans text-neutral-1000">
          {/* Clicks go to this layer, never to the site, while commenting. */}
          <div onPointerMove={onMove} onPointerLeave={() => setHover(null)} onPointerDown={onPick} className="fixed inset-0 cursor-crosshair" style={{ zIndex: Z }} />

          {hover && !draft && (
            <div className="pointer-events-none fixed outline-2 -outline-offset-1 outline-royal-blue" style={{ left: hover.x, top: hover.y, width: hover.w, height: hover.h, zIndex: Z + 1 }} />
          )}

          {/* Bar: mode, counts, the list; under the nav row so it never covers a link. */}
          <div className="fixed top-[60px] left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap" style={{ zIndex: Z + 3 }}>
            <span className="chip bg-royal-blue! text-neutral-0!">Comment mode</span>
            <button type="button" data-sound="off" onClick={() => setList((v) => !v)} className="chip cursor-pointer hover:opacity-50">
              Notes {openCount} open{fixedCount ? ` · ${fixedCount} fixed` : ""}
            </button>
            <button type="button" data-sound="off" onClick={() => toggle(false)} className="chip cursor-pointer hover:opacity-50" aria-label="Leave comment mode">
              {isPhone() ? "Done" : "C / Esc"}
            </button>
          </div>

          {here.map((n) => {
            const p = pinPosition(n);
            return (
              <button
                key={n.id}
                type="button"
                data-sound="off"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setOpenId(n.id === openId ? null : n.id)}
                title={p.attached ? undefined : "The element moved or is in another view; pinned at its page position"}
                className={`fixed flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[11px] font-bold text-neutral-0 ring-2 ring-neutral-0 ${
                  n.status === "fixed" ? "bg-dark-green" : n.status === "closed" ? "bg-neutral-400" : "bg-royal-blue"
                } ${p.attached ? "" : "opacity-60"}`}
                style={{ left: p.x, top: p.y, zIndex: Z + 2 }}
              >
                {n.id}
              </button>
            );
          })}

          {draft && <Composer x={draft.x} y={draft.y} onSave={create} onCancel={() => setDraft(null)} />}

          {active && (() => {
            const p = pinPosition(active);
            return <Card note={active} x={p.x} y={p.y} onPatch={(f) => patch(active.id, f)} onDelete={() => remove(active.id)} onClose={() => setOpenId(null)} />;
          })()}

          {list && (
            <aside className="fixed top-[92px] right-4 max-h-[70vh] w-[320px] overflow-y-auto bg-neutral-0 p-3 shadow-[0_8px_32px_rgb(0_0_0/0.18)]" style={{ zIndex: Z + 3 }}>
              <label className="mb-2 flex cursor-pointer items-center gap-2 text-[12px]">
                <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show closed
              </label>
              {notes.length === 0 && <p className="text-[12px] text-neutral-500">No notes yet. Click anywhere on the page.</p>}
              {[...new Set(notes.map((n) => n.route))].map((r) => {
                const rows = notes.filter((n) => n.route === r && (showClosed || n.status !== "closed"));
                if (!rows.length) return null;
                return (
                  <div key={r} className="mb-3">
                    <p className="mb-1 text-[11px] font-bold uppercase">{r}</p>
                    {rows.map((n) => (
                      <button key={n.id} type="button" data-sound="off" onClick={() => jump(n)} className="flex w-full cursor-pointer gap-2 border-t border-neutral-200 py-1.5 text-left text-[12px] leading-[1.3] hover:opacity-60">
                        <span className="font-bold">{n.id}</span>
                        <span className="flex-1">{n.text}</span>
                        <span className="text-[10px] font-bold uppercase text-neutral-500">{n.device === "phone" ? "ph · " : ""}{n.status}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </aside>
          )}
        </div>
      )}
    </>
  );
}

/** Keeps a floating box inside the window, next to its pin. */
const place = (x: number, y: number, w: number, h: number) => ({
  left: Math.min(Math.max(8, x + 16), innerWidth - w - 8),
  top: Math.min(Math.max(8, y - 8), innerHeight - h - 8),
});

function Composer({ x, y, onSave, onCancel }: { x: number; y: number; onSave: (t: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  // Focus after the click that opened it has fully finished (autoFocus alone loses it to the page).
  useEffect(() => {
    const t = setTimeout(() => box.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div onPointerDown={(e) => e.stopPropagation()} className="fixed w-[280px] bg-neutral-0 p-2 shadow-[0_8px_32px_rgb(0_0_0/0.18)]" style={{ ...place(x, y, 280, 140), zIndex: Z + 4 }}>
      <span className="pointer-events-none fixed size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-royal-blue ring-2 ring-neutral-0" style={{ left: x, top: y }} />
      <textarea
        ref={box}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave(text);
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="What should change here?"
        rows={3}
        className="block w-full resize-none bg-neutral-100 p-2 text-[13px] leading-[1.35] outline-none"
      />
      <div className="mt-2 flex justify-end gap-1">
        <button type="button" data-sound="off" onClick={onCancel} className="chip cursor-pointer hover:opacity-50">Cancel</button>
        <button type="button" data-sound="off" onClick={() => onSave(text)} className="chip cursor-pointer bg-royal-blue! text-neutral-0! hover:opacity-80">Save</button>
      </div>
    </div>
  );
}

function Card({ note, x, y, onPatch, onDelete, onClose }: { note: ReviewNote; x: number; y: number; onPatch: (f: Partial<ReviewNote>) => void; onDelete: () => void; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  return (
    <div onPointerDown={(e) => e.stopPropagation()} className="fixed w-[300px] bg-neutral-0 p-3 text-[13px] leading-[1.35] shadow-[0_8px_32px_rgb(0_0_0/0.18)]" style={{ ...place(x, y, 300, 220), zIndex: Z + 4 }}>
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase">
        <span>Note {note.id} · {note.status}</span>
        <button type="button" data-sound="off" onClick={onClose} className="cursor-pointer hover:opacity-50" aria-label="Close">×</button>
      </div>
      {editing ? (
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3} className="block w-full resize-none bg-neutral-100 p-2 outline-none" />
      ) : (
        <p className="whitespace-pre-wrap">{note.text}</p>
      )}
      {note.reply && (
        <p className="mt-2 border-l-2 border-dark-green pl-2 text-[12px]">
          <span className="font-bold">Claude: </span>
          {note.reply}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {editing ? (
          <button type="button" data-sound="off" onClick={() => (onPatch({ text }), setEditing(false))} className="chip cursor-pointer bg-royal-blue! text-neutral-0!">Save</button>
        ) : (
          <button type="button" data-sound="off" onClick={() => setEditing(true)} className="chip cursor-pointer hover:opacity-50">Edit</button>
        )}
        {note.status !== "closed" ? (
          <button type="button" data-sound="off" onClick={() => onPatch({ status: "closed" })} className="chip cursor-pointer hover:opacity-50">{note.status === "fixed" ? "Looks good, close" : "Close"}</button>
        ) : (
          <button type="button" data-sound="off" onClick={() => onPatch({ status: "open" })} className="chip cursor-pointer hover:opacity-50">Reopen</button>
        )}
        {note.status === "fixed" && (
          <button type="button" data-sound="off" onClick={() => onPatch({ status: "open" })} className="chip cursor-pointer hover:opacity-50">Not yet</button>
        )}
        <button type="button" data-sound="off" onClick={onDelete} className="chip cursor-pointer hover:opacity-50">Delete</button>
      </div>
    </div>
  );
}
