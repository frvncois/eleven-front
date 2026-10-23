import team from "@/data/team.json";
import projects from "@/data/projects.json";

export type Person = (typeof team)[number];
export type Project = (typeof projects)[number];

/** The six mixers, in the order of the Figma roster (Mixers overlay, Who's next). */
const MIXER_ORDER = ["jordan-meltzer", "jeff-payne", "aj-murillo", "bob-gremore", "bruce-bueckert", "marco-tornillo"];

export const mixers = MIXER_ORDER.map((slug) => team.find((p) => p.slug === slug)!).filter(Boolean);

export const mixerBySlug = (slug: string) => mixers.find((m) => m.slug === slug);

/** A mixer's spots, in the site's order. */
export const spotsOf = (slug: string) => projects.filter((p) => p.mixer === slug && p.kind === "spot");

/** "Client · Title" captions split into the two chips; a caption without a client prefix keeps the given client. */
export function splitCaption(text: string, client: string) {
  const [left, ...rest] = text.split(" · ");
  const c = rest.length ? left : client;
  const name = rest.length ? rest.join(" · ") : text;
  return { client: c, name: name === c ? null : name };
}
