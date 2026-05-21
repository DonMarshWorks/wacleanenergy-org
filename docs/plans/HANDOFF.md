# Implementation Hand-off

**Last updated:** 2026-05-21 (afternoon)

**Outgoing session:** A long visual-polish + News-backfill arc on top of
the morning's Markdown migration. The "new dawn" motif behind the nav
was rebuilt from scratch as three CSS-rotated trapezoid rays + a CSS
half-disc sun, lives in `Header.astro` so it appears on every page, and
is gated to `sm:block` (≥640 px) so it stays off portrait phones. A
six-item polish bundle landed next: footer enriched with a nav mirror
and an RSS feed link, first body paragraph styled as a lead, partner
logo grid normalised, brand-derived favicon (self-contained teal
rounded-square with a warm-yellow sun inside, no theme dependence), a
1200×630 social-share card composed offline by `scripts/generate-og.mjs`
and wired into `BaseLayout` as `og:image` / `twitter:image`, and Fraunces
self-hosted via `@fontsource-variable/fraunces` applied to H1 and H2
globally. The News section was then backfilled with fourteen real posts
from the coalition's filing archive (Sep 2021 through May 2026), each
post following a consistent shape (2-sentence intro, 3–5 bullet main
points, "Read the full document (PDF)" link to the source PDF in
`public/news-assets/`). The sample placeholder is gone, the index now
paginates across `/news` and `/news/2`, and PDF links use raw
`<a target="_blank" rel="noopener">` so the document opens in a new tab
on browsers that respect it. Auto-deploy on push to `main` remains live;
the DNS / email / registrar migration is still planned-only.

---

## Shipped this session

- **New dawn motif** (`src/components/Header.astro`): a warm half-sun
  (CSS half-disc, `border-radius: 48px 48px 0 0`) sits flat-side-down on
  the header dividing line, anchored ~170 px from the right edge of the
  centred `max-w-5xl` column. Three CSS-rotated rectangles clipped to
  triangles (`clip-path: polygon(...)`) fan up behind the nav at -52°,
  +8°, +50° with widths 120 / 76 / 104 px and a linear-gradient fade.
  Header has `relative isolate` so the `-z-10` decoration paints behind
  logo and nav within one stacking context. Hidden below `sm` (640 px).
  Lives on every page since the home-only gate was dropped.
- **Footer** (`src/components/Footer.astro`): nav mirror + RSS feed link
  on top row, contact email + copyright on a separated second row.
- **Lead paragraph** (`src/styles/global.css`): a
  `.post-body > p:first-of-type` rule bumps the first body paragraph to
  1.125 rem / 500 weight on every page using `.post-body`.
- **Partner logo grid** (`src/pages/what-we-do.astro`): each of the
  seven logos sits in a fixed-height flex lane (`h-20`) with `max-h-16`
  / `max-w-[80%]` on the `<img>` so the seven aspect ratios read as one
  normalised set.
- **Favicon** (`public/favicon.svg`): brand-teal rounded square with a
  warm-yellow sun + 8 rays inside. Self-contained background, so works
  against any tab chrome (the previous transparent-bg variant
  disappeared against dark themes).
- **Social card** (`public/og.png` + `scripts/generate-og.mjs`): static
  1200×630 PNG with the WCEC logo centred, "Let's get this transition
  right." in Georgia bold below it, and `wacleanenergy.org` at the
  bottom. Composed via Sharp rasterising an SVG layer + the logo PNG.
  `BaseLayout` now emits `og:image`, `og:image:width`/`height`,
  `twitter:card=summary_large_image`, and `twitter:image`.
- **Heading font** (`@fontsource-variable/fraunces`): Fraunces variable
  (opsz + wght axes) self-hosted via Fontsource and applied to `h1, h2`
  globally in `global.css`. Body and smaller headings stay on system
  sans.
- **News backfill** (`src/content/news/` + `public/news-assets/`):
  fourteen real posts from the coalition's regulatory-advocacy archive,
  chronological:
    - 2021-09  Coalition asks UTC to reject PSE Clean Energy Plan over
      climate-blind modeling *(15-org coalition incl. WCEC)*
    - 2021-10  WCEC challenges PSE's Customer Benefit Indicator
      methodology *(WCEC + Vashon Climate Action Group)*
    - 2021-11  WCEC questions PSE's 50% derate of Time Varying Rate
      benefits *(Sierra Club + WCEC; Don Marsh dual signatory)*
    - 2022-02  WCEC publishes recommendations for PSE Clean Energy Plan
      *(date approximate — 2022-02-15)*
    - 2022-05  WCEC urges UTC to set expedited timeline for CEIP
      completion
    - 2022-07  WCEC flags systematic demand-forecasting flaw in PSE's
      IRPs *(Sierra Club + WCEC)*
    - 2023-05  WCEC asks for independent audit of PSE's Electric IRP
    - 2023-06  WCEC asks UTC to reject PSE's 2023 Gas IRP
    - 2024-11  WCEC opposes PSE proposal to lower 2024–2025 clean energy
      targets
    - 2024-11  WCEC urges UTC to improve PSE's public participation
      process
    - 2025-05  Coalition urges UTC to restore meaningful public
      participation in PSE planning *(WCEC + Third Act + 350 Eastside +
      Kittitas Climate Action)*
    - 2025-10  Coalition recommends conditions for data-center tax
      incentives *(WCEC + Third Act)*
    - 2025-12  Coalition responds to Data Center Workgroup preliminary
      report *(WCEC + Third Act)*
    - 2026-05  WCEC questions Governor Ferguson on nuclear energy policy
  Each post: 2-sentence intro + 3–5 bullets + `<a target="_blank"
  rel="noopener">Read the full document (PDF)</a>` link. PDF filenames
  match the slug under `public/news-assets/<slug>.pdf`. Sample
  placeholder (`2026-04-pse-gas-comments.md`) deleted.

## Quality gates (at this commit)

- **Tests:** 7/7 passing — `npm test`
- **Lint:** clean — `npm run lint` (Prettier + `astro check`, 23 files)
- **Build:** clean — `npm run build` (21 static pages including 14 news
  posts + paginated `/news` and `/news/2` + `/rss.xml` + sitemap)

## Cumulative state

### Shipped features

- Brand-themed static Astro 5 site, fully Markdown-driven prose,
  auto-deploying from `main` to https://wacleanenergy-org.pages.dev.
- Home page with the emissions chart, lead-paragraph styling, and the
  dawn-sun motif.
- /who-we-are with chair photo and "What we do →" CTA.
- /what-we-do with normalised partner-logo grid and "Get in touch" CTA.
- /contact, /news (paginated with RSS), 404, sitemap, canonical URLs,
  Open Graph + Twitter meta with a real social card.
- News section with 14 real posts + per-post PDF link to the source
  filing in `public/news-assets/`.
- Fraunces serif on H1/H2 across the site, Fontsource-bundled.
- Brand-derived favicon visible on both light and dark tab chromes.

### Accepted regressions / known limitations

- **/contact body** remains placeholder pending coalition input.
- Brand teal / navy / ink tokens are eyedrop estimates from the logo;
  `--color-surface` was sampled then nudged lighter to `#fcfdf7` with
  the logo recolored to match.
- One news post's `pubDate` is approximate: `2022-02-pse-ceip-recommendations`
  uses `2022-02-15` since the source PDF is undated. Update if the real
  distribution date surfaces.
- "GoDaddy migration" plan (`docs/plans/godaddy-migration.md`) is still
  partly GoDaddy-worded in the body even though the actual current host
  is WordPress.com / Automattic; renaming + rewording is itself a
  pending task.

### Pre-existing issues surfaced (not introduced by this work)

- IDE TypeScript LSP reports false-positive "unused" hints for Astro
  components used in templates. `astro check` is clean; the LSP
  diagnostics are informational only.
- Astro 6.3.7 is now available; we're on 5.18.1. No upgrade pressure.

## Deployment

- **GitHub:** https://github.com/DonMarshWorks/wacleanenergy-org (public)
- **Cloudflare Pages project:** `wacleanenergy-org`, production branch
  `main`, served at https://wacleanenergy-org.pages.dev.
- **Deploy mechanism:** auto-deploy on push to `main` via the Pages Git
  integration. PR branches get free preview deploys. `npm run deploy`
  still works as a manual fallback.
- **Custom domain:** **not attached** — `wacleanenergy.org` still serves
  the old WordPress site. Attaching it is Phase 2B of the migration
  plan and depends on Phase 0.
- Both GitHub and Cloudflare accounts are personal (`DonMarshWorks` /
  `don.m.marsh@gmail.com`); long-term, transfer to coalition-controlled
  accounts is recommended.

## Recent commits

```
f59a25c  News: backfill fourteen real posts from coalition's filing archive
c30abc7  Polish: heading font, footer nav, social card, favicon, lead paragraph
434d9ae  Header: dawn motif (sun + rays) behind nav on every page
8ff3391  home: emissions chart between paragraphs (MDX) + palette retune + dawn sun
fcb6e2d  what-we-do: add partner logo grid
d22d97b  Pages: convert bodies to Markdown, add real content, drop orphans
948079e  Home: pilot body-to-Markdown; fold in pending copy edits
4a98c24  Nav cleanup: sentence case + trim to five items
d70b3a1  Home: broaden tagline scope beyond utilities
46fb755  Home: text refinements + new "Who we are" button and page
df6b116  Update home heading; mark Pages Git integration live
29e2ced  Wire up GitHub remote and Cloudflare Pages deployment
3e8ace6  Initial site rebuild + DNS/email migration plan
```

The three new commits this session (`f59a25c`, `c30abc7`, `434d9ae`)
are local — they need a `git push` to deploy.

## Incoming session options

1. **Execute the WordPress → Cloudflare migration** — the natural next
   step. The plan (`docs/plans/godaddy-migration.md`) is still
   planned-only and blocked on Phase 0 facts the coalition needs to
   supply (WordPress.com DNS zone export, current email-host
   confirmation, registrar admin access, DNSSEC status). Rewriting the
   plan to drop the misleading "GoDaddy" naming and reflect the
   WordPress.com / Automattic reality is itself a pending task that
   probably wants doing first.
2. **Replace remaining placeholder content** — the `/contact` body is
   still a placeholder; mechanical edit to `src/content/pages/contact.md`.
3. **More news posts** — when the coalition produces new filings,
   they can be added to `src/content/news/` following the established
   pattern (kebab-case slug filename, frontmatter with `title`,
   `pubDate`, `description`, optional `tags`; body of 2-sentence
   intro + 3–5 bullet main points + `<a target="_blank"
   rel="noopener">Read the full document (PDF)</a>` link to a PDF in
   `public/news-assets/`).
4. **Open up the preview URL for coalition reviewers** — share
   https://wacleanenergy-org.pages.dev and gather feedback before the
   public cutover.
5. **Transfer GitHub repo + Cloudflare account to coalition control**
   — currently both personal.
