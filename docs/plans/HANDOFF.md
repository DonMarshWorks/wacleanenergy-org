# Implementation Hand-off

**Last updated:** 2026-05-23 (late session — Phase 4 closeout)

**Outgoing session:** Closed out the remaining Phase 4 migration
tidies in one short Cloudflare-dashboard pass. SPF narrowed to
Zoho-only (4.4), `rua=` reporting address added to DMARC as step 1
of the eventual `p=` tightening (4.5), dead `_domainconnect` TXT
deleted (4.7) along with the orphan `titan1._domainkey` Titan DKIM
record (bonus tidy spotted in the dashboard), and DNSSEC enabled at
Cloudflare with PIR confirming the DS within minutes (4.9). The DNS
migration plan now has nothing material left open — only DMARC step 2
(`p=quarantine`) remains, and that's a ~2-week observation step, not
a session-bounded action.

---

## Shipped this session

### In repo (committed in this session's commit)

- **Plan + handoff doc updates only.** No code changes. The Phase 4
  status block in `docs/plans/dns-email-migration.md` was rewritten
  to "done"; the individual step entries (4.4, 4.5, 4.7, 4.9) carry
  inline `**Done 2026-05-23**` annotations with the specifics
  (record values, DS key tag and digest, etc.).

### Outside repo (Cloudflare zone changes)

All edits via Cloudflare dashboard → wacleanenergy.org → DNS:

- **4.4 SPF narrowed.** Apex `TXT` changed from
  `v=spf1 include:zohomail.com include:spf.titan.email ~all`
  to `v=spf1 include:zohomail.com ~all`. Verified via Cloudflare DoH.
- **4.5 step 1 DMARC `rua=` added.** `_dmarc TXT` now reads
  `v=DMARC1;p=none;sp=none;adkim=r;aspf=r;pct=100;rua=mailto:info@wacleanenergy.org`.
  `p=none` retained. Verified via Cloudflare DoH.
- **4.7 `_domainconnect` TXT deleted.** The WordPress.com carryover
  (`public-api.wordpress.com/rest/v1.3/domain-connect`) is gone.
- **Bonus: `titan1._domainkey` TXT deleted.** Titan's DKIM public
  key, dead since the WordPress.com / Titan account closure. Spotted
  while reviewing the zone for the `_domainconnect` cleanup. Verified
  removed via Cloudflare DoH (NOERROR + empty Answer + zone SOA).
- **4.9 DNSSEC enabled.** Cloudflare signed the zone (DNSKEY records
  published) and pushed the DS to PIR automatically (Cloudflare is
  also the registrar). PIR published the DS within minutes:
  `2371 13 2 674F99ED8B98767A63CF2DAAD36BBE94469999242441ADD2315A1241F8F02A79`
  (key tag 2371, algorithm 13 ECDSAP256SHA256, digest type 2 SHA-256).
  Both Cloudflare and Google DoH now return `AD: true` on queries to
  the zone, confirming the chain of trust validates end-to-end.

### Notes on stale DoH responses observed during the session

- The pre-edit `_domainconnect` lookup returned a value
  (`api.cloudflare.com/client/v4/dns/domainconnect`) that didn't
  match what the dashboard showed (`public-api.wordpress.com/...`) —
  Don checked the dashboard and confirmed only the WordPress.com
  record existed. The DoH answer was an upstream-cached entry from
  an earlier zone state. The `_domainconnect` TXT continued to
  resolve in DoH even after deletion for the duration of its 3600s
  TTL — expected, not a problem.
- All TXT records that were edited (SPF, DMARC) had 300s TTL and
  reflected the new value in DoH within ~1 minute of the dashboard
  save.

## Quality gates

No code touched; lint / test / build state unchanged from previous
session (lint clean, 7/7 tests passing, build emits 21 static pages).

## Cumulative state

### Stack (post-migration, post-tidy)

- **Domain:** `wacleanenergy.org`, registered at **Cloudflare
  Registrar**, expires 2027-12-18. Lock on, auto-renew on, WHOIS
  privacy on.
- **DNS:** Cloudflare zone, nameservers
  `benedict.ns.cloudflare.com` / `sonia.ns.cloudflare.com`.
  **DNSSEC live** (DS at PIR; `AD: true` on validating resolvers).
- **Web:** Cloudflare Pages project `wacleanenergy-org`,
  auto-deploys from `main`. Apex + `www` serve the Astro site over
  HTTPS with HSTS. `*.pages.dev` preview URL also remains.
- **Email:** Zoho Mail Lite, single mailbox
  `info@wacleanenergy.org`. SPF is now Zoho-only
  (`v=spf1 include:zohomail.com ~all`). DKIM signed by Zoho via
  `zmail._domainkey`. DMARC `p=none` with
  `rua=mailto:info@wacleanenergy.org`.
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
05fe556  Handoff refresh + close out Phase 4.10 / 4.8
6f5e034  Plans: record Phase 2B / 3 / 4 / 5 completion of the DNS migration
5965f9f  Widen CSP to allow Cloudflare Web Analytics beacon
ec989c8  Add security headers and fix accessibility issues
7a381f4  News: add advocacy-outcome tracking to posts
ef293aa  Footer: drop the "all-volunteer nonprofit" descriptor
d34d620  Plans: record Phase 2A completion of the DNS migration
c3ca797  Plans: rewrite DNS migration around the real WordPress.com stack
0e658fd  Handoff: refresh for end of 2026-05-21 polish + news session
f59a25c  News: backfill fourteen real posts from coalition's filing archive
```

(This session's tidy-closeout commit lands on top.)

## Incoming session options

The migration is now fully done — no Phase 4 items remain except the
multi-week DMARC observation. Remaining items are small tidies,
post-launch hardening, and ongoing content work.

### Migration follow-on (one item left, week-scale)

- **4.5 step 2 — Tighten DMARC.** Watch the `info@` mailbox for
  aggregate (`rua`) reports over the next 1–2 weeks. Reports are
  XML, typically a small daily volume from large mailbox providers
  (Google, Microsoft, Yahoo). Once all observed sending sources are
  Zoho-aligned with no surprises, step `p=none` → `p=quarantine`;
  observe another 1–2 weeks; then `p=reject`. Optionally set up a
  free DMARC parsing service (Postmark, dmarcian) if the raw XML is
  unpleasant to skim.

### Post-launch hardening / ops

- **Google Search Console + Bing Webmaster.** Verify ownership (DNS
  TXT or HTML file in `public/`), submit `/sitemap-index.xml`.
  Highest-leverage SEO step now that the live site is the new Astro
  site.
- **Email deliverability test.** Send from `info@wacleanenergy.org`
  to mail-tester.com (or similar). Tighten what the score flags.
  Now that SPF is Zoho-only and DNSSEC is on, the score should be
  cleaner than it would have been a session ago.

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
