# GoDaddy → Cloudflare migration

## Status

_Plan written 2026-05-19, hardened through 4 rounds of Stage 3
adversarial review (final email design = Zoho Mail Lite; Pages SSL
flow corrected; DMARC kept enforced; SPF sequenced via a transitional
merged record; the unsafe same-address forward removed). One open
decision (DNSSEC) pending user signoff, contingent on Phase 0
findings. **Implementation not yet started** — blocked on Phase 0
facts only the coalition can supply (GoDaddy DNS zone export, current
email host, DNSSEC status). Plan included in the initial commit
(2026-05-19)._

## Goal

Move `wacleanenergy.org` off GoDaddy. Three separable changes:

1. **DNS migration** — make the domain a Cloudflare zone, then serve
   the new Astro site from Cloudflare Pages on the apex (mandatory).
2. **Email migration** — move `info@wacleanenergy.org` off GoDaddy's
   resold mail to **Zoho Mail Lite**, a real hosted mailbox.
3. **Registrar transfer** — move domain registration to Cloudflare
   Registrar (optional, deferred to the final phase).

Building the new site's content is a **separate plan**
(`docs/plans/content-migration.md`, not yet written); this plan only
requires that a deployable site exists to point the domain at.

## Background / context

- The site is being rebuilt fresh as Astro 5 on Cloudflare Pages (this
  repo, `wacleanenergy-org`). The old site is on WordPress.com; content
  is **not** scraped — it is a fresh rebuild.
- `wacleanenergy.org` is registered at GoDaddy; DNS is presumed to be
  GoDaddy's nameservers. **Unverified — see Phase 0.**
- Cloudflare Pages can only serve an **apex** domain if that domain is
  a Cloudflare zone. So the DNS migration is a hard prerequisite.
- `info@wacleanenergy.org` is a live, in-use address that **must keep
  working** — send and receive — through the transition.
- The coalition is an **informal group, not a registered 501(c)(3)**.
  The chosen email path is **Zoho Mail Lite** (~$1/user/month,
  ~$12/year for the single `info@` mailbox):
  - A **real hosted mailbox** — inbound mail is *delivered*, not
    forwarded, and outbound is sent and DKIM-signed by Zoho for
    `wacleanenergy.org` natively.
  - Mail Lite (vs. the free tier) adds **IMAP/POP**, so `info@` can
    optionally also be read/sent from Gmail / Apple Mail / Outlook;
    the mailbox of record is still Zoho.
- **Email-auth ownership model:** `MX` → Zoho; outbound DKIM → Zoho's
  signing key; SPF → Zoho's include only; DMARC → a policy record this
  domain owns. No third-party relay.
- The Zoho account is **coalition-controlled** — the Zoho admin login
  is owned by the coalition, with 2FA, documented recovery, and a
  second authorized maintainer.
- **Downtime posture:** the migration targets zero web and zero email
  downtime. The one scoped exception is DNSSEC: if DNSSEC is currently
  enabled, a bounded validation-failure window for validating
  resolvers is possible — this requires explicit user signoff (see
  Open Questions) and is only relevant if Phase 0 finds DNSSEC on.

## Design

Phased so each phase is independently verifiable and reversible. Three
deliberate decouplings reduce blast radius:

- **Phase 2A (nameserver switch) is separate from Phase 2B (point the
  apex at Pages).** 2A moves DNS authority to Cloudflare with every
  record — including the apex and the existing GoDaddy `MX` — still
  pointing where it does today; nothing visitor- or mail-facing
  changes. Only 2B repoints the site; only Phase 3 repoints mail.
- **The email-provider switch (Phase 3) is separate from the
  nameserver switch.**
- **The registrar transfer (Phase 5) is last** and touches neither DNS
  nor mail.

### Phase 0 — Preparation (no production changes)

Record findings by appending to this doc. Store secrets (original
nameservers, EPP code, recovery codes) in a password manager — never
in this file or plaintext notes.

1. **Authoritative DNS inventory — hard gate.** Export the full zone
   from the GoDaddy DNS panel. This is the source of truth and a
   **hard gate before Phase 2A**: public `dig`/`nslookup` lookups only
   confirm records you already know to query and **cannot enumerate**
   a zone, so they cannot substitute for the export. The user has
   GoDaddy admin access (#9), so the export is available. Record every
   record and its **TTL**: `A`/`AAAA`, `CNAME`, `MX`, all `TXT` (SPF,
   verifications), `_dmarc`, DKIM selectors, `SRV`, `CAA`, `NS`.
2. **CAA check.** If `CAA` records exist, they must permit the CAs
   Cloudflare uses to issue Pages/Universal SSL certificates
   (currently Google Trust Services, Let's Encrypt, and SSL.com — add
   `issue` entries for each, e.g. `pki.goog`, `letsencrypt.org`,
   `ssl.com`) or be removed. A `CAA` that omits them blocks
   certificate issuance in Phase 2B.
3. **DMARC check.** Read the current `_dmarc` `TXT`: note the policy
   (`p=`) and whether it has a working `rua=` aggregate-report
   address. If there is no `rua`, add one (a mailbox you can read) so
   the Phase 4 reports gate is real.
4. **Lower TTLs.** At least 24–72h before the Phase 2A cutover, lower
   the TTL on all records (`MX`, `A`/`AAAA`, `CNAME`, `TXT`, `_dmarc`)
   to 300s at GoDaddy. This does **not** lower the parent `.org`
   delegation `NS` TTL — query and record it directly
   (`dig +noall +authority wacleanenergy.org NS @<a-.org-tld-ns>`);
   it governs Phase 2A rollback timing. Restore normal TTLs after
   Phase 4.
5. **DNSSEC status.** Run `dig wacleanenergy.org DS` — a `DS` record
   at the registry means DNSSEC is **on**. **If DNSSEC is not enabled,
   skip every DNSSEC step in this plan** (Phase 2A #3, Phase 4 #7) —
   the domain is already unsigned and nothing changes. If it *is*
   enabled, resolve the DNSSEC decision in Open Questions #1 before
   Phase 2A and note the `DS` TTL.
6. **Current email hosting for `info@`** — likely GoDaddy email
   (resold Microsoft 365). Confirm provider, plan/cost, renewal date,
   and whether `info@` is a real mailbox with history or a forwarder.
   Confirm which Zoho migration path matches the source (Zoho's
   admin-console migration supports Microsoft 365 / modern-auth
   sources — verify the exact mode against the confirmed provider).
7. **Set up Zoho.** Create a **coalition-owned** Zoho account,
   subscribe to **Mail Lite**, add `wacleanenergy.org`, complete
   Zoho's domain-ownership verification (a `TXT`/`CNAME` record — can
   be added at GoDaddy DNS now; it does not affect mail), and create
   the `info@wacleanenergy.org` mailbox. Do **not** change `MX` yet.
8. **Account security.** Enable 2FA on **all** accounts — GoDaddy,
   Cloudflare, Zoho — store recovery codes in the password manager,
   and document a second authorized maintainer for the Zoho and
   Cloudflare accounts.
9. **GoDaddy account access** — confirm admin rights to export DNS,
   edit DNS, manage DNSSEC, change nameservers, set mailbox
   forwarding, cancel the email subscription, and (Phase 5) unlock the
   domain + pull the auth code.

### Phase 1 — Build and deploy the site (no DNS impact)

Independent of DNS; runs in parallel with Phase 0.

1. Build site content per `docs/plans/content-migration.md` (separate
   effort — out of scope here beyond producing a deployable build).
2. Create the Cloudflare Pages project `wacleanenergy-org` and deploy
   via `npm run deploy`. Confirm the site is correct at the
   `*.pages.dev` URL.

**Gate:** the site works on `pages.dev` before Phase 2B.

### Phase 2A — Move DNS authority to Cloudflare (no service change)

Every record is replicated **exactly as it is today**, including the
apex still pointing at WordPress and the existing GoDaddy `MX`.

1. In Cloudflare, **add `wacleanenergy.org` as a zone** ("Onboard a
   domain"); let it auto-scan.
2. **Reconcile against the Phase 0 #1 export, record by record.**
   Manually add anything auto-scan missed: `MX`, SPF/DKIM/DMARC `TXT`,
   `CAA`, `SRV`, the Zoho verification record, and any third-party
   verification `TXT`. All records keep their current targets; set
   everything **DNS-only** (grey cloud). Then **diff the Cloudflare
   zone against the export** field by field and confirm record counts
   match — this parity check is a gate before step 4.
3. **DNSSEC de-provision** — only if Phase 0 #5 found DNSSEC enabled
   *and* Open Questions #1 is resolved. Disable DNSSEC at GoDaddy as
   its own step, in a low-traffic window. **Gate before the
   nameserver switch (step 5):** after the registrar removes the `DS`
   record, wait at least the recorded parent `DS` TTL (Phase 0 #5)
   plus a safety margin — that TTL, not a fixed guess, governs when
   validating resolvers stop expecting signed answers. A
   `dig wacleanenergy.org DS +trace` check is advisory confirmation
   only: it shows the authoritative parent answer now, not that every
   resolver has expired its cached `DS`. (If DNSSEC is off, skip this
   step entirely.)
4. **Preflight against Cloudflare's nameservers.** Before changing
   delegation, query each assigned Cloudflare nameserver directly for
   **every record in the Phase 0 #1 export** and confirm answers
   match — apex `A`/`AAAA`, `www` `CNAME`, `MX`, apex `TXT`/SPF, every
   DKIM selector, `_dmarc`, `CAA`, `SRV`, and every verification
   `TXT`:
   ```
   dig @<cloudflare-ns> <name> <type>   # for each record in the export
   ```
5. In GoDaddy, **replace the nameservers** with Cloudflare's two
   assigned nameservers (copy exactly). **Record the originals first.**
6. Wait for Cloudflare to report the zone **Active** (minutes–24h).
7. **Verify:** the WordPress site still loads on `wacleanenergy.org`
   + `www`; a test email to `info@` still arrives at GoDaddy.
8. **Hold period.** Wait at least the recorded parent `NS` TTL
   (Phase 0 #4) before Phase 2B/3, so resolvers worldwide use the
   Cloudflare delegation. A Phase 2A rollback is governed by that
   parent TTL — it is not a minutes-level operation; the real safety
   here is that records were copied verbatim, so the zone is
   functionally equivalent regardless of which nameservers a resolver
   uses.

### Phase 2B — Point the site at Cloudflare Pages

Only after Phase 2A's hold period, and Phase 1's gate is green.

1. Confirm the `CAA` records (Phase 0 #2) permit Cloudflare's CAs, or
   are absent — otherwise certificate issuance in step 2 will stall.
2. The zone still holds the old apex/`www` records pointing at
   WordPress (copied in Phase 2A). Record their values, then in the
   Cloudflare **Pages project → custom domains** add
   `wacleanenergy.org` and `www.wacleanenergy.org`. Because the zone
   is on the same Cloudflare account, Pages **creates the required
   proxied DNS records and provisions the SSL certificate as part of
   activation**; where a new Pages record conflicts with an old
   WordPress apex/`www` record, let the Pages workflow replace it (or
   delete only that conflicting record immediately before adding the
   custom domain if Pages does not). Do not otherwise pre-create or
   hand-toggle these records. The custom domain shows "Active" once
   the certificate is issued.
3. Confirm the live apex/`www` records now resolve to Pages, and that
   both hostnames load the **new** site over HTTPS with a valid
   certificate, before announcing the cutover.

**Rollback:** in the Pages project, remove the custom domains; then in
Cloudflare DNS recreate the apex/`www` records pointing at the
WordPress targets (DNS-only). With 300s record TTLs this is fast and
needs no nameserver change.

### Phase 3 — Email migration to Zoho

Only after Phase 2A's hold period. Zoho is set up and the domain
verified (Phase 0 #7).

1. **Publish Zoho's auth records** (no inbound change yet):
   - **DKIM:** add the DKIM selector `TXT` Zoho provides; enable DKIM
     signing in the Zoho console.
   - **SPF — transitional merged record.** There must be exactly
     **one** `v=spf1` `TXT` at the apex. During Phase 3, publish a
     record authorizing **both** the current sender(s) and Zoho —
     `v=spf1 <existing-includes> include:<zoho-spf-include> -all` —
     so mail still sent through GoDaddy/M365 during the cutover keeps
     passing SPF under the enforced DMARC policy. (Narrowing to
     Zoho-only happens in Phase 4, after the operational cutover.)
     Validate with an SPF checker; confirm the DNS-lookup count is
     ≤10. Record the old SPF value for rollback.
2. **Verify outbound alignment before touching `MX`.** Send a test
   message from the Zoho `info@` mailbox to an outside account and
   confirm **SPF and DKIM pass and align to `wacleanenergy.org`** in
   the headers. **DMARC stays at its current enforced policy** — it is
   not downgraded; correct Zoho SPF/DKIM means enforcement will not
   break. (Lower the `_dmarc` TTL during the window so the policy
   could be adjusted quickly if a problem surfaces.)
3. **Initial mail migration.** Use Zoho's admin-console migration tool
   (mode per Phase 0 #6) to copy the existing `info@` mailbox into the
   Zoho mailbox.
4. **Inbound cutover.** In Cloudflare DNS, **replace the GoDaddy `MX`
   records with Zoho's `MX` records**; record the original GoDaddy
   `MX` values. Mail delivered to GoDaddy during `MX` propagation
   stays in the GoDaddy mailbox — do **not** attempt to forward it:
   forwarding `info@` to the same address at a still-authoritative
   GoDaddy/M365 mailbox loops or delivers locally rather than routing
   to Zoho. Instead, keep the GoDaddy mailbox monitored through the
   short (300s-TTL) propagation tail; the Phase 4 delta migration
   sweeps anything that landed there.
5. **Operational cutover.** Notify all maintainers to begin using the
   Zoho mailbox (webmail or an IMAP client) and to treat the GoDaddy
   mailbox as **read-only** from this point — no sending or filing in
   the old mailbox — so mailbox state has a single source of truth.

### Phase 4 — Verification, DNSSEC, cleanup

1. `wacleanenergy.org` + `www` load the new site over HTTPS (valid
   cert, no warnings).
2. **Receive:** send test mail to `info@wacleanenergy.org` from
   several outside providers; confirm each reaches the Zoho mailbox,
   not spam.
3. **Send:** send from `info@` (Zoho) to an outside account; confirm
   delivery, not spam, and SPF + DKIM pass aligned to the domain.
4. **Narrow SPF to Zoho-only.** Once the operational cutover (Phase 3
   #5) is confirmed — no maintainer or system still sends through
   GoDaddy/M365 — replace the transitional merged SPF record with the
   Zoho-only record `v=spf1 include:<zoho-spf-include> -all`.
5. The direct send/receive tests in #2–3 are the cutover gate. DMARC
   aggregate reports (Phase 0 #3 `rua`) are **confirmatory only** —
   review them as they arrive over the following days, but do not
   block cleanup on them, since not every receiver emits reports.
6. Spot-check other DNS-dependent services (forms, verification `TXT`).
7. **Final delta migration:** ~48h after the `MX` cutover, re-run
   Zoho's migration tool to catch mail delivered to GoDaddy during
   propagation; confirm the GoDaddy mailbox holds nothing newer.
8. **Re-enable DNSSEC** — only if it was on before (Phase 0 #5) *and*
   Open Questions #1 chose to restore it pre-transfer. Enable DNSSEC
   for the zone in Cloudflare and add the generated `DS` record at
   GoDaddy's DNSSEC panel. (If deferred to Phase 5, note it there.)
9. **Cancel GoDaddy email** — only now. Restore normal TTLs
   (Phase 0 #4).
10. Monitor ~24–48h before Phase 5.

### Phase 5 — Registrar transfer (optional, deferred)

Only after Phase 4 is clean. While GoDaddy remains registrar, confirm
**auto-renew is on** and registrant contacts are current so the domain
cannot lapse. To transfer: at GoDaddy disable Domain Privacy and
Domain Protection, unlock the domain, obtain the **authorization (EPP)
code** (store in the password manager; discard it once the transfer
completes — it is a long-lived credential). **If the transfer is
aborted or delayed, re-lock the domain immediately.** Then in Cloudflare →
Registrar → Transfer domains: enter the auth code, approve the
Form-of-Authorization email, confirm GoDaddy's release email.
Completes in up to ~10 days, adds a year to the registration.
**Blocked** by an ICANN 60-day lock if the domain was
registered/transferred recently (check Phase 0). After transfer,
confirm WHOIS privacy and auto-renew are on in Cloudflare. If DNSSEC
re-enablement was deferred here, do it now (one click once Cloudflare
controls both DNS and registrar).

## Open questions

1. **DNSSEC (decision needed only if Phase 0 #5 finds it enabled).**
   If the domain currently uses DNSSEC, choose: **(a)** accept a
   bounded validation-failure window during the Phase 2A cutover and
   re-enable DNSSEC in Phase 4, or **(b)** leave the domain unsigned
   until the Phase 5 registrar transfer, when re-enabling is
   one-click. A zero-gap multi-signer rollover is judged
   disproportionate for this site and is not offered. Requires user
   signoff. If DNSSEC is off, this question is moot.
2. **Where exactly does `info@` mail go today**, is it a real mailbox
   with history, and what migration mode does Zoho need? (Phase 0 #6)
3. Confirm **registrar transfer deferral to Phase 5** is acceptable.
4. Who holds GoDaddy admin credentials, and are they available for the
   cutover window? (Phase 0 #9)
5. Who is the **second authorized maintainer** for the Zoho and
   Cloudflare accounts? (Phase 0 #8)
6. Preferred low-traffic windows for the Phase 2A cutover (and the
   DNSSEC-disable step, if applicable)?
7. **Does the new Astro site send mail** (e.g. a contact form)?
   Cloudflare Pages cannot send mail natively. If the site sends
   mail, the chosen provider's SPF/DKIM records must be added to the
   Cloudflare zone and merged into the apex SPF record (Phase 3 #1 /
   Phase 4 #4 must then keep that provider's include, not just
   Zoho's). This is decided in the content-migration plan — carry the
   dependency there.

## Out of scope

- Building the site pages/content — separate plan
  (`docs/plans/content-migration.md`).
- Migrating content out of WordPress.com (fresh rebuild — no scrape).
- Bulk/newsletter email beyond the single `info@` mailbox.
- Zero-gap (multi-signer) DNSSEC continuity across the provider change.
- MTA-STS / TLS-RPT and other mail-transport hardening beyond SPF,
  DKIM, and DMARC.

## Rollback plan

- **Phases 0–1:** nothing live changed.
- **Phase 2A, before the nameserver switch:** delete the Cloudflare
  zone; GoDaddy DNS is still authoritative.
- **Phase 2A, after the nameserver switch:** revert nameservers at
  GoDaddy to the recorded originals — governed by the parent `NS`
  TTL, so hours not minutes. Records were copied verbatim, so
  resolution stays equivalent meanwhile; that equivalence is the
  safety mechanism, not rollback speed.
- **Phase 2B:** remove the custom domains from the Pages project, then
  recreate apex/`www` pointing at the WordPress targets (DNS-only) —
  fast (300s TTL), no nameserver change.
- **Phase 3 (email):** the GoDaddy mailbox stays active (read-only)
  until Phase 4, so a rollback target exists. To roll back, restore
  the recorded GoDaddy `MX` and SPF values; keep the Zoho mailbox in
  place until GoDaddy `MX` has repropagated. Note two accepted
  degradations: (a) mail received into Zoho during the live window is
  not in the GoDaddy mailbox — Zoho is the source of truth for that
  mail and a reverse export would be needed; (b) reverting SPF to
  Zoho-only's predecessor while the WordPress site is also reverted is
  fine, but reverting *only* email after Phase 3 leaves any WordPress
  transactional mail failing SPF until its include is restored.
- **DNSSEC:** if disabled for the migration, the domain is unsigned
  until re-enabled (Phase 4 or Phase 5 per Open Questions #1).
- **Phase 5:** an in-progress registrar transfer can be cancelled at
  GoDaddy; once complete it is locked for 60 days.

## Sources

- [Custom domains · Cloudflare Pages docs](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Change your nameservers (Full setup) · Cloudflare DNS docs](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Transfer your domain to Cloudflare · Cloudflare Registrar docs](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)
- [Zoho Mail pricing — editions compared](https://www.zoho.com/mail/zohomail-pricing.html)
- [Zoho Mail — rates, limits, and policies](https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html)
- [Google Workspace for Nonprofits — eligibility · Google for Nonprofits Help](https://support.google.com/nonprofits/answer/3367223)
