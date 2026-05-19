# Plans

Per-feature implementation plans. Each plan is the working document
that drives Stages 2-3 of the development workflow (see
[`../../CLAUDE.md`](../../CLAUDE.md) → Development workflow).

## Files in this directory

- [`HANDOFF.md`](HANDOFF.md) — cross-session continuity doc; updated
  at the end of every implementation session.
- `<feature-name>.md` — one file per non-trivial feature, written in
  Stage 2 and reviewed in Stage 3.

## Convention

- One `.md` file per feature; kebab-case filename
  (e.g. `r2-storage-chokepoint.md`).
- Plan goes through adversarial review (Stage 3) before any code is
  written.
- After implementation lands, the plan **stays** in the repo as
  historical record — don't delete it. Add a `## Status` section at
  the top noting what shipped and which commits.

## Required sections

Every plan doc must have:

- **Goal** — what we're building, in 1-2 sentences.
- **Background / context** — what reviewers need to know to evaluate
  the plan: existing patterns, constraints, prior decisions, why now.
- **Design** — the actual plan: schema changes, modules to add or
  change, API surface, edge cases, error handling.
- **Open questions** — things the user must decide before
  implementation begins.
- **Sources** — URL list at the bottom. Cite anything from Stage 1
  web research that materially shaped the design (vendor SDKs, RFCs,
  blog posts, security advisories, GitHub issues). Stage 3 reviewers
  use these to evaluate whether the plan reflects current best
  practice.

Optional but useful for big features:

- **Out of scope** — explicit list of what this plan does *not* cover,
  to head off scope-creep findings in review.
- **Migration / backfill** — if the change touches existing data.
- **Telemetry / observability** — what metrics or logs let us verify
  the change works in production.
- **Rollback plan** — how to undo if something goes wrong.

## Style

- Be concrete. "We'll add a chokepoint module" is too vague; name the
  file, list the public API, show the flow.
- Cite specific lines or commits when describing existing patterns
  (`app/foo.ts:42`, commit `abc1234`).
- Include code snippets for non-obvious shapes (proposed schemas,
  function signatures, error states).
- Write in present tense as a directive, not future tense as a wish:
  "The handler returns 401 if..." not "The handler will return..."
