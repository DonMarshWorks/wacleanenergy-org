# WordPress.com → Cloudflare / Zoho migration

## Status

_Plan rewritten 2026-05-21 from the earlier `godaddy-migration.md`,
which was based on incorrect assumptions about the current host (it
assumed GoDaddy DNS + GoDaddy-resold-M365 email; the real stack is
WordPress.com DNS + Titan email via WP.com's Professional Email
reseller). The original plan was hardened through 4 rounds of Stage 3
adversarial review and the operational structure survives — phasing,
TTL gates, transitional SPF, the no-same-address-forward rule, and
the email-after-cutover discipline are unchanged. What changed is the
vocabulary and a handful of plan branches that simplify because the
real environment is simpler than the original feared (DNSSEC is off,
DKIM is already published, the email source is a real mailbox not a
forwarder)._

_Phase 0 facts gathered from public DNS + RDAP on 2026-05-21 are
recorded inline; the WP.com DNS dashboard was reviewed the same day
and the zone inventory is now complete (8 records — see Phase 0 #1).
**Implementation not yet started.**_

## Goal

Move `wacleanenergy.org` off WordPress.com onto a cleaner stack:

1. **DNS migration** — make the domain a Cloudflare zone, then serve
   the new Astro site from Cloudflare Pages on the apex (mandatory).
2. **Email migration** — move the `info@wacleanenergy.org` mailbox off
   WordPress.com's Professional Email (which is Titan, resold) to
   **Zoho Mail Lite** ($12/mailbox/year, billed annually). Preserves
   the existing mail history via Zoho's named-source Titan → Zoho
   migration tool.
3. **Registrar transfer** — move domain registration from Automattic
   Inc. (WordPress.com's in-house registrar) to Cloudflare Registrar
   (optional, deferred to the final phase).

Building the new site's content was a separate effort
(`docs/plans/content-migration.md`, shipped) — the deployable site
already exists at `https://wacleanenergy-org.pages.dev` and this plan
only needs to point the live domain at it.

## Background / current-state facts

Captured 2026-05-21 from public DNS, RDAP at PIR, and vendor pricing
pages. (Sources at bottom.)

**Hosting / DNS / registrar:**

- **Registrar:** Automattic Inc. (ICANN handle 1531). The domain is
  registered through WordPress.com's in-house ICANN-accredited
  registrar, not a third party. Status: `clientTransferProhibited`
  (default registrar lock — toggleable in the WP.com dashboard).
  Registered 2023-12-18, last changed 2025-12-03, **expires
  2026-12-18**. Last change is 169 days ago, so the ICANN 60-day
  post-change transfer lock has expired.
- **Nameservers:** `ns1.wordpress.com`, `ns2.wordpress.com`,
  `ns3.wordpress.com` — DNS authority is WordPress.com itself.
- **Web hosting:** the current site is on WordPress.com (apex resolves
  to `192.0.78.24` / `192.0.78.25`; `www` is a `CNAME` to the apex).
  This is being replaced by the Astro site in this repo, already
  deployed at `https://wacleanenergy-org.pages.dev`.
- **DNSSEC:** OFF. RDAP `secureDNS.delegationSigned = false`; no `DS`
  record at the `.org` registry. **Every DNSSEC contingency in the
  original plan collapses to "skip" — there is nothing to disable
  before the nameserver switch and nothing to re-enable in Phase 4,
  unless we elect to turn DNSSEC on at Cloudflare for the first time
  in Phase 4 (one-click).**
- **CAA:** none. No CA-issuance restriction blocks Cloudflare
  Universal SSL in Phase 2B.
- **Domain Connect:** a `TXT` at `_domainconnect` →
  `public-api.wordpress.com/rest/v1.3/domain-connect`. A WordPress.com
  platform record for third-party DNS auto-configuration; it has no
  role in web or mail resolution and becomes inert once DNS authority
  leaves WP.com. Handled in Phase 2A #2 / dropped in Phase 4.
- **Record TTLs:** the WP.com DNS UI exposes no per-record TTL field;
  records are served at WP.com's fixed default (~3600s). Has
  consequences for the cutover sequencing — see Phase 0 #4.

**Email:**

- `info@wacleanenergy.org` is a real hosted mailbox on **Titan**
  (`mx1.titan.email` / `mx2.titan.email`), sold to WordPress.com as
  their "Professional Email" product at **$35/mailbox/year (annual)
  or $3.50/mailbox/month (monthly)**.
- **DKIM:** already published. `titan1._domainkey.wacleanenergy.org`
  carries a valid RSA DKIM key — outbound mail from `info@` is being
  DKIM-signed by Titan for the domain today.
- **SPF:** `v=spf1 include:spf.titan.email ~all` (Titan-only,
  soft-fail).
- **DMARC:** `v=DMARC1; p=none; sp=none; adkim=r; aspf=r; pct=100` —
  published but **not enforced**, and no `rua` aggregate-report
  address. (The old plan's "DMARC stays at its current enforced
  policy" line is therefore inapplicable to this domain.)

**Account ownership:**

- WordPress.com account (registrar + DNS + Professional Email) is
  owned by **Don Marsh personally** (`don.m.marsh@gmail.com`); same
  for the Cloudflare account and the GitHub `DonMarshWorks` org. There
  is no separate coalition operator. Long-term, transferring the
  GitHub org and Cloudflare account to coalition-controlled identities
  is recommended but out of scope here.
- Don has full admin access to the WP.com dashboard, so the DNS
  export, the registrar lock toggle, the EPP code, and the email
  cancellation are all single-operator actions.

**Coalition / billing posture:**

- WCEC is an **informal group, not a registered 501(c)(3)** — no
  nonprofit-rate eligibility for Google Workspace; the Zoho Mail Lite
  decision stands.
- Don is currently paying WP.com for the registrar + Professional
  Email + a WP.com site hosting plan. The site plan disappears once
  the Astro site takes over (Phase 2B); the Professional Email line
  disappears in Phase 4 (after the Zoho cutover is verified); the
  registrar line either stays at Automattic ($12/yr) or moves to
  Cloudflare ($10.13/yr at-cost) in Phase 5.

**Cost comparison (annual, USD, post-migration steady state):**

| Line item | Today (WP.com) | Post-Phase 4 (WP.com still registrar) | Post-Phase 5 (Cloudflare registrar) |
|---|---|---|---|
| `.org` registration | $12 | $12 | $10.13 |
| DNS hosting | $0 | $0 | $0 |
| Web hosting | WP.com plan | $0 (Pages) | $0 (Pages) |
| Email (1 mailbox) | $35 (WP.com / Titan) | $12 (Zoho Mail Lite) | $12 (Zoho Mail Lite) |
| **Total** | $47/yr + WP.com plan | **$24/yr** | **$22/yr** |

## Design

Phased so each phase is independently verifiable and reversible. Three
deliberate decouplings reduce blast radius:

- **Phase 2A (nameserver switch) is separate from Phase 2B (point the
  apex at Pages).** 2A moves DNS authority to Cloudflare with every
  record — including the apex still pointing at WordPress.com and the
  existing Titan `MX` — still pointing where it does today; nothing
  visitor- or mail-facing changes. Only 2B repoints the site; only
  Phase 3 repoints mail.
- **The email-provider switch (Phase 3) is separate from the
  nameserver switch.**
- **The registrar transfer (Phase 5) is last** and touches neither DNS
  nor mail.

### Phase 0 — Preparation (no production changes)

Record findings by appending to this doc. Store secrets (EPP code,
recovery codes, IMAP credentials) in a password manager — never in
this file.

1. **Authoritative DNS inventory — done 2026-05-21.** The full
   WordPress.com DNS dashboard was reviewed; the zone is small and is
   now completely known. Eight records:

   | Type | Name | Value |
   |---|---|---|
   | `A` | `@` | `192.0.78.24`, `192.0.78.25` (WP.com web hosting; dashboard shows "Handled by WordPress.com", literal IPs from public `dig`) |
   | `CNAME` | `www` | `wacleanenergy.org` |
   | `MX` | `@` | `mx1.titan.email` (priority 10) |
   | `MX` | `@` | `mx2.titan.email` (priority 20) |
   | `TXT` | `@` | `v=spf1 include:spf.titan.email ~all` |
   | `TXT` | `_dmarc` | `v=DMARC1;p=none;sp=none;adkim=r;aspf=r;pct=100` |
   | `TXT` | `titan1._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0…` (Titan DKIM) |
   | `TXT` | `_domainconnect` | `public-api.wordpress.com/rest/v1.3/domain-connect` |

   No `CAA`, no `SRV`, no verification `TXT`s, no second DKIM
   selector. This table is the source of truth for Phase 2A's
   record-by-record replication. WP.com's DNS UI shows no per-record
   TTLs (see #4). If any record is added at WP.com between now and
   the Phase 2A cutover (e.g. the Zoho verification record from #7),
   append it here.
2. **CAA check (already done — none today).** If the dashboard shows
   no `CAA`, Cloudflare's certificate issuance in Phase 2B is
   unrestricted. If a `CAA` is added at any point before cutover, it
   must permit the CAs Cloudflare uses (currently Google Trust
   Services, Let's Encrypt, SSL.com — `issue` entries for `pki.goog`,
   `letsencrypt.org`, `ssl.com`).
3. **DMARC posture decision.** Current `_dmarc` is `p=none` with no
   `rua`. Two reasonable choices:
   - **(a) Leave `p=none` through the migration** and decide on
     enforcement afterward. Lower-risk operationally — Phase 3's
     transitional SPF cannot break delivery under a `p=none` policy.
   - **(b) Add a `rua=` aggregate-report mailbox now** (e.g.
     `dmarc-reports@wacleanenergy.org` aliased into the Zoho mailbox)
     so the Phase 4 reports gate yields real data. Still `p=none`
     during the migration. **Recommended:** (b) — costs nothing and
     gives visibility before any later tightening to
     `p=quarantine`/`p=reject`.
4. **TTLs — WP.com gives no control; lower them in Cloudflare
   instead.** The WP.com DNS UI exposes no per-record TTL field;
   records are served at WP.com's fixed default (~3600s). So the
   classic "drop all TTLs to 300s 24–72h before the cutover" step
   **cannot be done at the source.** This is acceptable: the Phase 2A
   nameserver switch copies every record verbatim, so a resolver
   still holding a stale WP.com-served record gets an answer
   identical to the fresh Cloudflare one — TTL at the 2A switch does
   not matter. Low TTLs *do* matter for Phase 2B (apex repoint) and
   Phase 3 (`MX` cutover), but both happen *after* DNS is on
   Cloudflare — so set every record to 300s **in the Cloudflare
   zone** as part of Phase 2A #2, well ahead of those cutovers.
   Restore normal TTLs after Phase 4. Separately, record the parent
   `.org` delegation `NS` TTL — it governs Phase 2A rollback timing
   and is controlled by neither WP.com nor Cloudflare:
   ```
   Resolve-DnsName -Name wacleanenergy.org -Type NS -Server a0.org.afilias-nst.info
   ```
5. **DNSSEC status — confirmed OFF.** The domain is unsigned at the
   `.org` registry today (RDAP `delegationSigned: false`; no `DS`).
   Skip every "disable DNSSEC at the registrar" step the original
   plan contained. The only DNSSEC question left is whether to **turn
   it on for the first time** at Cloudflare in Phase 4 — see
   Open Questions.
6. **Current email — confirmed Titan via WP.com.** Public DNS shows
   `mx1/2.titan.email` and a published Titan DKIM selector. Confirm
   in the WP.com dashboard:
   - Plan tier and renewal cadence of the Professional Email
     subscription (so we know what we'll cancel and when the next
     charge is).
   - Mailbox aliases, filters, signatures, and whether Titan
     calendar / contacts contain anything worth exporting (these do
     **not** come across with the IMAP mail migration — see Phase 3).
   - Titan account password / app-password requirements for the
     migration's IMAP source credentials.
7. **Set up Zoho.** Create a Zoho account using
   `don.m.marsh@gmail.com` as the admin (matching current account
   ownership), subscribe to **Mail Lite** annual ($12/yr), add
   `wacleanenergy.org` as the domain, complete Zoho's domain-ownership
   verification (`TXT` or `CNAME` — add at the WP.com DNS dashboard
   now; it does not affect mail), and create the
   `info@wacleanenergy.org` mailbox in Zoho. Do **not** change `MX`
   yet — Titan keeps delivering until Phase 3.
8. **Account security.** Enable 2FA on WordPress.com, Cloudflare, and
   Zoho. Store recovery codes in a password manager. The earlier plan
   required a "second authorized maintainer" — out of scope here
   given the single-operator reality, but the equivalent continuity
   step is: document a designated successor (a trusted person who
   could be granted access in an emergency) and where the password
   manager + recovery codes live, so the project does not get stuck
   if Don is unavailable.

### Phase 1 — Build and deploy the site (already done)

Already shipped — the Astro site is live at
`https://wacleanenergy-org.pages.dev` and auto-deploys from `main`.
No work here; the gate is implicitly green.

### Phase 2A — Move DNS authority to Cloudflare (no service change)

Every record is replicated **exactly as it is today**, including the
apex still pointing at WordPress.com (`192.0.78.24` / `192.0.78.25`)
and the existing Titan `MX` records.

1. In Cloudflare, **add `wacleanenergy.org` as a zone** ("Onboard a
   domain"); let it auto-scan. The zone is small — the eight records
   inventoried in Phase 0 #1 — so auto-scan should pick up most of
   it.
2. **Reconcile against the Phase 0 #1 inventory, record by record.**
   Manually add anything auto-scan missed so the Cloudflare zone
   holds all eight records, plus the Zoho domain-verification record
   from Phase 0 #7. All records keep their current targets; set
   everything **DNS-only** (grey cloud), and set every record's TTL
   to **300s** now (Phase 0 #4). Then **diff the Cloudflare zone
   against the Phase 0 #1 table** field by field and confirm the
   record count matches — this parity check is a gate before step 3.
   - **`_domainconnect`:** copy it verbatim like every other record,
     to keep the "zone is functionally equivalent" property intact
     across the nameserver switch. It is a WP.com platform record
     with no role in web or mail resolution; once DNS is on
     Cloudflare it is inert (Cloudflare is not a Domain Connect
     provider). It is dropped as a dead record in Phase 4 cleanup —
     not before, so Phase 2A stays a pure verbatim copy.
3. **Preflight against Cloudflare's nameservers.** Before changing
   delegation, query each assigned Cloudflare nameserver directly for
   **every record in the Phase 0 #1 export** and confirm answers
   match — apex `A`/`AAAA`, `www CNAME`, `MX`, apex `TXT`/SPF,
   `titan1._domainkey TXT`, `_dmarc`, and every verification `TXT`:
   ```
   Resolve-DnsName -Name <name> -Type <type> -Server <cloudflare-ns>
   ```
4. In the WordPress.com domain settings, **replace the nameservers**
   with Cloudflare's two assigned nameservers (copy exactly). **Record
   the originals first** (`ns1.wordpress.com`, `ns2.wordpress.com`,
   `ns3.wordpress.com`) for rollback. WordPress.com lets you choose
   "use custom nameservers" on a per-domain basis even while the
   domain is registered with Automattic.
5. Wait for Cloudflare to report the zone **Active** (minutes–24h).
6. **Verify:** the WordPress.com site still loads on
   `wacleanenergy.org` + `www`; a test email to `info@` still arrives
   at the Titan mailbox.
7. **Hold period.** Wait at least the recorded parent `NS` TTL
   (Phase 0 #4) before Phase 2B/3, so resolvers worldwide use the
   Cloudflare delegation. A Phase 2A rollback is governed by that
   parent TTL — it is not a minutes-level operation; the real safety
   here is that records were copied verbatim, so the zone is
   functionally equivalent regardless of which nameservers a resolver
   uses.

### Phase 2B — Point the site at Cloudflare Pages

Only after Phase 2A's hold period.

1. The zone still holds the old apex/`www` records pointing at
   WordPress.com (copied in Phase 2A). Record their values, then in
   the Cloudflare **Pages project → custom domains** add
   `wacleanenergy.org` and `www.wacleanenergy.org`. Because the zone
   is on the same Cloudflare account, Pages **creates the required
   proxied DNS records and provisions the SSL certificate as part of
   activation**; where a new Pages record conflicts with an old
   WordPress.com apex/`www` record, let the Pages workflow replace it
   (or delete only that conflicting record immediately before adding
   the custom domain if Pages does not). Do not otherwise pre-create
   or hand-toggle these records. The custom domain shows "Active"
   once the certificate is issued.
2. Confirm the live apex/`www` records now resolve to Pages, and that
   both hostnames load the **new** Astro site over HTTPS with a valid
   certificate, before announcing the cutover.
3. After confirming Phase 2B is good, the WordPress.com **site
   hosting plan** can be cancelled — Don's WP.com bill drops by that
   line item. The **Professional Email and domain renewal** stay
   active; do not cancel them yet (Professional Email until Phase 4,
   domain until Phase 5 or never).

**Rollback:** in the Pages project, remove the custom domains; then
in Cloudflare DNS recreate the apex/`www` records pointing at the
WordPress.com targets (DNS-only). With 300s record TTLs this is fast
and needs no nameserver change.

### Phase 3 — Email migration to Zoho

Only after Phase 2A's hold period. Zoho is set up and the domain
verified (Phase 0 #7).

1. **Publish Zoho's auth records** (no inbound change yet):
   - **DKIM:** add the Zoho DKIM selector `TXT` Zoho provides
     (typically `zmail._domainkey.wacleanenergy.org` or similar);
     enable DKIM signing in the Zoho console. The existing
     `titan1._domainkey` record stays in place — there is no DKIM
     conflict; outbound from each provider is signed under its own
     selector.
   - **SPF — transitional merged record.** There must be exactly
     **one** `v=spf1 TXT` at the apex. During Phase 3, publish a
     record authorising **both** Titan and Zoho:
     `v=spf1 include:spf.titan.email include:zoho.com ~all` (Zoho's
     current SPF include is `zoho.com`; confirm in the Zoho admin
     console at execution time). The `~all` soft-fail matches the
     current posture. Validate with an SPF checker; confirm the
     DNS-lookup count is ≤10 (current count after the merge would be
     ~3 — well clear). **Record the old SPF value for rollback.**
2. **Verify outbound alignment before touching `MX`.** Send a test
   message from the Zoho `info@` mailbox to an outside account and
   confirm **SPF and DKIM pass and align to `wacleanenergy.org`** in
   the headers. DMARC `p=none` cannot block delivery; that is fine —
   the test is checking alignment, not enforcement.
3. **Initial mail migration — Titan → Zoho.** In the Zoho admin
   console → Mail Migration, choose **Titan Mail** as the named
   source (Zoho lists Titan as a first-class source, not a generic
   IMAP — folder structure, message timestamps, and read/unread
   state are preserved). Source credentials are the Titan mailbox
   IMAP login (from Phase 0 #6). Let the bulk migration run to
   completion. Titan is still authoritative — mail continues to land
   there.
4. **Inbound cutover.** In Cloudflare DNS, **replace the Titan `MX`
   records with Zoho's `MX` records**; record the original Titan
   values (`mx1.titan.email`, `mx2.titan.email`). Mail delivered to
   Titan during `MX` propagation stays in the Titan mailbox — do
   **not** attempt to forward `info@` to itself: forwarding to the
   same address at a still-authoritative Titan mailbox loops or
   delivers locally rather than routing to Zoho. Instead, keep the
   Titan mailbox monitored through the short (300s-TTL) propagation
   tail; the Phase 4 delta migration sweeps anything that landed
   there.
5. **Operational cutover.** Begin using the Zoho mailbox (webmail or
   an IMAP client) and treat the Titan mailbox as **read-only** from
   this point — no sending or filing in Titan — so mailbox state has
   a single source of truth. Recreate any filters, aliases, and
   signatures in Zoho (these did not migrate with the IMAP mail
   move).

### Phase 4 — Verification, optional DNSSEC, cleanup

1. `wacleanenergy.org` + `www` load the new site over HTTPS (valid
   cert, no warnings).
2. **Receive:** send test mail to `info@wacleanenergy.org` from
   several outside providers (Gmail, Outlook, Yahoo, ProtonMail);
   confirm each reaches the Zoho mailbox, not spam.
3. **Send:** send from `info@` (Zoho) to an outside account; confirm
   delivery, not spam, and SPF + DKIM pass aligned to the domain.
4. **Narrow SPF to Zoho-only.** Once the operational cutover (Phase 3
   #5) is confirmed — no maintainer or system still sends through
   Titan — replace the transitional merged SPF record with the
   Zoho-only record:
   `v=spf1 include:zoho.com ~all`.
5. **DMARC follow-on (optional but recommended).** If the Phase 0 #3
   `rua` was added, review the aggregate reports as they arrive over
   the following 1–2 weeks. Once Zoho-aligned mail is the only
   passing source and there is no unexpected upstream sending,
   consider tightening to `p=quarantine` (and later `p=reject`). This
   is a per-domain trust posture; not a cutover-blocking step.
6. The direct send/receive tests in #2–3 are the cutover gate. DMARC
   aggregate reports are **confirmatory only** — review them as they
   arrive, but do not block cleanup on them, since not every receiver
   emits reports.
7. **Drop the dead `_domainconnect` `TXT`** carried over verbatim in
   Phase 2A — it is inert now that DNS is on Cloudflare. Then
   spot-check other DNS-dependent services: the website renders and
   the Zoho mailbox can be logged into from a phone.
8. **Final delta migration:** ~48h after the `MX` cutover, re-run
   Zoho's migration tool against the Titan mailbox to catch mail
   delivered to Titan during propagation; confirm the Titan mailbox
   holds nothing newer than the original `MX` cutover by more than
   the brief propagation tail.
9. **Optional first-time DNSSEC enablement at Cloudflare.** The
   domain is unsigned today; the lowest-risk place to turn DNSSEC on
   for the first time is *after* Phase 5 (Cloudflare controls both
   DNS and registrar, so signing + `DS` publication is one click).
   If turning DNSSEC on before Phase 5, enable it in the Cloudflare
   zone and add the generated `DS` record at WordPress.com's DNSSEC
   panel manually — confirm WP.com supports adding a custom `DS`
   record at the registrar (some registrars do not, in which case
   defer to Phase 5).
10. **Cancel WordPress.com Professional Email** — only now. The
    Titan mailbox stops receiving when WP.com cancels the
    subscription; verify Zoho is the only inbound path before
    cancelling. Restore normal TTLs (Phase 0 #4).
11. Monitor ~24–48h before Phase 5.

### Phase 5 — Registrar transfer (optional, deferred)

Only after Phase 4 is clean.

While Automattic remains registrar, confirm **auto-renew is on** and
the registrant contacts are current so the domain cannot lapse (next
renewal: **2026-12-18**, ~7 months out from this writing — there is
margin but not unlimited margin).

To transfer:

1. In the WordPress.com domain settings, **unlock the domain**
   (toggle off `clientTransferProhibited`). If Domain Privacy is on,
   disable it temporarily for the transfer.
2. Obtain the **authorization (EPP) code** from the WordPress.com
   domain settings (or via support if not exposed directly). Store
   in the password manager; **discard it once the transfer completes
   — it is a long-lived credential.**
3. **If the transfer is aborted or delayed, re-lock the domain
   immediately.**
4. In Cloudflare → Registrar → Transfer domains: enter the auth code,
   approve the Form-of-Authorization email, confirm Automattic's
   release email. Completes in up to ~10 days, adds a year to the
   registration.
5. After transfer, confirm WHOIS privacy and auto-renew are on in
   Cloudflare.
6. If DNSSEC re-enablement was deferred here (Phase 4 #9), do it now
   — one click once Cloudflare controls both DNS and registrar.

**ICANN 60-day post-change transfer lock:** the last change to the
domain was 2025-12-03 (169 days ago), so this lock has already
expired. The transfer is not blocked on that basis.

## Open questions

1. **WordPress.com site plan tier.** Don has confirmed a WP.com site
   plan is active alongside Professional Email — Personal ($48/yr),
   Premium ($96/yr), or Business ($300+/yr). The exact tier affects
   the immediate savings calculus from Phase 2B's cancellation but
   does not change the plan structure. Track this for the post-Phase
   2B cancellation step.
2. **Titan calendar / contacts.** Does `info@` use Titan's calendar
   or contacts for anything worth keeping? The IMAP mail migration
   moves messages only; calendar/contacts need separate ICS/vCard
   export+import or are simply abandoned.
3. **First-time DNSSEC enablement.** The domain has never been
   DNSSEC-signed. Turn on at Cloudflare in Phase 4 (with manual `DS`
   add at WP.com if their dashboard supports it), or defer to
   Phase 5 when it becomes one-click? Recommended: defer to Phase 5
   — no urgency, less risk of a `DS`-add ergonomics issue at WP.com.
4. **DMARC `rua` and later policy tightening.** Add an aggregate-
   report `rua=` mailbox during Phase 0 (recommended) so Phase 4 has
   data, then revisit moving from `p=none` to `p=quarantine` once
   Zoho is the sole sender and reports are clean. Not a blocker;
   tracked here so it does not get forgotten.
5. **Designated successor / continuity.** With single-operator
   ownership, document where the password manager + recovery codes
   live and (informally) name a trusted person who could be granted
   access in an emergency. Out of scope to operationalise; named
   here to ensure it does not get forgotten.
6. **Preferred low-traffic windows** for the Phase 2A nameserver
   cutover and the Phase 3 `MX` cutover.

## Out of scope

- Building the site pages/content — separate plan
  (`docs/plans/content-migration.md`, shipped).
- Migrating content out of WordPress.com (the rebuild was fresh — no
  scrape).
- Bulk/newsletter email beyond the single `info@` mailbox.
- MTA-STS / TLS-RPT and other mail-transport hardening beyond SPF,
  DKIM, and DMARC.
- Transferring the GitHub `DonMarshWorks` org and the Cloudflare
  account to coalition-controlled identities (a desirable future
  step, not part of this migration).

## Rollback plan

- **Phases 0–1:** nothing live changed.
- **Phase 2A, before the nameserver switch:** delete the Cloudflare
  zone; WordPress.com DNS is still authoritative.
- **Phase 2A, after the nameserver switch:** revert nameservers at
  WordPress.com to `ns1.wordpress.com` / `ns2.wordpress.com` /
  `ns3.wordpress.com` — governed by the parent `NS` TTL, so hours
  not minutes. Records were copied verbatim, so resolution stays
  equivalent meanwhile; that equivalence is the safety mechanism,
  not rollback speed.
- **Phase 2B:** remove the custom domains from the Pages project,
  then recreate apex/`www` pointing at the WordPress.com targets
  (`192.0.78.24` / `192.0.78.25` apex `A`; `www CNAME` to apex),
  DNS-only — fast (300s TTL), no nameserver change.
- **Phase 3 (email):** the Titan mailbox stays active (read-only)
  until Phase 4, so a rollback target exists. To roll back, restore
  the recorded Titan `MX` and SPF values; keep the Zoho mailbox in
  place until Titan `MX` has repropagated. Two accepted degradations:
  (a) mail received into Zoho during the live window is not in the
  Titan mailbox — Zoho is the source of truth for that mail and a
  reverse export would be needed; (b) reverting SPF to the previous
  Titan-only value is straightforward, but if WP.com Professional
  Email is somehow also reactivated mid-rollback, ensure the SPF
  value matches whichever side is authoritative.
- **DNSSEC:** if turned on for the first time during this migration
  and a problem surfaces, disable in Cloudflare; remove the `DS`
  record at the registrar. Bounded validation-failure window
  governed by the parent `DS` TTL.
- **Phase 5:** an in-progress registrar transfer can be cancelled at
  WordPress.com; once complete, the domain is locked for 60 days at
  Cloudflare before another transfer is possible.

## Sources

Site / DNS facts captured 2026-05-21 via `Resolve-DnsName` and
RDAP — they are reproducible from any machine.

- [Custom domains · Cloudflare Pages docs](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Change your nameservers (Full setup) · Cloudflare DNS docs](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Transfer your domain to Cloudflare · Cloudflare Registrar docs](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)
- [Cloudflare Registrar — at-cost domain pricing](https://www.cloudflare.com/products/registrar/)
- [Zoho Mail pricing — editions compared](https://www.zoho.com/mail/zohomail-pricing.html)
- [Zoho Mail admin console — Mail Migration (Titan named source)](https://www.zoho.com/mail/help/adminconsole/migration.html)
- [WordPress.com domain pricing & TLDs](https://wordpress.com/support/domains/domain-pricing-and-available-tlds/)
- [WordPress.com Professional Email — pricing & free trial](https://wordpress.com/professional-email/)
- [RDAP for `.org` · Public Interest Registry](https://rdap.publicinterestregistry.org/rdap/domain/wacleanenergy.org)
