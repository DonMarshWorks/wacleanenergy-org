# wacleanenergy.org

Website for the **Washington Clean Energy Coalition** — an all-volunteer
nonprofit working to accelerate Washington State's clean energy transition.

Built with [Astro 5](https://astro.build/) and hosted on
[Cloudflare Pages](https://pages.cloudflare.com/). Managed with Claude Code.

Migrated from a WordPress.com site in 2026.

## Stack

- Astro 5 with the Cloudflare adapter (SSR on Workers)
- Tailwind v4 (CSS-first config in `src/styles/global.css`)
- TypeScript (strict) + Prettier + Vitest
- Wrangler for deploys

## Common commands

```bash
npm install      # First-time install
npm run dev      # Dev server (localhost:4321)
npm run build    # Build → dist/
npm run lint     # Prettier check + typecheck
npm test         # Run unit tests
npm run deploy   # Build + deploy to Cloudflare Pages
```

See [CLAUDE.md](CLAUDE.md) for the full development workflow.
