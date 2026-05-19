# Recipe: google-oauth-kv

Google OAuth relay where your Cloudflare site is the redirect target, and
tokens are briefly held in Cloudflare KV for a backend (or another browser
tab) to retrieve via polling.

This is the right shape when:

- The thing that wants the tokens **can't be the OAuth redirect target**
  (e.g. a local CLI, a headless device, a Fire TV, a server without a
  public URL).
- You want one well-known public URL handling consent so users see a
  trustworthy hostname.
- You want short-lived token transit through KV (5 min TTL, single-read
  consume).

If you need full session-based auth (logged-in users, persistent cookies),
this isn't quite the right pattern — use a session-cookie approach
instead. This recipe is specifically for the **handoff** case.

## What it adds

| File                                            | Purpose                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| `src/lib/google-auth.ts`                        | KV helpers, OAuth URL builder, token exchange.     |
| `src/lib/google-auth.test.ts`                   | Vitest unit tests for the lib.                     |
| `src/pages/api/auth/google/start.ts`            | `GET /api/auth/google/start?session=UUID` → redirects to Google consent. |
| `src/pages/api/auth/google/callback.ts`         | Receives Google's redirect, stores tokens in KV.   |
| `src/pages/api/auth/google/poll.ts`             | `GET /api/auth/google/poll?session=UUID` → consumes tokens (first reader wins). |
| `src/pages/api/auth/google/refresh.ts`          | `POST /api/auth/google/refresh` → refreshes an access token. |

## Apply

1. Copy everything under `files/` into the project, preserving paths.
2. Merge `wrangler-fragment.jsonc` into `wrangler.jsonc`.
3. Update `src/env.d.ts`:
   ```ts
   import type { KVNamespace } from "@cloudflare/workers-types";
   type CloudflareEnv = {
     GOOGLE_CLIENT_ID: string;
     GOOGLE_CLIENT_SECRET: string;
     GOOGLE_AUTH_KV: KVNamespace;
     // ...
   };
   ```
4. **Edit `src/lib/google-auth.ts`** to set `SCOPES` for what you actually
   need from Google. Default: `"openid email profile"`. Common alternatives:
   - Drive read+write: `https://www.googleapis.com/auth/drive`
   - Drive read-only: `https://www.googleapis.com/auth/drive.readonly`
   - Calendar: `https://www.googleapis.com/auth/calendar`
   - Multiple scopes: space-separated.
5. **Edit `REDIRECT_URI`** in `start.ts` and `callback.ts` to match your
   site's production URL (`https://<your-domain>/api/auth/google/callback`).
   Keep both files in sync — Google validates redirect URIs exactly.

## Manual steps for the user

### 1. Create a Google OAuth client

1. Go to https://console.cloud.google.com/apis/credentials
2. Create credentials → OAuth client ID → Web application.
3. Authorized redirect URI: `https://<your-domain>/api/auth/google/callback`.
4. Copy the Client ID and Client Secret.

### 2. Create the Cloudflare KV namespace

```bash
npx wrangler kv namespace create GOOGLE_AUTH_KV
```

This prints an `id`. Paste it into `wrangler.jsonc` (the fragment uses
`REPLACE_WITH_KV_ID`).

### 3. Set the secrets

```bash
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name <slug>
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name <slug>
```

For local dev, add them to `.dev.vars` instead (gitignored).

## How the flow works

```
┌─────────┐   1. open /api/auth/google/start?session=UUID
│ Browser │ ─────────────────────────────────────────────►
└─────────┘
              2. 302 → Google consent screen
              3. user consents
              4. Google → /api/auth/google/callback?code=...&state=UUID
              5. callback exchanges code, stores tokens in KV[UUID]
              6. callback shows success HTML
┌──────────┐
│ Backend  │   7. polls /api/auth/google/poll?session=UUID
│ (or tab) │ ─────────────────────────────────────────────►
└──────────┘  8. tokens returned + deleted from KV (first reader wins)
              9. backend uses access_token; on expiry, POSTs refresh_token
                 to /api/auth/google/refresh
```

## Notes

- KV TTL is 5 minutes. If the polling side doesn't read within that window,
  the user has to start over.
- `consumeTokens` is **delete-after-read** — the second poller will see
  `pending`. Don't poll concurrently from multiple processes.
- The success/error HTML is intentionally framework-free (inline styles).
  Tweak in `callback.ts` to match the rest of your site.
- The polling endpoint is unauthenticated *but* the session UUID is the
  capability — anyone with it gets the tokens. Generate UUIDs server-side
  (or via `crypto.randomUUID()` in a trusted context) and treat them as
  one-time secrets.
