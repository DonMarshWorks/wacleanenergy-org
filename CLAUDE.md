# claude-cf-kit — Instructions for Claude

This repo is a starter kit for **Claude-managed websites on Cloudflare Pages**.
Each new site begins as a copy of this template and is then extended by Claude
based on the site's requirements. This file tells you how to operate inside it.

## Stack

- **Astro 5** (SSR via `@astrojs/cloudflare` adapter) — pages in `src/pages/`,
  layouts in `src/layouts/`, shared logic in `src/lib/`.
- **Tailwind v4** via `@tailwindcss/vite` — CSS-first config in
  `src/styles/global.css` (use `@theme {}` for tokens; no `tailwind.config.js`).
- **Vitest** for unit tests — co-located as `*.test.ts` next to source.
- **TypeScript strict** — extends `astro/tsconfigs/strict`.
- **Wrangler** for deploys — config in `wrangler.jsonc`.

The base stack is intentionally minimal. Heavier features (auth, R2 proxies,
GitHub Actions deploy, install scripts) live in `recipes/` as opt-in modules.

## Repo layout

```
.
├── .claude/settings.json        # Claude Code permissions (allowlist)
├── public/                      # Static assets served at the site root
│   ├── _redirects               # Cloudflare Pages redirects
│   └── favicon.svg
├── src/
│   ├── env.d.ts                 # CloudflareEnv type — extend as you add bindings
│   ├── layouts/BaseLayout.astro # Minimal HTML shell — restyle freely
│   ├── pages/                   # Routes; api/* are SSR endpoints
│   │   ├── index.astro
│   │   └── api/health.ts        # Example endpoint, safe to delete
│   └── styles/global.css        # Tailwind + theme tokens
├── recipes/                     # Opt-in features — see "Applying a recipe"
├── astro.config.mjs
├── wrangler.jsonc               # Cloudflare bindings + project name
├── package.json                 # Scripts: dev, build, test, deploy, lint
├── tsconfig.json
└── vitest.config.ts
```

## When entering an existing project (fresh session)

If [`docs/plans/HANDOFF.md`](docs/plans/HANDOFF.md) has real content
(not the unedited template), **read it before doing anything else**.
It tells you what the previous session shipped, what's deferred, and
what the natural next step is. Don't restart from scratch when there's
a hand-off waiting.

## Setting up a new project from this kit

When the user clones this template for a new site, do these steps in order
(don't ask permission — these are mechanical renames):

1. **Pick a project slug** (kebab-case, used in Cloudflare Pages and npm).
   Confirm with the user if not obvious from the directory name.
2. **Update `package.json`**: `name`, `description`, and replace
   `PROJECT_NAME` in the `deploy` script.
3. **Update `wrangler.jsonc`**: replace `PROJECT_NAME` in the `name` field.
4. **Update `astro.config.mjs`**: uncomment and set `site:` to the production
   URL.
5. **Replace `README.md`** with a short description of the new project.
6. **Delete `src/pages/api/health.ts`** if not needed.
7. Ask the user which recipes (if any) to apply — see below.

After step 1, mention the name once so the user can correct it before you
propagate it everywhere.

## Applying a recipe

Recipes are self-contained feature modules in `recipes/<name>/`. Each one
contains:

- `README.md` — what it does, when to use, configuration steps.
- `files/` — files to copy into the project, mirroring the project layout
  (e.g. `recipes/foo/files/src/lib/foo.ts` → `src/lib/foo.ts`).
- `wrangler-fragment.jsonc` (optional) — bindings/config to merge into
  `wrangler.jsonc`.
- `env-fragment.md` (optional) — env vars / secrets the user must set.

To apply a recipe:

1. Read `recipes/<name>/README.md` end-to-end.
2. Copy everything under `files/` into the project root, preserving paths.
3. Merge any `wrangler-fragment.jsonc` into `wrangler.jsonc` (don't blindly
   replace — append the new bindings).
4. Update `src/env.d.ts` to add the new binding types so TypeScript stays
   happy.
5. Tell the user any manual steps from `env-fragment.md` (creating KV
   namespaces, registering OAuth apps, setting GitHub secrets, etc.).
6. Run `npm run lint` to confirm nothing is broken.

Available recipes (see `recipes/README.md` for the index):

- `cloudflare-pages-deploy` — GitHub Actions workflow for deploys.
- `r2-asset-proxy` — serve files from an R2 bucket via a path prefix.
- `google-oauth-kv` — Google OAuth relay with KV-backed token handoff.
- `install-scripts` — cross-platform installer scripts (`.sh` + `.ps1`).

## Development workflow (non-trivial features)

Apply the **7-stage workflow** to any feature that touches more than one
file, changes schema or API surface, modifies auth/billing/security, or
shifts architectural direction. A single-line config tweak or typo fix
can skip stages 1 and 3.

The Stage-3 and Stage-5 reviewers are provided by the
**adversarial-agents** MCP server. It's configured at user level
(`~/.claude.json`), not in this repo — API keys stay out of git.

**Before starting Stage 1 of a new feature**, confirm the tools are
available by running `mcp__adversarial-agents__agent_health_check`.
If it's missing or fails, walk the user through the one-time install
in [`docs/setup/adversarial-review.md`](docs/setup/adversarial-review.md)
*before* writing the plan — you don't want to discover the reviewers
are unavailable at Stage 3.

### Stage 1 — Research

Two limbs, both required for any non-trivial step:

1. **Web research** — mandatory when the step touches a new vendor, an
   external service, a managed-DB feature, or any unfamiliar domain.
   Treat training-data answers as expired; confirm against current
   sources (vendor docs, RFCs, security advisories) before designing
   against them.
2. **Codebase research** — understand the patterns the new code will
   sit alongside (modules it'll mirror, listeners it'll plug into,
   migrations it'll extend).

Neither limb substitutes for the other.

### Stage 2 — Plan

Write `docs/plans/<feature-name>.md`. Use the section structure in
[`docs/plans/README.md`](docs/plans/README.md). Cite the URLs from
Stage 1 web research at the bottom — reviewers in Stage 3 use them.

### Stage 3 — Adversarial review of the plan

Dispatch reviewers in **parallel** in a single message:

- `mcp__adversarial-agents__review_devils_advocate`
- `mcp__adversarial-agents__review_security`
- `mcp__adversarial-agents__review_architecture`

Or use `mcp__adversarial-agents__plan_review_sequence` for the bundled
flow.

Triage findings into A (must fix), B (should fix), C (nice to fix),
D (deferred). Apply A-bucket fixes to the plan, run round 2, repeat
until verdicts converge. Plan for **2-3 rounds** on big refactors —
each round catches things the previous one missed. Convergence means
no remaining A-bucket findings, not zero findings overall.

**Escalate unresolvable conflicts on significant issues to the user
before proceeding.**

#### Adversarial review payload guidelines

- `context` field: hard-capped at **10,000 chars**. Keep it brief —
  1-2 paragraphs of intent + constraints + binding rules.
- `content` field: hard-capped at **100,000 chars**. The plan or diff
  goes here.
- For diffs that delete files: **summarize deletions, don't paste
  bytes**. Reviewers don't need the deleted code to evaluate what
  survives. ("Removed `app/foo.py` + `app/bar.py` — old session-handling
  stack, replaced by the new KV-backed flow in this commit.")

### Stage 4 — Implement

Write code and unit tests against the hardened plan. **Hard gate before
Stage 5: `npm run lint && npm test` must be clean.** Don't dispatch
reviewers on a red build.

### Stage 5 — Adversarial review of the implementation

Once Stage 4's gate is green, run reviewers on the diff:

- `mcp__adversarial-agents__review_code_critic`
- `mcp__adversarial-agents__review_security`
- `mcp__adversarial-agents__review_type_checker`
- `mcp__adversarial-agents__review_architecture`

Or use `mcp__adversarial-agents__code_review_sequence` /
`full_code_review` for bundled flows.

Same payload guidelines. Iterate to convergence.

**Stage 5's job is narrower than Stage 3:** *did we build what the
plan said?* — not *is the design sound?* The design was hardened in
Stage 3.

#### NEVER revert in response to review findings

Adversarial reviewers may lack context on intentional design choices,
recent decisions, or constraints not visible in the diff. **Never
revert code, delete recent work, or make broad rewrites in response
to review feedback without explicit user approval.** Past sessions
have lost hours of work to reflexive reverts.

Correct response to review findings:
1. Present the findings to the user.
2. Propose specific, targeted fixes (NOT broad reverts).
3. Wait for user approval.
4. Make minimal changes addressing the specific issue.

### Stage 6 — Commit (with user approval)

Before commit:
- Update [`docs/plans/HANDOFF.md`](docs/plans/HANDOFF.md): outgoing
  session, shipped-this-session, quality gates, recent commits,
  incoming session options.
- Update the plan doc's status section to mark what shipped and which
  commits.

Then draft the commit message and present it to the user. **Do NOT
commit autonomously.** The user reviews the message before `git commit`
runs.

### Stage 7 — Push

Once the user has approved and the commit lands, pushing to the remote
**does not require a separate confirmation**.

---

## Conventions

- **Pages**: one `.astro` file per route under `src/pages/`. Use file-based
  routing (`src/pages/about.astro` → `/about`).
- **API routes**: under `src/pages/api/`, one `.ts` file per endpoint. Always
  set `export const prerender = false;` so they run on the Worker.
- **Shared code**: under `src/lib/`. Anything testable or reused between
  routes goes here. Tests are co-located: `foo.ts` + `foo.test.ts`.
- **Cloudflare bindings**: declared in `wrangler.jsonc`, typed in
  `src/env.d.ts`, accessed via `locals.runtime.env.<NAME>`.
- **Secrets**: never commit. Local dev → `.dev.vars`. Production →
  `npx wrangler pages secret put <NAME> --project-name <slug>`.
- **Styling**: prefer Tailwind utility classes. Theme tokens live in
  `global.css` under `@theme {}`. Avoid inline styles unless dynamic.
- **TypeScript**: keep strict mode happy. Don't add `any` to silence errors —
  fix the type.

## Common commands

```bash
npm install              # First-time install
npm run dev              # Start dev server (localhost:4321)
npm run build            # Astro build → dist/
npm run preview          # Preview the built output locally
npm run lint             # Prettier check + astro check (typecheck)
npm run format           # Prettier write
npm test                 # Vitest run
npm run deploy           # Build + wrangler pages deploy
```

The dev server uses Vite/Astro and supports HMR. For Cloudflare-specific
runtime testing (KV, R2, etc.), use `npx wrangler pages dev dist/` after a
build.

## What NOT to do

- Don't add `tailwind.config.js` — Tailwind v4 is CSS-first.
- Don't import from `recipes/` — recipes are templates, not modules. Copy
  files out of them; never reference them at runtime.
- Don't commit `.env`, `.dev.vars`, or `.claude/settings.local.json` (already
  in `.gitignore`).
- Don't add backwards-compatibility shims when changing the kit itself —
  it's a template; sites that already forked it won't auto-update anyway.
- Don't introduce new top-level dependencies casually. Each one is weight on
  every site that starts from this kit. If a recipe needs it, put it in the
  recipe's README as a manual install step.

## Extending the kit itself

If during a project you discover a pattern that would be useful for *future*
sites built from this kit, suggest extracting it as a new recipe. Recipes
should be:

- **Self-contained**: copy-pasteable into any project from this template.
- **Generic**: no project-specific names, URLs, or branding.
- **Documented**: a `README.md` explaining when to use, what to copy, and
  what manual config is needed.

To add a recipe: create `recipes/<name>/`, mirror project paths under
`files/`, write the README, and add an entry to `recipes/README.md`.
