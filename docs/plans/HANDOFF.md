# Implementation Hand-off

**Last updated:** 2026-05-21 (evening)

**Outgoing session:** A planning/docs session — no source code changed.
The DNS/email/registrar migration plan was rewritten from the ground
up. The previous file, `godaddy-migration.md`, was built on a wrong
premise: it assumed the domain was on GoDaddy DNS with GoDaddy-resold
Microsoft 365 email. Public DNS + RDAP lookups this session established
the real stack — registrar is **Automattic Inc.** (WordPress.com's
in-house registrar), DNS authority is **WordPress.com** nameservers,
web hosting is WordPress.com, and `info@` email is on **Titan**
(`mx*.titan.email`, sold through WP.com's "Professional Email"
product). DNSSEC is off; there is no CAA; the Titan DKIM key is
already published. The plan was rewritten as
`docs/plans/dns-email-migration.md` with accurate vocabulary, the
DNSSEC contingency tree collapsed to "off — skip", the email phase
re-sourced from Titan (Zoho lists Titan as a first-class migration
source), a real cost comparison added, and Phase 0 fact-gathering
recorded as essentially complete. The user confirmed the WP.com DNS
dashboard (8 records total — one more than the public view: a
`_domainconnect` TXT) and the email destination decision (Zoho Mail
Lite, $12/yr, chosen over keeping Titan-via-WP.com at $35/yr).
Implementation of the migration itself has still not begun.

---

## Shipped this session

- **`docs/plans/dns-email-migration.md`** — the rewritten migration
  plan, replacing `godaddy-migration.md` (deleted). Same proven
  phased structure (Phase 0 prep → 2A nameserver switch → 2B Pages
  apex → 3 email → 4 verify/cleanup → 5 optional registrar transfer),
  but grounded in verified facts:
  - Real stack documented: Automattic registrar, WordPress.com DNS,
    Titan email. Domain expires 2026-12-18; ICANN 60-day transfer
    lock already expired.
  - DNSSEC confirmed off — every DNSSEC contingency collapsed to a
    one-line "skip"; optional first-time enablement deferred to
    Phase 5.
  - Phase 0 #1 inventory recorded as complete: 8 DNS records in a
    table, including the `_domainconnect` TXT not visible to public
    `dig`.
  - Phase 0 #4 rewritten: WP.com exposes no per-record TTL control
    (records served at a fixed ~1h), so TTLs are lowered in the
    Cloudflare zone after Phase 2A instead of at the source.
  - Email phase re-sourced from Titan; Zoho's admin-console migration
    lists Titan as a named source, so mail history (folders,
    read/unread state, timestamps) migrates cleanly.
  - Cost table added: today $47/yr + WP.com site plan → post-Phase 4
    $24/yr → post-Phase 5 $22/yr.
  - DMARC reality corrected: current policy is `p=none` with no
    `rua`; plan adds a `rua` mailbox in Phase 0 and leaves tightening
    to a Phase 4 follow-on.
- **Cross-references updated** — `README.md` and
  `docs/plans/content-migration.md` now point at the new plan
  filename.
- **`README.md` stack fix** — corrected a stale line that still
  claimed the site uses the Cloudflare SSR adapter; the site is fully
  static (no adapter — see `astro.config.mjs`).

## Quality gates (at this commit)

Docs-only session — no files under `src/` changed. Lint, tests, and
build are unchanged from the previous commit (`f59a25c`): 7/7 tests,
lint clean, build emits 21 static pages.

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

### Migration readiness

- `docs/plans/dns-email-migration.md` is hardened and Phase 0
  fact-gathering is essentially complete. Implementation has **not**
  begun. Remaining Phase 0 inputs before execution: the user's
  low-traffic-window choice, creating the Zoho account, and
  confirming the WP.com Professional Email plan/renewal details.

### Accepted regressions / known limitations

- **/contact body** remains placeholder pending coalition input.
- Brand teal / navy / ink tokens are eyedrop estimates from the logo;
  `--color-surface` was sampled then nudged lighter to `#fcfdf7` with
  the logo recolored to match.
- One news post's `pubDate` is approximate: `2022-02-pse-ceip-recommendations`
  uses `2022-02-15` since the source PDF is undated. Update if the real
  distribution date surfaces.

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
  the old WordPress.com site. Attaching it is Phase 2B of the
  migration plan and depends on Phase 0.
- All accounts (GitHub `DonMarshWorks`, Cloudflare, WordPress.com) are
  Don Marsh's personal accounts (`don.m.marsh@gmail.com`). Don is the
  sole operator; long-term, transfer to coalition-controlled accounts
  is recommended.

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
```

This session's commit (the plan rewrite) lands on top of `f59a25c`.
The earlier handoff commit `0e658fd` and the three feature commits
before it are already pushed to `origin/main`.

## Incoming session options

1. **Execute the WordPress.com → Cloudflare migration** — the natural
   next step. `docs/plans/dns-email-migration.md` is hardened and
   Phase 0 facts are gathered. Before starting: pick low-traffic
   windows for the Phase 2A and Phase 3 cutovers, and set up the
   coalition Zoho account.
2. **Replace remaining placeholder content** — the `/contact` body is
   still a placeholder; mechanical edit to `src/content/pages/contact.md`.
3. **More news posts** — when new filings appear, add to
   `src/content/news/` following the established pattern (kebab-case
   slug filename; frontmatter with `title`, `pubDate`, `description`,
   optional `tags`; body of 2-sentence intro + 3–5 bullet main points
   + `<a target="_blank" rel="noopener">Read the full document
   (PDF)</a>` link to a PDF in `public/news-assets/`).
4. **Open the preview URL for reviewers** — share
   https://wacleanenergy-org.pages.dev and gather feedback before the
   public cutover.
5. **Transfer GitHub repo + Cloudflare account to coalition control**
   — currently both personal.
