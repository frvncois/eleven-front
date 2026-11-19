/**
 * Pulls every page's content out of Strapi and writes data/*.json, the shapes the components
 * already import. Layout geometry is NOT in Strapi — it lives in lib/layout.ts and is joined to
 * this content by slug or by order. Sizes that are only a file's own pixel dimensions are read off
 * the uploaded media here, so replacing a picture keeps its proportions. Runs as `prebuild`, so a Vercel build always ships the published content and
 * Strapi is never in a visitor's path.
 *
 *   STRAPI_URL=https://… node scripts/pull-content.mjs
 *
 * Media comes back as absolute Strapi Cloud URLs (see next.config.ts remotePatterns).
 * data/ is generated: never hand-edit it, edit the content in Strapi.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const STRAPI = (process.env.STRAPI_URL ?? "http://localhost:1337").replace(/\/$/, "");
const TOKEN = process.env.STRAPI_API_TOKEN;
const OUT = path.resolve(import.meta.dirname, "../data");

async function api(endpoint, params = {}) {
  const url = new URL(`${STRAPI}/api/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }) },
  });
  if (!res.ok) throw new Error(`${endpoint} → ${res.status} ${res.statusText}\n${await res.text()}`);
  const { data } = await res.json();
  if (!data) throw new Error(`${endpoint} returned no data — is it published?`);
  return data;
}

/** A media field → its absolute URL, or null. Strapi Cloud already returns absolute URLs. */
const url = (m) => (m?.url ? (m.url.startsWith("http") ? m.url : `${STRAPI}${m.url}`) : null);
/** An image's own pixel size, which Strapi stores on the upload — ask for `DIMS` in the populate. */
const dims = (m, where) => {
  if (!m?.width || !m?.height) throw new Error(`${where}: the image has no width/height on the upload`);
  return { width: m.width, height: m.height };
};
/** `fields` for an image we need the URL and the proportions of. */
const IMAGE_FIELDS = (p) => ({ [`${p}[fields][0]`]: "url", [`${p}[fields][1]`]: "width", [`${p}[fields][2]`]: "height" });
/**
 * Drop the `id` Strapi puts on every component, for the few groups passed through whole.
 * Never do this by walking the tree: Legal's sections carry an `id` of their own (the `#privacy`
 * anchor and their React key), and a blanket strip eats it.
 */
const noId = (o) => {
  if (!o) return o;
  const rest = { ...o };
  delete rest.id;
  delete rest.documentId;
  return rest;
};

// Every project, with the two components the pages need. pageSize covers the 66 in one request.
const PROJECT_POPULATE = {
  "pagination[pageSize]": "200",
  "populate[poster][fields][0]": "url",
  "populate[mixer][fields][0]": "slug",
  "populate[archiveTile]": "true",
  sort: "order:asc",
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const written = [];
  const write = async (name, value) => {
    await writeFile(path.join(OUT, name), JSON.stringify(value, null, 2) + "\n");
    written.push(name);
  };

  // ---------- people / team.json ----------
  const people = await api("people", {
    "pagination[pageSize]": "100",
    sort: "order:asc",
    "populate[photo][fields][0]": "url",
    "populate[icon][populate][white][fields][0]": "url",
    "populate[icon][populate][black][fields][0]": "url",
    "populate[teamBar][populate][roles]": "true",
  });

  await write(
    "team.json",
    people.map((p) => ({
      slug: p.slug,
      name: p.name,
      role: p.role,
      email: p.email,
      instagram: p.instagram,
      linkedin: p.linkedin,
      isMixer: p.isMixer,
      order: p.order,
      photo: url(p.photo),
      icon: p.icon ? { name: p.icon.name, white: url(p.icon.white), black: url(p.icon.black) } : null,
    })),
  );

  // ---------- projects.json ----------
  const projects = await api("projects", PROJECT_POPULATE);
  const toProject = (p) => ({
    agency: p.agency,
    client: p.client,
    description: p.description,
    director: p.director,
    duration: p.duration,
    kind: p.kind,
    mixer: p.mixer?.slug ?? null,
    onLanding: p.onLanding,
    poster: url(p.poster),
    previewStart: p.previewStart,
    production: p.production,
    short: p.short,
    slug: p.slug,
    title: p.title,
    vimeo: p.vimeo,
    vimeoId: p.vimeoId,
  });

  // Spots grouped by mixer (roster order), then longform — the order the hand-written file had.
  // Only the order *within* each group is load-bearing (lib/content spotsOf filters, keeping order).
  const mixerOrder = people.filter((p) => p.isMixer).map((p) => p.slug);
  const spots = mixerOrder.flatMap((slug) =>
    projects.filter((p) => p.kind === "spot" && p.mixer?.slug === slug).sort((a, b) => a.order - b.order),
  );
  const longform = projects.filter((p) => p.kind === "longform").sort((a, b) => a.order - b.order);
  if (spots.length + longform.length !== projects.length) {
    throw new Error(`project grouping lost entries: ${spots.length}+${longform.length} of ${projects.length}`);
  }
  await write("projects.json", [...spots, ...longform].map(toProject));

  // ---------- index.json (archive) ----------
  // The tile's labels and its order; where it sits on the field is lib/layout's ARCHIVE_TILES, by slug.
  const tiles = projects
    .filter((p) => p.archiveTile)
    .sort((a, b) => a.archiveTile.order - b.archiveTile.order)
    .map((p) => ({ slug: p.slug, title: p.archiveTile.label, client: p.archiveTile.clientLabel }));
  if (tiles.length !== projects.length) throw new Error(`${projects.length - tiles.length} project(s) have no archive tile`);
  await write("index.json", { tiles });

  // ---------- site.json ----------
  const site = await api("site-setting", {
    "populate[nav]": "true",
    "populate[footer][populate][legal]": "true",
    "populate[footer][populate][credits]": "true",
    "populate[footer][populate][social]": "true",
    "populate[player]": "true",
    "populate[seo][populate]": "*",
  });
  const contact = await api("contact-page", {
    "populate[people]": "true",
    "populate[studio]": "true",
    "populate[reps]": "true",
    "populate[image][fields][0]": "url",
  });

  await write("site.json", {
    // `key` and `platform` exist so code never matches on an editable label
    // (MenuCard used to branch on label === "Mixers" / "Instagram").
    nav: site.nav.map((n) => ({ key: n.key, label: n.label, href: n.href, match: n.match, color: n.color })),
    contact: {
      title: contact.title,
      image: url(contact.image),
      imageAlt: contact.imageAlt,
      people: contact.people.map((p) => ({ name: p.name, role: p.role, email: p.email, phone: p.phone })),
      studio: {
        label: contact.studio.label,
        // Two fields in Strapi, an address block on the page.
        lines: [contact.studio.line1, contact.studio.line2],
        map: contact.studio.map,
        phone: contact.studio.phone,
      },
      reps: {
        label: contact.repsLabel,
        people: contact.reps.map((p) => ({ name: p.name, email: p.email, phone: p.phone })),
      },
    },
    footer: {
      copyright: site.footer.copyright,
      legal: site.footer.legal.map((l) => ({ label: l.label, href: l.href })),
      credits: {
        label: site.footer.creditsLabel,
        items: site.footer.credits.map((c) => ({ name: c.name, role: c.role, href: c.href })),
      },
      social: site.footer.social.map((s) => ({ platform: s.platform, label: s.label, href: s.href })),
    },
    player: { pause: site.player.pause, play: site.player.play, close: site.player.close },
    seo: {
      defaultTitle: site.seo.defaultTitle,
      titleTemplate: site.seo.titleTemplate,
      description: site.seo.description,
      siteName: site.seo.siteName,
      locale: site.seo.locale,
      themeColor: site.seo.themeColor,
    },
  });

  // ---------- home.json ----------
  const home = await api("home-page", {
    "populate[gate]": "true",
    "populate[reel][populate][src][fields][0]": "url",
    "populate[reel][populate][poster][fields][0]": "url",
    "populate[reelPhone][populate][src][fields][0]": "url",
    "populate[reelPhone][populate][poster][fields][0]": "url",
  });
  await write("home.json", {
    gate: {
      line: [home.gate.line1, home.gate.line2],
      cursor: home.gate.cursor,
      skip: home.gate.skip,
      hint: home.gate.hint,
      tap: home.gate.tap,
    },
    reel: {
      src: url(home.reel.src),
      poster: url(home.reel.poster),
      phone: { src: url(home.reelPhone.src), poster: url(home.reelPhone.poster) },
    },
  });

  // ---------- about.json ----------
  const about = await api("about-page", {
    ...IMAGE_FIELDS("populate[storyParagraphs][populate][note][populate][photo]"),
    "populate[sticker][populate][image][fields][0]": "url",
    ...IMAGE_FIELDS("populate[globe][populate][image]"),
    ...IMAGE_FIELDS("populate[globe][populate][note][populate][photo]"),
    "populate[services][populate][sounds][populate][files][fields][0]": "url",
    "populate[teamMembers][populate][person][fields][0]": "slug",
    "populate[rooms][populate][photo][fields][0]": "url",
    "populate[rooms][populate][audio][fields][0]": "url",
    "populate[contactCta]": "true",
  });

  const note = (n) =>
    n && {
      n: n.n,
      text: n.text,
      ...(n.photo && { photo: { src: url(n.photo), alt: n.photoAlt, ...dims(n.photo, `note ${n.n} photo`) } }),
    };

  // Rebuild the team bars as rows of cards, the shape the About page and AboutMobile map over.
  const rows = [];
  for (const m of about.teamMembers) {
    const person = people.find((p) => p.slug === m.person.slug);
    if (!person?.teamBar) throw new Error(`team member ${m.person.slug} has no teamBar`);
    (rows[m.row] ??= []).push({
      slug: person.slug,
      bg: person.teamBar.bg,
      ink: person.teamBar.ink,
      // The bar's roles are a repeater in Strapi; the cards want plain strings.
      roles: person.teamBar.roles.map((r) => r.label),
    });
  }

  await write("about.json", {
    story: {
      intro: about.storyIntro,
      paragraphs: about.storyParagraphs.map((p) => ({ text: p.text, note: note(p.note) })),
      sticker: { src: url(about.sticker.image) },
      globe: {
        src: url(about.globe.image),
        alt: about.globe.alt,
        ...dims(about.globe.image, "the snow globe"),
        note: note(about.globe.note),
      },
    },
    services: {
      label: about.servicesLabel,
      items: about.services.map((s) => [s.name, s.note]),
      // Flattened back to the word → takes map ServiceText looks words up in.
      sounds: Object.fromEntries(
        about.services.flatMap((s) => s.sounds.map((snd) => [snd.word, snd.files.map(url)])),
      ),
    },
    team: { label: about.teamLabel, rows: rows.filter(Boolean) },
    roomCarousel: {
      // Card heights are the designed crops in lib/layout's ROOM_HEIGHTS, in this order.
      items: about.rooms.map((r) => ({
        room: r.name,
        photo: url(r.photo),
        preset: r.preset,
        audio: url(r.audio),
      })),
    },
    contact: {
      title: about.contactCta.title,
      line: about.contactCta.line,
      aside: about.contactCta.aside,
      cursor: about.contactCta.cursor,
      href: about.contactCta.href,
    },
  });

  // ---------- legal.json ----------
  const legal = await api("legal-page", { "populate[sections][populate][paragraphs]": "true" });
  await write("legal.json", {
    title: legal.title,
    sections: legal.sections.map((s) => ({
      id: s.sectionId,
      label: s.label,
      paragraphs: s.paragraphs.map((p) => p.text),
      ...(s.note && { note: s.note }),
    })),
  });

  // ---------- longform.json ----------
  const lf = await api("longform-page", { "populate[films][populate][project][fields][0]": "slug" });
  await write("longform.json", {
    films: lf.films.map((f) => ({
      slug: f.project.slug,
      label: f.label,
      color: f.color,
      ...(f.objectPosition && { position: f.objectPosition }),
    })),
  });

  // ---------- party.json ----------
  const party = await api("party-mode", {
    ...IMAGE_FIELDS("populate[items][populate][image]"),
    "populate[items][populate][video][fields][0]": "url",
    "populate[items][populate][audio][fields][0]": "url",
  });
  await write("party.json", {
    // Where each picture sits and how wide it runs is lib/layout's PARTY_PLACEMENT, in this order;
    // the picture's own size rides along so the shape follows whatever is uploaded.
    items: party.items.map((i, n) => {
      const { width, height } = dims(i.image, `party item ${n + 1}`);
      return { image: url(i.image), bg: i.bg, imageWidth: width, imageHeight: height, video: url(i.video), audio: url(i.audio) };
    }),
    ariaLabel: party.ariaLabel,
    closeCursor: party.closeCursor,
  });

  // ---------- ui.json ----------
  const ui = await api("ui-label", { populate: "*" });
  await write("ui.json", {
    views: noId(ui.views),
    dock: noId(ui.dock),
    gate: noId(ui.gate),
    cursors: noId(ui.cursors),
    credits: noId(ui.credits),
    player: noId(ui.player),
    regions: noId(ui.regions),
    notFound: noId(ui.notFound),
    errorPage: noId(ui.errorPage),
  });

  console.log(`pulled ${written.length} files from ${STRAPI}:\n  ${written.join("\n  ")}`);
}

main().catch((e) => {
  console.error(`\ncontent pull failed: ${e.message}\n`);
  process.exit(1);
});
