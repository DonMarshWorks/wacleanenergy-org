# Implementation Hand-off

**Last updated:** 2026-05-23

**Outgoing session:** The migration is now fully complete and a
substantial session of site-side polish landed alongside.
Migration-side: Phase 5 (registrar transfer to Cloudflare) executed
this session; HSTS enabled at the Cloudflare zone level; Cloudflare
Web Analytics enabled for the Pages project (CSP pre-widened to
permit the beacon); WordPress.com account itself deleted, closing
out Phase 4.10 implicitly and ending the WordPress.com chapter
entirely. Site-side: an optional advocacy `outcome` field was added
to the news collection (status badge on the index card, colored
callout on the post page) and 12 of 14 posts now carry a real
outcome. Footer copyright simplified ("all-volunteer nonprofit"
dropped — the coalition isn't a registered 501(c)(3)). A
`public/_headers` file with security headers was added and an
accessibility pass fixed contrast, ambiguous link text, and
reduced-motion handling.

---

## Shipped this session

### In repo (committed)

- **News: advocacy-outcome tracking** (`7a381f4`). Optional
  frontmatter `outcome` block with `status: win | setback | mixed |
  pending`, `text`, optional `date`. Shared `Outcome.astro` component
  renders a status badge + one-line summary on the index card and a
  bordered colored callout on the post page. Two new theme tokens
  (`--color-success` green, `--color-pending` steel blue) added to
  `global.css`. The 12 posts with concluded results carry an
  outcome; 2 had the block deleted (no result to report).
- **Footer: drop "all-volunteer nonprofit"** (`ef293aa`).
- **Security headers + accessibility** (`ec989c8`).
  `public/_headers` adds CSP / X-Frame-Options DENY / nosniff /
  Referrer-Policy / Permissions-Policy. Contrast: nine
  `text-ink/{60,70,75}` muted-text spots → `text-ink/85` (now ≥5:1
  on cream, passes AA). Per-post `aria-label` on news "Read more"
  links to disambiguate. `prefers-reduced-motion` now disables
  `scroll-behavior: smooth`.
- **CSP widened for Cloudflare Web Analytics** (`5965f9f`). Added
  `static.cloudflareinsights.com` to `script-src` and a
  `connect-src 'self' cloudflareinsights.com` directive.
- **Migration plan status update** (`6f5e034`, plus this commit's
  Phase 4 tidy). Records Phase 2B / 3 / 4 / 5 completion.
- **Handoff refresh** (this commit).

### Outside repo (dashboards / external)

- **Phase 5 — registrar transferred.** `wacleanenergy.org` moved
  from Automattic Inc. (IANA 1531) to Cloudflare, Inc. (IANA 1910)
  at 2026-05-23 23:13 UTC. Confirmed via RDAP at the `.org`
  registry. Expiration extended to 2027-12-18 as part of the
  transfer. ICANN 60-day post-transfer lock runs until ~2026-07-22;
  Cloudflare's `clientTransferProhibited` registrar lock applied
  automatically. Auth/EPP code discarded.
- **HSTS** enabled at the Cloudflare zone level (SSL/TLS > Edge
  Certificates). Max-age 6 months, no `includeSubDomains`, no
  preload — safe starting posture.
- **Cloudflare Web Analytics** enabled for the Pages project.
- **WordPress.com account deleted.** Closes out Phase 4.10
  (Professional Email cancellation); also makes Phase 4.8 (delta
  migration from Titan) moot.

## Quality gates

Lint clean, 7/7 tests passing, `npm run build` emits 21 static
pages (home + three inner pages + contact + 404 + `/rss.xml` +
sitemap + 14 news posts + a 2-page paginated `/news` index).

## Cumulative state

### Stack (post-migration)

- **Domain:** `wacleanenergy.org`, registered at **Cloudflare
  Registrar**, expires 2027-12-18. Lock on, auto-renew on, WHOIS
  privacy on.
- **DNS:** Cloudflare zone, nameservers
  `benedict.ns.cloudflare.com` / `sonia.ns.cloudflare.com`.
- **Web:** Cloudflare Pages project `wacleanenergy-org`,
  auto-deploys from `main`. Apex + `www` serve the new Astro site
  over HTTPS with HSTS. `*.pages.dev` preview URL also remains.
- **Email:** Zoho Mail Lite, single mailbox
  `info@wacleanenergy.org`. SPF currently the transitional merged
  record (Zoho + Titan); narrowing to Zoho-only is a pending tidy
  but no longer urgent — Titan can't send anyway, account is gone.
  DKIM signed by Zoho. DMARC `p=none`.
- **Analytics:** Cloudflare Web Analytics enabled for the Pages
  project; CSP allows the beacon (see `public/_headers`).
- **Cost (annual):** ~$22 = $10.13 Cloudflare Registrar +
  $12 Zoho Mail Lite.
- **All accounts** (GitHub, Cloudflare, Zoho) currently personal
  to Don Marsh (`don.m.marsh@gmail.com`) — single-operator stack.

### Site

- Brand-themed Astro 5 static site: home (with the inline emissions
  chart and the dawn-sun header motif), /who-we-are (chair photo +
  CTA), /what-we-do (normalised partner-logo grid + CTA), /contact
  (placeholder body), /news + paginated index + RSS, 404, sitemap,
  Open Graph + Twitter meta with a real social card.
- 14 real news posts from the coalition's filing archive
  (Sep 2021 – May 2026), each linking to the source PDF in
  `public/news-assets/`. 12 of 14 carry an advocacy outcome
  (`win` / `setback` / `mixed` / `pending`); the pattern handles
  future filings and future-landing outcomes.
- Fraunces serif on H1/H2 (self-hosted via Fontsource). Brand
  favicon (teal rounded square with a warm-yellow sun) and matching
  1200×630 OG image generated by `scripts/generate-og.mjs`.
- Strict security headers via `public/_headers`. AA-passing
  contrast on muted text. `aria-label` per-post on the news index's
  "Read more" links. `prefers-reduced-motion` respected.

### Accepted regressions / known limitations

- **`/contact` body** remains a placeholder pending coalition input.
- `2022-02-pse-ceip-recommendations` `pubDate` is approximate
  (`2022-02-15`) — source PDF undated.
- Brand teal / navy / ink tokens are eyedrop estimates from the
  logo; `--color-surface` nudged to `#fcfdf7`.

### Pre-existing issues (not introduced this work)

- IDE TypeScript LSP false-positive "unused" hints for Astro
  components used in templates; `astro check` is clean.
- Astro 6.3.7 is available; we're on 5.18.1. No upgrade pressure.

## Recent commits

```
6f5e034  Plans: record Phase 2B / 3 / 4 / 5 completion of the DNS migration
5965f9f  Widen CSP to allow Cloudflare Web Analytics beacon
ec989c8  Add security headers and fix accessibility issues
7a381f4  News: add advocacy-outcome tracking to posts
ef293aa  Footer: drop the "all-volunteer nonprofit" descriptor
d34d620  Plans: record Phase 2A completion of the DNS migration
c3ca797  Plans: rewrite DNS migration around the real WordPress.com stack
0e658fd  Handoff: refresh for end of 2026-05-21 polish + news session
f59a25c  News: backfill fourteen real posts from coalition's filing archive
c30abc7  Polish: heading font, footer nav, social card, favicon, lead paragraph
```

(This session's handoff + plan tidy commit lands on top.)

## Incoming session options

The migration and the major site work are both done. Remaining items
are small tidies and ongoing content work.

### Migration follow-on tidies (small, do whenever)

- **4.4 Narrow SPF to Zoho-only.** Replace
  `v=spf1 include:zohomail.com include:spf.titan.email ~all` with
  `v=spf1 include:zohomail.com ~all`. Safe to do now (Titan is
  gone).
- **4.5 Tighten DMARC.** Currently `p=none`. If a `rua=` mailbox is
  added and reports come back clean, step to `p=quarantine`, later
  `p=reject`.
- **4.7 Drop dead `_domainconnect` `TXT`** from the Cloudflare
  zone — carried over verbatim from WordPress.com, inert now.
- **4.9 Enable DNSSEC at Cloudflare.** Deferred during the Phase 5
  transfer window. One-click in the Cloudflare DNS panel now that
  Cloudflare controls DNS *and* registrar; `DS` is published to PIR
  automatically.

### Post-launch hardening / ops

- **Google Search Console + Bing Webmaster.** Verify ownership (DNS
  TXT or HTML file in `public/`), submit `/sitemap-index.xml`.
  Highest-leverage SEO step now that the live site is the new Astro
  site.
- **Email deliverability test.** Send from `info@wacleanenergy.org`
  to mail-tester.com (or similar). Tighten what the score flags.

### Content

- **`/contact` body** — replace the placeholder in
  `src/content/pages/contact.md` once the coalition decides what it
  should say.
- **Set outcomes on existing news posts** as results land — change
  `status: pending` → `win` / `setback` / `mixed`, write the real
  outcome text, optionally add `date:`. Six posts are currently
  `pending`.
- **Add new news posts** as filings happen — established pattern:
  kebab-case slug; frontmatter `title`, `pubDate`, `description`,
  optional `tags`; body of 2-sentence intro + 3–5 bullet main
  points + `<a target="_blank" rel="noopener">Read the full
  document (PDF)</a>` link to a PDF in `public/news-assets/`;
  optional `outcome:` block.

### Longer-term

- **Transfer GitHub + Cloudflare + Zoho to coalition-controlled
  accounts.** All three currently personal — continuity risk.
- **Designated successor.** Document where the password manager
  and recovery codes live, and who could be granted access in an
  emergency.
