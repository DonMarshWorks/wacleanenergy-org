# Recipe: cloudflare-pages-deploy

GitHub Actions workflow that builds the Astro site and deploys to Cloudflare
Pages on every push. The deployed branch becomes a Pages preview, with the
default branch deploying to production.

## When to use

- You want push-to-deploy without running `npm run deploy` locally.
- You're hosting the repo on GitHub.
- The Cloudflare Pages project already exists (or you'll create it before
  the first push).

## What it adds

| File                              | Purpose                       |
| --------------------------------- | ----------------------------- |
| `.github/workflows/deploy.yml`    | Build + deploy on every push. |

## Apply

1. Copy `files/.github/workflows/deploy.yml` to
   `.github/workflows/deploy.yml` in the project.
2. Replace `PROJECT_NAME` in the workflow with the Cloudflare Pages project
   slug (same value as `wrangler.jsonc` `name`).

## Manual steps for the user

The user (not Claude) must add two **GitHub repo secrets**:

- `CLOUDFLARE_API_TOKEN` — create at
  https://dash.cloudflare.com/profile/api-tokens, using the
  "Edit Cloudflare Workers" template (or a custom token with Pages: Edit).
- `CLOUDFLARE_ACCOUNT_ID` — find on the Cloudflare dashboard right sidebar.

Add them under: GitHub repo → Settings → Secrets and variables → Actions →
New repository secret.

## Notes

- The workflow runs on **all branches** (`branches: ['**']`). Cloudflare
  Pages auto-treats the production branch as production and others as
  previews. Adjust the trigger if you want stricter deploys.
- If your build needs additional env vars (e.g. `PUBLIC_*`), add them
  under the `npx astro build` step.
