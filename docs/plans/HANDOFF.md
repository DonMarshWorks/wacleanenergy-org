# Implementation Hand-off

**Last updated:** 2026-06-03 (PSE 2027 ISP response + VS Code F5 debug)

**Outgoing session:** Two unrelated chunks of work.
**(1) PSE 2027 ISP response featured on home.** The May 2026 policy
briefing *A Better Plan for Washington's Energy Future* is now a news
post, linked from a bordered callout between the home-page body copy
and the CTA buttons. The callout is driven by a new reusable
`<HomeFeature>` component (eyebrow / title / body / href / linkText
props), so the next "current focus" swap is a one-line edit on
`index.astro`.
**(2) VS Code F5 debug.** New `.vscode/` config launches the Astro
dev server and Chrome together as a compound; Stop reliably kills
both, including the dev server. The same setup was mirrored to
`~/claude-cf-kit` (the kit, with `CLAUDE.md` updated) and
`~/TwineLine.ai` in parallel commits pushed to their own remotes.

---

## Shipped this session

### In repo (committed in this session)

- **News: PSE 2027 ISP response, featured in home-page callout**
  (`d4f3cf3`). New news post
  `src/content/news/2026-06-pse-2027-isp-response.md` summarising the
  policy briefing in seven bullets (with slide citations to PSE's
  RPAG deck) and linking to
  `public/news-assets/2026-06-pse-2027-isp-response.pdf`. New
  `<HomeFeature>` component in `src/components/HomeFeature.astro` —
  a reusable bordered card with brand-color border, uppercase
  eyebrow, brand-dark title, ink body, and a brand-color "→" link.
  The home page references the new post via the component, placed
  between the `post-body <Content />` and the three CTA buttons.
  Outcome status: pending. PSE's draft ISP is expected in December
  2026.
- **VS Code: add F5 debug config for Astro dev + Chrome**
  (`6f93ad5`). Five files under `.vscode/`: `launch.json`,
  `tasks.json`, `extensions.json`, `cleanup_servers.bat`,
  `wait_for_server.bat`. The compound launches Astro as a Node
  debug session (the "real terminator" that VS Code recognises for
  `postDebugTask`) plus Chrome with a port-poll preLaunchTask.
  `stopAll: true` makes the Stop button terminate both. The `.bat`
  helpers handle port-4321 kill and ready-detect via PowerShell
  invoked through `cmd.exe`, side-stepping Git Bash automation-shell
  quirks.

### Outside repo

- **Same VS Code debug setup added to `~/claude-cf-kit`** (the kit),
  with `CLAUDE.md` updated: mention in "Common commands", an
  optional rename step added to "Setting up a new project from this
  kit", and the `.vscode/` directory noted in the Repo layout block.
  Generic compound label `⭐ Debug site` so kit users don't have to
  rename on fork. Pushed: `660c403..6b989a7` on main.
- **Same VS Code debug setup added to `~/TwineLine.ai`** (also an
  Astro/Cloudflare-Pages project). Replaces the older Chrome-only
  compound that didn't reliably stop the dev server. Pushed:
  `56cdbbb..65ce3b7` on the `preview` branch.

## Quality gates

Lint clean, 7/7 tests passing, `npm run build` emits **22 static
pages** (was 21; the new news post adds one route).
`/sitemap-0.xml` now enumerates 22 routed pages plus 15 PDFs via
the Astro sitemap `customPages` config (was 14 PDFs).

## Cumulative state

### Stack (unchanged from previous session)

- **Domain:** `wacleanenergy.org`, registered at **Cloudflare
  Registrar**, expires 2027-12-18. Lock on, auto-renew on, WHOIS
  privacy on.
- **DNS:** Cloudflare zone, nameservers
  `benedict.ns.cloudflare.com` / `sonia.ns.cloudflare.com`. DNSSEC
  live (DS at PIR; `AD: true` on validating resolvers).
- **Web:** Cloudflare Pages project `wacleanenergy-org`,
  auto-deploys from `main`. Apex + `www` serve the Astro site over
  HTTPS with HSTS. `*.pages.dev` preview URL also remains.
- **Email:** Zoho Mail Lite, single mailbox
  `info@wacleanenergy.org`. SPF is Zoho-only
  (`v=spf1 include:zohomail.com ~all`). DKIM signed by Zoho via
  `zmail._domainkey`. DMARC `p=none` with
  `rua=mailto:info@wacleanenergy.org`.
- **Analytics:** Cloudflare Web Analytics enabled for the Pages
  project; CSP allows the beacon (see `public/_headers`).
- **Search indexing:** Submitted to Google Search Console (Domain
  property, DNS-TXT verified) and Bing Webmaster Tools (URL prefix,
  XML-file verified). Both report sitemap status "Success".
- **Cost (annual):** ~$22 = $10.13 Cloudflare Registrar + $12 Zoho
  Mail Lite.
- **All accounts** (GitHub, Cloudflare, Zoho) personal to Don Marsh
  (`don.m.marsh@gmail.com`) — single-operator stack.

### Developer tooling (new this session)

- **VS Code F5 debug.** Run & Debug → "⭐ Debug WCEC site" launches
  Astro and Chrome together; Chrome attaches with DevTools auto-open
  and source maps mapped back to `src/`. The Stop button terminates
  both via the compound's `stopAll: true`, and a postDebugTask kills
  any leftover on port 4321 as a safety net. The next F5 also
  pre-cleans the port. Chrome's user-data dir at
  `.vscode/chrome-debug-profile/` is gitignored. See
  `.vscode/launch.json` + `tasks.json`.

### Site

- Brand-themed Astro 5 static site: home (with the inline emissions
  chart, the dawn-sun header motif, and now a "what we're working
  on" HomeFeature callout above the CTAs), /who-we-are (chair photo
  + CTA), /what-we-do (normalised partner-logo grid + CTA), /contact
  (placeholder body), /news + paginated index + RSS, 404, sitemap,
  Open Graph + Twitter meta with a real social card.
- **15 real news posts** (Sep 2021 – Jun 2026), each linking to the
  source PDF in `public/news-assets/`. 13 of 15 carry an advocacy
  outcome (`win` / `setback` / `mixed` / `pending`); 7 currently
  pending (including the new 2026-06 ISP response).
- **Reusable `<HomeFeature>` component** for spotlighting current
  work on the home page without restructuring layout.
- Fraunces serif on H1/H2 (self-hosted via Fontsource). Brand
  favicon (teal rounded square with a warm-yellow sun) and matching
  1200×630 OG image generated by `scripts/generate-og.mjs`.
- Strict security headers via `public/_headers`. AA-passing contrast
  on muted text. `aria-label` per-post on the news index's "Read
  more" links. `prefers-reduced-motion` respected.

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
6f93ad5  VS Code: add F5 debug config for Astro dev + Chrome
d4f3cf3  News: PSE 2027 ISP response, featured in home-page callout
2dd086f  Plans: correct overconfident "4.10 closed implicitly" claim
2b0202d  Handoff: record mail-tester 10/10 deliverability result
a1f6110  Handoff: record GSC + Bing setup, both sitemaps Success
7d8bb92  Add Bing Webmaster verification file
2929eb4  Sitemap: include linked /news-assets PDFs
c741541  Plans: close out Phase 4 migration tidies
05fe556  Handoff refresh + close out Phase 4.10 / 4.8
6f5e034  Plans: record Phase 2B / 3 / 4 / 5 completion of the DNS migration
```

(This session's handoff-refresh commit lands on top.)

## Incoming session options

### Watchpoints (date-bound)

- **PSE's draft 2027 ISP — expected December 2026.** When it lands,
  add a news post referencing the draft and update the 2026-06 ISP
  response post's outcome (status `pending` → whatever fits). The
  home-page HomeFeature callout can be retitled to spotlight whatever
  the next current focus is at that point.
- **DMARC tightening (4.5 step 2).** Watch the `info@` mailbox for
  aggregate (`rua`) reports over a 1–2 week window; once Zoho-aligned
  sources are confirmed, step `p=none` → `p=quarantine`; observe
  another 1–2 weeks; then `p=reject`. Optional: Postmark or dmarcian
  for parsed reports.
- **Titan zombie account.** Titan warned (2026-05-24) it would
  auto-assign admin on 2026-06-15 if none is set. Check whether that
  fired, what (if anything) Titan did, and whether the housekeeping
  notices have stopped. If still active, reply to Titan asking them
  to close the orphan and set a Zoho filter on Titan correspondence.

### Content

- **`/contact` body** — replace the placeholder in
  `src/content/pages/contact.md` once the coalition decides what it
  should say.
- **Update outcomes on existing news posts** as results land. Pending
  posts can move to `win` / `setback` / `mixed` with the real outcome
  text and an optional `date`. Currently 7 pending.
- **Add new news posts** as filings happen — established pattern:
  kebab-case slug; frontmatter `title`, `pubDate`, `description`,
  optional `tags`; body of intro paragraph + 5–7 bullet main points
  with source attributions + `<a target="_blank"
  rel="noopener">Read the full document (PDF)</a>` link to a PDF in
  `public/news-assets/`; optional `outcome:` block.
- **Swap the home-page `<HomeFeature>`** when the spotlight item
  changes — one element in `src/pages/index.astro`, five props.

### Post-launch hardening / ops

- **Watch GSC / Bing reports.** No action needed soon — both set up
  and the sitemap was accepted. Worth opening GSC's *Performance*
  and *Indexing > Pages* views after a week or two; same with Bing's
  *Search Performance* and *Site Explorer*. If anything important is
  excluded, GSC's *URL Inspection* tool will say why.
- **Optional DKIM upgrade to 2048-bit.** Zoho default is 1024-bit;
  mail-tester accepts it but a stronger key is best practice.
  Regenerate in Zoho Mail Admin → Domains → DKIM and update the
  `zmail._domainkey` TXT in Cloudflare. ~10 min total.

### Longer-term

- **Transfer GitHub + Cloudflare + Zoho to coalition-controlled
  accounts.** All three currently personal — continuity risk.
- **Designated successor.** Document where the password manager and
  recovery codes live, and who could be granted access in an
  emergency.
