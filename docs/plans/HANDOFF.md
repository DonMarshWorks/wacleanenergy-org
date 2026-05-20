# Implementation Hand-off

**Last updated:** 2026-05-20

**Outgoing session:** Recovered from a lost prior session, produced
two implementation plans, built the site, and pushed it live on
Cloudflare Pages. The content-migration plan was written,
Stage-3-reviewed twice, implemented, and Stage-5-reviewed. The
GoDaddy migration plan was written and Stage-3-reviewed four times
but not implemented — it is blocked on Phase 0 facts only the
coalition can supply. After the initial commit landed, the GitHub
remote and Cloudflare Pages project were set up and the site
deployed; it is live at https://wacleanenergy-org.pages.dev but
not yet on the real `wacleanenergy.org` domain.

---

## Shipped this session

- [`docs/plans/godaddy-migration.md`](godaddy-migration.md) — full
  DNS / email / registrar migration plan (4 review rounds).
- [`docs/plans/content-migration.md`](content-migration.md) — full site
  rebuild plan (2 review rounds + Stage 5 implementation review).
- The implemented site under `src/`:
  - Pages — Home, What We Do, Partners, Accomplishments, News
    (paginated index + individual post pages), Contact, 404.
  - Layout / components — `BaseLayout.astro` + `Header` / `Footer` /
    `NewsCard`, with skip link, canonical/OG URLs from `Astro.site`,
    semantic landmarks.
  - Content — `src/content.config.ts` with strict Zod schemas; `news`
    as glob Markdown; `partners` and `accomplishments` as `file()`
    YAML keyed by stable id.
  - Helpers — `src/lib/news.ts` (chokepoint) + the pure, unit-tested
    `news-select.ts`; `src/lib/{format,partners,accomplishments}.ts`.
  - RSS — `src/pages/rss.xml.ts` with full rendered post HTML via the
    Astro Container API, capped at 20 most recent.
  - Theme — `src/styles/global.css` with `@theme` tokens; surface
    colour sampled from the logo.
- `astro.config.mjs` — SSR adapter removed (fully static); sitemap
  integration added.
- `wrangler.jsonc` — replaced with a clean Pages-shaped config.
- `src/assets/wcec-logo.png` — coalition logo, pixel-accurately
  cropped to centred mark+text + 60 px cream frame.

## Quality gates

- **Tests:** 7/7 passing — `npm test`
- **Lint:** clean — `npm run lint` (Prettier + `astro check`, 24 files)
- **Build:** clean — `npm run build` (8 static pages + `/rss.xml` +
  sitemap)

## Cumulative state

### Shipped features

- Brand-themed static Astro 5 site on Cloudflare Pages (initial
  commit).
- News section as Astro 5 content collection with paginated index,
  per-post pages, and an RSS feed with full post HTML.
- Schema-validated Partners and Accomplishments data collections.
- Sitemap, canonical URLs, Open Graph meta, accessibility primitives.

### Accepted regressions / known limitations

- Page copy, partners/accomplishments data, and the sample news post
  are placeholder pending coalition input
  ([`docs/plans/content-migration.md`](content-migration.md), Open
  Questions 3–4).
- Favicon is still the kit's placeholder — no brand favicon supplied.
- Brand teal / navy / ink tokens are eyedrop estimates from the logo;
  `--color-surface` is pixel-sampled and exact. Coalition confirmation
  of the other three would close the loop.

### Pre-existing issues surfaced (not introduced by this work)

- None.

## Recent commits

```
3e8ace6  Initial site rebuild + DNS/email migration plan  (2026-05-19)
```

## Deployment

- **GitHub:** https://github.com/DonMarshWorks/wacleanenergy-org (public)
- **Cloudflare Pages project:** `wacleanenergy-org`, production branch
  `main`, served at https://wacleanenergy-org.pages.dev.
- **Deploy mechanism:** `npm run deploy` (manual; runs `astro build`
  then `wrangler pages deploy dist/`). Auto-deploy on push is **not
  yet wired up** — connect the GitHub repo in the Cloudflare dashboard
  (Pages → project → Settings → Builds & deployments → Connect Git) to
  enable it.
- **Custom domain:** not attached — `wacleanenergy.org` still serves
  the old WordPress site. Attaching it is part of the GoDaddy migration
  plan's Phase 2B and depends on Phase 0 first.
- Both GitHub and Cloudflare accounts are currently personal
  (`DonMarshWorks` / `don.m.marsh@gmail.com`); long-term, transfer to
  coalition-controlled accounts is recommended.

## Incoming session options

1. **Execute Stage 4 of the GoDaddy migration plan** — requires Phase 0
   facts from the coalition first (GoDaddy DNS zone export, where
   `info@` mail currently lives, DNSSEC status, low-traffic cutover
   window, second authorised maintainer for Zoho / Cloudflare). See
   [`godaddy-migration.md`](godaddy-migration.md) Phase 0.
2. **Replace placeholder content** — fold in real page copy, the
   partners list, the accomplishments record, confirmed brand colours,
   and (ideally) a transparent-background logo for the header.
   Mechanical edits to existing files.
3. **Connect GitHub → Pages for auto-deploy** — a Cloudflare dashboard
   step (Pages → project → Settings → Builds & deployments → Connect
   Git). After connecting, every push to `main` rebuilds and
   redeploys automatically.
4. **Design polish** — typography choices, home-page hero treatment,
   illustrative imagery (e.g. recreating the PSE-vs-WA energy-mix
   visual from the old site), once Stage-3-reviewed.
5. **Transfer GitHub repo and Cloudflare account to coalition control**
   — currently both on personal accounts.
