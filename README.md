# Eleven — front end

Next.js, statically generated. All copy, imagery and interface strings live in Strapi
(`../eleven-back`); nothing editorial is hardcoded.

## Content

`data/*.json` is **generated** — it is written by `scripts/pull-content.mjs` and gitignored.
Edit content in the Strapi admin, never in `data/`.

```bash
cp .env.example .env.local        # point STRAPI_URL at your Strapi
npm run content                   # pull data/*.json out of Strapi
npm run dev
```

A fresh clone has no `data/`, so `npm run content` has to run once before `npm run dev`.
`npm run build` pulls automatically (the `prebuild` script), so a deploy always ships the
currently published content.

| Generated file | Comes from |
|---|---|
| `team.json` | `Person` collection |
| `mixers-banner.json` | `Person.bannerName` / `bannerIcon` |
| `projects.json` | `Project` collection |
| `index.json` | `Archive Page` + each `Project.archiveTile` |
| `site.json` | `Site Settings` + `Contact Page` |
| `home.json` | `Home Page` |
| `about.json` | `About Page` |
| `legal.json` | `Legal Page` |
| `longform.json` | `Longform Page` |
| `party.json` | `Party Mode` |
| `ui.json` | `UI Labels` |

What is still in code, on purpose: the sound engine's cue map (`lib/sound.ts`), the layout maths
(`lib/grid.ts`, `lib/motion.ts`, `lib/perspective.ts`), and the dev-only review notes.
See `../eleven-back/CONTENT-MODEL.md` for the full model.

## Media

Posters, reels, the Contact gif and the service sounds are served from the Strapi media library as
absolute URLs. `next.config.ts` derives the origin from `STRAPI_URL` and allows it in both the CSP
(`img-src` / `media-src`) and `images.remotePatterns` — so **`STRAPI_URL` must be set in the Vercel
project**, or images and sounds are blocked by the CSP in production.

Fonts, the `app/` icons and the UI sound kit stay in `public/`.

## Deploying (Vercel)

Environment: `STRAPI_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_INDEXABLE`.

Rebuild when an editor publishes: in Strapi Cloud add a webhook on
`entry.publish` / `entry.unpublish` / `media.create` / `media.update` / `media.delete`
pointing at a Vercel Deploy Hook.

Until launch every response is `noindex` (`vercel.json` headers + `lib/site.ts`). On launch day set
`NEXT_PUBLIC_INDEXABLE=true` and remove the `headers` block from `vercel.json`.
