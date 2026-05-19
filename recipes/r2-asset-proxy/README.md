# Recipe: r2-asset-proxy

Serve files from a Cloudflare R2 bucket through a path-prefixed SSR route.
Supports streaming, ETag-based 304s, and a `Content-Disposition` hint for
downloadable archives. Useful for download pages, gated assets, or static
content that's too large/dynamic for the build output.

## When to use

- You have files (release tarballs, large media, generated PDFs, etc.) you
  want served at a stable URL but don't want to bake into the deploy.
- You want HTTP caching with ETag round-trips.
- You don't need access control yet (this recipe is unauthenticated). Add
  auth in the route handler if you do.

## What it adds

| File                                        | Purpose                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| `src/pages/assets/[...path].ts`             | SSR route that streams from R2 at `/assets/<path>`.   |

Plus an R2 bucket binding in `wrangler.jsonc` (see fragment).

## Apply

1. Copy `files/src/pages/assets/[...path].ts` →
   `src/pages/assets/[...path].ts`.
   - If you want a different URL prefix, rename `assets` to whatever you
     like (e.g. `downloads`, `files`).
2. Merge `wrangler-fragment.jsonc` into the project's `wrangler.jsonc`:
   add the `r2_buckets` array (or merge into an existing one).
3. Update `src/env.d.ts`:
   ```ts
   import type { R2Bucket } from "@cloudflare/workers-types";
   type CloudflareEnv = {
     ASSETS_BUCKET: R2Bucket;
     // ...
   };
   ```
4. Adjust `R2_KEY_PREFIX` in the route file if you want to scope reads to
   a subfolder of the bucket (default: no prefix).

## Manual steps for the user

Create the R2 bucket in Cloudflare:

```bash
npx wrangler r2 bucket create <bucket-name>
```

Then update `wrangler.jsonc` with the actual `bucket_name` (the binding
name `ASSETS_BUCKET` is what the code references; the bucket name is the
Cloudflare-side identifier).

Upload files with:

```bash
npx wrangler r2 object put <bucket-name>/path/to/file.zip --file ./local.zip
```

## Notes

- The route does basic path traversal protection (`..`, leading `/`).
- ETag handling uses R2's `httpEtag` field (works out of the box).
- For `.tar.gz` files, the route sets `Content-Disposition: attachment` so
  browsers download instead of trying to render. Adjust the file-extension
  list in the route as needed.
- This route is **unauthenticated**. If you need auth, add it inside the
  handler before reading from R2.
