# Content migration — rebuild the site in Astro

## Status

_Implemented in the initial commit (2026-05-19). Stage 3 plan review
rounds 1–2 → Stage 4 implementation → Stage 5 implementation review
(timezone-safe date helper, slug validation pre-filter, RSS feed cap,
Pages-shaped wrangler config, redundant aria-label removed). Quality
gates at commit: lint clean (24 files), 7/7 unit tests, build emits
8 static pages + `/rss.xml` + sitemap. Page copy,
partners/accomplishments data, and the sample news post remain
placeholder pending coalition input._

## Goal

Rebuild `wacleanenergy.org` fresh as an Astro 5 site in this repo:
the coalition's informational pages plus a new news/updates section.
This plan produces the deployable site that the DNS/email migration's
Phase 1 (`docs/plans/dns-email-migration.md`) needs before it can
point the domain at Cloudflare Pages.

## Background / context

- **Current site** (live on WordPress.com): the Washington Clean
  Energy Coalition, an all-volunteer nonprofit advocating for
  Washington's clean-energy transition — focused on Puget Sound Energy
  (PSE) and the WA Utilities & Transportation Commission. Five
  sections: Home, What We Do, Coalition Partners, Accomplishments, and
  a Contact link (an external Jotform). No blog/news.
- **This is a fresh rebuild** — content is not scraped from WordPress.
  Page *copy* is written fresh and must be drafted with / approved by
  the coalition (see Open Questions).
- **Repo scaffolding state:** [`BaseLayout.astro`](../../src/layouts/BaseLayout.astro)
  is a bare HTML shell — no header, nav, or footer.
  [`global.css`](../../src/styles/global.css) has no theme tokens.
  [`index.astro`](../../src/pages/index.astro) is the kit placeholder.
- **Decisions already made** (with the user):
  - **Add a news/updates section** — dated posts, with an RSS feed.
  - **Contact = a published `mailto:` email address.** No contact
    form, no backend. Consequently **the site sends no mail** — this
    resolves Open Question #7 of the GoDaddy migration plan (no
    transactional-email provider, no added SPF/DKIM).
  - **The coalition has existing branding** (logo + colors); those
    assets will be provided (see Open Questions).
- **Kit conventions** (`CLAUDE.md`): Astro 5 file-based routing, pages
  in `src/pages/`, shared code in `src/lib/`, Tailwind v4 CSS-first
  theming in `global.css` under `@theme {}`, TypeScript strict,
  co-located `*.test.ts`.

## Design

### Rendering mode — fully static, no SSR adapter

The site has no dynamic backend, no forms, and no per-request logic.
It is **fully static**: Astro 5's `output` stays at its default
(`static`), so every route is prerendered to HTML at build time —
`getStaticPaths()` for `/news/[slug]` and `/news/[...page]` and the
RSS endpoint all run at build. No route sets `prerender = false`.

Because there are **zero SSR routes**, the plan **removes the
`@astrojs/cloudflare` adapter**: drop `adapter: cloudflare()` (and the
import) from `astro.config.mjs`, and drop the `main`
(`dist/_worker.js/...`) entry from `wrangler.jsonc`, leaving its
`assets` block to serve the static `dist/`. Cloudflare Pages serves
the prerendered HTML directly. This is a deliberate, minor deviation
from the SSR-capable kit default, justified by YAGNI — the adapter
would only add unused build surface. If a real SSR feature is ever
added later, re-add the adapter then.

### Site map / routes

| Route | Source | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Home — mission, PSE-vs-WA energy-mix angle, calls to action |
| `/what-we-do` | `src/pages/what-we-do.astro` | Advocacy activities |
| `/partners` | `src/pages/partners.astro` | Renders the `partners` data collection |
| `/accomplishments` | `src/pages/accomplishments.astro` | Renders the `accomplishments` data collection |
| `/news`, `/news/2` … | `src/pages/news/[...page].astro` | Paginated news index, newest first |
| `/news/[slug]` | `src/pages/news/[slug].astro` | Individual news post |
| `/contact` | `src/pages/contact.astro` | Published `mailto:` address |
| `/rss.xml` | `src/pages/rss.xml.ts` | RSS feed of published news |
| 404 | `src/pages/404.astro` | Not-found page |

### Content architecture (Astro 5 Content Layer)

Collections are defined in **`src/content.config.ts`** (Astro 5
location) with the built-in loaders `glob` / `file` imported from
**`astro/loaders`** and `defineCollection` / `z` from `astro:content`.
Every schema uses **`.strict()`** so a mistyped field (`pubdate`,
`descripton`, …) fails `astro check` and the build instead of being
silently dropped. Strings are non-empty, dates coerced, URLs
validated:

```ts
import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const news = defineCollection({
  // Flat *.md only — nested paths would put slashes in the slug.
  loader: glob({ pattern: "*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string().min(1),
    pubDate: z.coerce.date(),
    description: z.string().min(1),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }).strict(),
});

const partners = defineCollection({
  loader: file("./src/content/partners.yaml"),
  schema: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    logo: z.string().optional(),
    logoAlt: z.string().optional(),
  }).strict().refine((p) => !p.logo || !!p.logoAlt, {
    message: "logoAlt is required when logo is set",
  }),
});

const accomplishments = defineCollection({
  loader: file("./src/content/accomplishments.yaml"),
  schema: z.object({
    id: z.string().min(1),
    date: z.coerce.date(),
    title: z.string().min(1),
    description: z.string().min(1),
    link: z.string().url().optional(),
  }).strict(),
});

export const collections = { news, partners, accomplishments };
```

- **`news`** — Markdown files in a flat directory. The entry `id` (the
  filename without extension, e.g. file `2026-05-pse-testimony.md` →
  id/slug `2026-05-pse-testimony`) **is the public URL slug** — that
  is the URL contract. The slug shape is enforced at build time (see
  Draft handling below); renaming a file changes its URL and needs a
  redirect entry.
- **`partners`**, **`accomplishments`** — data collections, one YAML
  file each, with explicit stable `id` fields. They are kept as
  schema-validated collections (not loose imports) deliberately — the
  schema is what catches a malformed entry at build time. **Sorting is
  done in page code** (accomplishments by `date` descending), not by
  trusting YAML order. A build-time check verifies every referenced
  partner `logo` asset actually exists, so a typo'd path fails the
  build rather than rendering a broken image.

Singleton prose pages (Home, What We Do, Contact) stay as `.astro`
files — they are layout-specific, not list-driven.

### Draft handling — single chokepoint

One helper, `getPublishedNews()` in `src/lib/news.ts`, is the **only**
way `/news`, `/news/[slug]`, and `/rss.xml` read posts — pages must
not call `getCollection("news")` directly. It:

1. calls `getCollection("news")`,
2. drops `draft: true` entries **and** entries with a `pubDate` in the
   future (so an embargoed post committed early does not leak),
3. asserts each entry `id` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` —
   throwing at build time on an unsafe slug,
4. returns the result sorted by `pubDate` descending.

`src/lib/news.test.ts` (Vitest) covers the filter, the future-date
exclusion, the slug assertion, and sort order.

### Layout and components

- **`BaseLayout.astro`** — extend the existing shell: a `<header>`
  (logo + nav) and `<footer>` (contact line, partner acknowledgement,
  copyright), plus a skip-to-content link. Keep its
  `title`/`description` props; add Open Graph / Twitter meta and a
  canonical `<link>`. **Canonical and OG URLs are built from
  `Astro.site`**, not the request host:
  `new URL(Astro.url.pathname, Astro.site)`. Add the RSS
  `<link rel="alternate" type="application/rss+xml">`.
- **`src/components/`** — `Header.astro` (logo + nav), `Footer.astro`,
  `NewsCard.astro` for index listings. Nav lives inside `Header` — no
  separate `Nav.astro` for a small site.
- **Accessibility is a requirement, not polish:** semantic landmarks,
  keyboard-navigable nav with visible focus states, a skip link, and
  navigation that works without JavaScript. Active-route highlighting
  via `Astro.url.pathname`.

### Theme

Brand tokens in `global.css` under `@theme {}`, Tailwind utilities
over inline styles. The coalition has supplied a logo (a teal
Washington-State silhouette with sun/turbine/waves on cream). Palette
**inferred from the logo** — approximate, pending coalition
confirmation of exact values and font choices:

| Token | Hex (approx) | Use |
|---|---|---|
| `--color-brand` | `#3f7d8c` | Teal — primary |
| `--color-brand-dark` | `#184a5d` | Navy — accents, links |
| `--color-ink` | `#54534c` | Warm grey — body text |
| `--color-surface` | `#f3f0e6` | Cream — page background |

The provided logo PNG has the cream background baked in; a
transparent-background version (or the bare WA-state mark) is
preferred for the site header. The logo asset is copied into
`src/assets/` during implementation.

### News section

- **`/news/[...page].astro`** — the index, built with Astro's
  `paginate()` over `getPublishedNews()` so the page size is bounded
  (e.g. 10 posts/page) from day one. The rest parameter puts page 1 at
  `/news` and page 2 at `/news/2`. `NewsCard` renders each summary.
- **`/news/[slug].astro`** — `getStaticPaths()` over
  `getPublishedNews()`, so drafts and future posts get no route;
  renders title, date, and the Markdown body.
- **`/rss.xml.ts`** — uses **`@astrojs/rss`** with `getPublishedNews()`.
  The endpoint reads `site` from its **`context` argument** (`Astro`
  is not available in a `.ts` endpoint) and throws a clear error if it
  is missing. Feed `site` and every item `link` are absolute URLs
  built from that `context.site`. Each item carries title, `pubDate`,
  `description`, **and the full rendered post HTML** in `content` (via
  the collection entry's `render()`), so subscribers get whole posts.

### Contact

`/contact` and the footer publish `info@wacleanenergy.org` as a plain,
accessible `mailto:` link — the address is real text for screen
readers, copy-paste, and no-JS users. No script-based or split-markup
obfuscation: it breaks accessibility and modern scrapers defeat it
anyway. Address harvesting is an accepted, minor cost — Zoho's spam
filtering covers it (this is the tradeoff the user already accepted
when choosing a published address over a form). No form, no API
route, no backend.

### Redirects / SEO

- **Old-URL inventory is a blocking pre-launch prerequisite.** Capture
  the live WordPress site's full path list — including trailing-slash
  variants, page slugs, and any `/category/` or feed URLs — and map
  each to its new route as a 301 in
  [`public/_redirects`](../../public/_redirects).
- **Query-string caveat:** Cloudflare Pages `_redirects` cannot match
  query strings. If the old site used query-based permalinks
  (`?p=123`) or category params, those must be handled with Cloudflare
  **Redirect Rules** (dashboard/API), not `_redirects` — audit for
  this when inventorying old URLs.
- Every page sets a meaningful `<title>`/`<description>`; Open Graph
  tags in the layout. **`@astrojs/sitemap`** generates a sitemap.
- Launch verification includes confirming the redirect set resolves.

### Assets

- Logo, favicon, and imagery: optimized images in `src/assets/`, raw
  files in `public/`. Replace the kit `favicon.svg`. Image
  optimization runs **at build time** (static output) on the build
  machine, so Astro's default Sharp service is fine — no Worker
  runtime image processing.
- The current site's PSE-vs-WA energy-mix visual: recreate, replace,
  or drop — see Open Questions; if kept, an optimized image with
  descriptive alt text.

### Dependencies

- **Add:** `@astrojs/rss` (feed), `@astrojs/sitemap` (sitemap).
- **Remove:** `@astrojs/cloudflare` (no SSR — see Rendering mode).
- No CMS, no UI framework, no other runtime dependencies.

### Tests

Co-located Vitest `*.test.ts` for `src/lib/` logic — at minimum
`getPublishedNews()` (draft + future-date filtering, slug assertion,
sort order). Presentational `.astro` pages are verified by
`astro check` + `npm run build`.

## Open questions

1. **Brand assets** — logo received; colors inferred from it (see
   Theme). Still needed: confirmation of exact brand hex values, any
   preferred fonts, and ideally a transparent-background logo (or the
   bare WA-state mark) for the header.
2. **Old WordPress URL structure** — the live site's full current
   path list (including any query-string permalinks) is a blocking
   prerequisite before launch, for accurate 301 redirects.
3. **Page copy** — who drafts and approves the fresh content for Home,
   What We Do, Partners, Accomplishments, and Contact? Claude can draft
   from the current site's messaging; the coalition owns final wording.
4. **Accomplishments / partners data** — the current entries (the
   2021–2023 regulatory submissions; the partner orgs such as Sierra
   Club and 350 Seattle) need to be supplied as structured data.
5. **Energy-mix visual** — recreate the PSE-vs-WA graphic, replace it,
   or drop it?

## Out of scope

- The DNS, email, and registrar migration — separate plan
  (`docs/plans/dns-email-migration.md`).
- A contact form and any mail-sending backend (decided against —
  contact is a published address).
- A content management system / visual editor — content is managed by
  editing files via Claude.
- Migrating posts or media out of WordPress.com (fresh rebuild).

## Rollback

There is no production rollback step: the existing WordPress site
stays live and authoritative until the GoDaddy migration plan's
Phase 2B repoints the domain at Cloudflare Pages. Until that cutover,
this work is only visible on the `*.pages.dev` preview URL, so an
unsatisfactory build simply is not promoted — it never affects the
live site.

## Sources

- [Content collections · Astro Docs](https://docs.astro.build/en/guides/content-collections/)
- [Content Loader API · Astro Docs](https://docs.astro.build/en/reference/content-loader-reference/)
- [Pagination · Astro Docs](https://docs.astro.build/en/guides/routing/#pagination)
- [`@astrojs/rss` · Astro Docs](https://docs.astro.build/en/recipes/rss/)
- [On-demand rendering / `prerender` · Astro Docs](https://docs.astro.build/en/guides/on-demand-rendering/)
