# Recipes

Opt-in feature modules for the Claude Cloudflare kit. Each recipe is a
self-contained folder you copy into your project as needed.

## How a recipe is structured

```
recipes/<name>/
├── README.md                  # Overview, when to use, manual config steps
├── files/                     # Mirrors project layout — copy as-is
│   └── (e.g. src/lib/foo.ts)
├── wrangler-fragment.jsonc    # (optional) bindings to merge into wrangler.jsonc
└── env-fragment.md            # (optional) env vars / secrets the user must set
```

## How to apply a recipe (Claude)

1. Read `recipes/<name>/README.md` end-to-end.
2. Copy everything under `files/` into the project root, preserving paths.
3. Merge `wrangler-fragment.jsonc` (if present) into the project's
   `wrangler.jsonc` — append, don't overwrite.
4. Update `src/env.d.ts` to type any new bindings.
5. Surface the manual steps from `env-fragment.md` (if present) to the user.
6. Run `npm run lint` to confirm the project still typechecks.

## Available recipes

| Recipe                                                 | Purpose                                                         | Adds                                  |
| ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------- |
| [`cloudflare-pages-deploy`](cloudflare-pages-deploy/)  | Deploy to Cloudflare Pages on every push via GitHub Actions.    | `.github/workflows/deploy.yml`        |
| [`r2-asset-proxy`](r2-asset-proxy/)                    | Stream files from an R2 bucket through an SSR route.            | API route + R2 binding                |
| [`google-oauth-kv`](google-oauth-kv/)                  | Google OAuth relay with token handoff through KV.               | API routes + KV binding + lib code    |
| [`install-scripts`](install-scripts/)                  | Cross-platform installer scripts (`.sh` + `.ps1`).              | `public/install.sh`, `public/install.ps1` |

## Adding a new recipe

If you find a pattern that's reusable across multiple Claude-managed
Cloudflare sites, extract it as a new recipe:

1. Create `recipes/<kebab-name>/`.
2. Mirror project paths under `files/` (e.g. `files/src/lib/x.ts` →
   `src/lib/x.ts`).
3. Write a `README.md` with: what it does, when to use, dependencies it
   requires, and manual steps the user must take (Cloudflare resource
   creation, secrets, third-party signups, etc.).
4. Keep it generic — no project-specific names, URLs, or branding.
5. Add a row to the table above.
