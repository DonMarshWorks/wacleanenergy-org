# Implementation Hand-off

**Last updated:** 2026-05-21 (late evening)

**Outgoing session:** Began as a planning/docs session and continued
into live migration execution. First, the DNS/email/registrar
migration plan was rewritten from the mis-premised `godaddy-migration.md`
into `dns-email-migration.md` (committed `c3ca797`). Then **Phase 2A
of the migration was executed**: `wacleanenergy.org` is now a
Cloudflare DNS zone and the nameservers were switched away from
WordPress.com. In parallel, the **Zoho email account was set up**
(Phase 0 #7). The migration is now mid-flight, inside the 24-hour
DNS-propagation hold that precedes Phase 2B and Phase 3. No site- or
mail-facing change has happened yet — the apex still serves the old
WordPress.com site and email still flows through Titan.

---

## Migration state — READ THIS FIRST next session

The migration is **partway through** and time-gated. Current position:

- **Phase 2A — DONE.** DNS authority moved to Cloudflare. The
  `wacleanenergy.org` zone holds all 9 records (DNS-only, verified);
  nameservers are `benedict.ns.cloudflare.com` /
  `sonia.ns.cloudflare.com`, confirmed at the `.org` registry via
  RDAP at 2026-05-21 22:13 UTC; the Cloudflare zone is **Active**.
- **24h hold period — running.** Clears ~**2026-05-22 22:15 UTC**
  (~3:15 PM Pacific, 2026-05-22). Phase 2B and Phase 3 must not start
  before then.
- **Next:** after the hold, run **Phase 2B** (point the apex at
  Cloudflare Pages — the site flips to the new Astro site) and
  **Phase 3** (email cutover to Zoho). Both are interactive — Don
  drives the dashboards, Claude verifies. Step-by-step procedure is
  in `docs/plans/dns-email-migration.md`; the Status section there
  has the execution-progress summary.

### Staged for Phase 3 (Zoho records captured 2026-05-21)

- **MX:** `mx.zoho.com` (priority 10), `mx2.zoho.com` (20),
  `mx3.zoho.com` (50) — replace the two Titan `MX` records.
- **SPF (transitional merged):**
  `v=spf1 include:zohomail.com include:spf.titan.email ~all`
- **DKIM:** selector `zmail` → `TXT` at `zmail._domainkey` (copy the
  exact key from the Zoho console at execution time).
- Zoho account: clean WCEC-only org, admin identity
  `info@wacleanenergy.org`, Mail Lite annual, `info@` mailbox exists.

### Environment quirk to remember

Don's local network transparently intercepts/caches DNS (UDP *and*
TCP), so `Resolve-DnsName`/`dig` from his machine cannot reach
authoritative nameservers directly — results are stale cache. Verify
DNS via **RDAP** (registry state) or **WebFetch to a public DoH
resolver / the live site** instead. This worked fine for Phase 2A and
will for the rest.

## Shipped this session

- **`docs/plans/dns-email-migration.md`** — migration plan rewritten
  from `godaddy-migration.md` (deleted) and grounded in verified
  facts. Committed `c3ca797`. This session also updated its Status
  section with the Phase 2A execution record and staged Phase 3
  values.
- **Phase 2A executed** — Cloudflare zone `wacleanenergy.org`
  created, 9 records replicated DNS-only, preflight-verified;
  nameservers switched at WordPress.com; registry-confirmed; zone
  Active.
- **Zoho account set up** — Mail Lite annual, domain verified,
  `info@` mailbox, recovery email + MFA.
- Cross-references and a stale `README.md` stack line fixed
  (committed `c3ca797`).

## Quality gates

No source code (`src/`) changed this session — all work was docs and
external dashboards. Lint/tests/build unchanged from `f59a25c`:
7/7 tests, lint clean, build emits 21 static pages.

## Cumulative state — the site itself

- Brand-themed static Astro 5 site, fully Markdown-driven prose,
  auto-deploying from `main` to https://wacleanenergy-org.pages.dev.
- Home (emissions chart, lead paragraph, dawn-sun motif),
  /who-we-are, /what-we-do (partner-logo grid), /contact,
  /news (14 real posts, paginated, RSS), 404, sitemap, OG/Twitter
  meta + social card, Fraunces serif headings, brand favicon.

### Accepted regressions / known limitations

- **/contact body** remains placeholder pending coalition input.
- Brand teal / navy / ink tokens are eyedrop estimates from the logo;
  `--color-surface` nudged to `#fcfdf7`.
- `2022-02-pse-ceip-recommendations` `pubDate` is approximate
  (`2022-02-15`) — source PDF undated.

### Pre-existing issues (not introduced this work)

- IDE TypeScript LSP false-positive "unused" hints for Astro
  components used in templates; `astro check` is clean.
- Astro 6.3.7 available; on 5.18.1. No upgrade pressure.

## Deployment

- **GitHub:** https://github.com/DonMarshWorks/wacleanenergy-org (public)
- **Cloudflare Pages project:** `wacleanenergy-org`, production branch
  `main`, served at https://wacleanenergy-org.pages.dev.
- **Deploy mechanism:** auto-deploy on push to `main`.
- **Custom domain:** **not yet attached.** `wacleanenergy.org` still
  serves the old WordPress.com site — that flips in Phase 2B.
- **DNS:** as of this session, `wacleanenergy.org` is a Cloudflare
  zone; DNS is managed in the Cloudflare dashboard, not WordPress.com.
- All accounts (GitHub, Cloudflare, WordPress.com, Zoho) are Don
  Marsh's personal accounts; Don is the sole operator.

## Recent commits

```
c3ca797  Plans: rewrite DNS migration around the real WordPress.com stack
0e658fd  Handoff: refresh for end of 2026-05-21 polish + news session
f59a25c  News: backfill fourteen real posts from coalition's filing archive
c30abc7  Polish: heading font, footer nav, social card, favicon, lead paragraph
434d9ae  Header: dawn motif (sun + rays) behind nav on every page
```

This session's commit (plan + HANDOFF execution update) lands on top
of `c3ca797`. All prior commits are on `origin/main`.

## Incoming session options

1. **Resume the migration — Phase 2B + Phase 3.** The natural next
   step, available once the 24h hold clears (~2026-05-22 22:15 UTC).
   Follow `docs/plans/dns-email-migration.md`. Phase 2B points the
   apex at Pages (site goes live as the Astro build); Phase 3 cuts
   email over to Zoho using the staged records above. Interactive —
   guide Don, verify each step. Then Phase 4 (verify/cleanup) and
   optionally Phase 5 (registrar transfer).
2. **Replace placeholder content** — `/contact` body in
   `src/content/pages/contact.md`.
3. **More news posts** — add to `src/content/news/` following the
   established pattern (kebab-case slug; frontmatter `title`,
   `pubDate`, `description`, optional `tags`; 2-sentence intro +
   3–5 bullets + a `<a target="_blank" rel="noopener">Read the full
   document (PDF)</a>` link to a PDF in `public/news-assets/`).
4. **Transfer GitHub repo + Cloudflare account to coalition control.**
