import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReviewNote } from "@/lib/review-notes";

/**
 * Review notes (components/dev/ReviewNotes): Amélie's on-page comments, saved to docs/review-notes.json next to the
 * project (outside src, so they never ship). Dev server only: on Netlify every method answers 404.
 */
const FILE = path.join(process.cwd(), "..", "docs", "review-notes.json");
const DEV = process.env.NODE_ENV === "development";
const off = () => new Response("Not found", { status: 404 });

async function load(): Promise<ReviewNote[]> {
  try {
    return (JSON.parse(await fs.readFile(FILE, "utf8")) as { notes: ReviewNote[] }).notes ?? [];
  } catch {
    return [];
  }
}

async function save(notes: ReviewNote[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify({ notes }, null, 2) + "\n");
}

export async function GET() {
  if (!DEV) return off();
  return Response.json(await load());
}

/** New note: the id is the next number, so notes can be named in chat ("note 7"). */
export async function POST(request: Request) {
  if (!DEV) return off();
  const body = (await request.json()) as Omit<ReviewNote, "id" | "created" | "status">;
  const notes = await load();
  const note: ReviewNote = {
    ...body,
    id: notes.reduce((m, n) => Math.max(m, n.id), 0) + 1,
    status: "open",
    created: new Date().toISOString(),
  };
  notes.push(note);
  await save(notes);
  return Response.json(note);
}

/** Edit text, status or reply: { id, ...fields }. */
export async function PATCH(request: Request) {
  if (!DEV) return off();
  const { id, ...fields } = (await request.json()) as Partial<ReviewNote> & { id: number };
  const notes = await load();
  const i = notes.findIndex((n) => n.id === id);
  if (i < 0) return new Response("No such note", { status: 404 });
  notes[i] = { ...notes[i], ...fields, updated: new Date().toISOString() };
  await save(notes);
  return Response.json(notes[i]);
}

export async function DELETE(request: Request) {
  if (!DEV) return off();
  const id = Number(new URL(request.url).searchParams.get("id"));
  await save((await load()).filter((n) => n.id !== id));
  return new Response(null, { status: 204 });
}
