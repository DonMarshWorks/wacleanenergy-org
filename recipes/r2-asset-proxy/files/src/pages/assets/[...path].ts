/**
 * Streams files from an R2 bucket. Mounted at the route's URL prefix
 * (rename the parent folder to change the prefix — e.g. /assets/ vs /files/).
 *
 * Supports ETag-based 304s and forces download for archive types.
 */
import type { APIRoute } from "astro";

export const prerender = false;

// Optional: prefix all reads with a subfolder of the bucket. Empty = root.
const R2_KEY_PREFIX = "";

// File extensions that should download rather than render inline.
const DOWNLOAD_EXTENSIONS = [".tar.gz", ".tgz", ".zip", ".7z"];

export const GET: APIRoute = async ({ params, request, locals }) => {
  const key = params.path;
  if (!key || key.includes("..") || key.includes("\\") || key.startsWith("/")) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = locals.runtime.env.ASSETS_BUCKET;
  const fullKey = R2_KEY_PREFIX ? `${R2_KEY_PREFIX}/${key}` : key;
  const object = await bucket.get(fullKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const contentType =
    object.httpMetadata?.contentType || "application/octet-stream";
  const cacheControl =
    object.httpMetadata?.cacheControl || "public, max-age=3600";

  // Honour client cache via ETag round-trip.
  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch && ifNoneMatch === object.httpEtag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: object.httpEtag, "Cache-Control": cacheControl },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", cacheControl);
  headers.set("ETag", object.httpEtag);
  if (object.size !== undefined) {
    headers.set("Content-Length", String(object.size));
  }

  if (DOWNLOAD_EXTENSIONS.some((ext) => key.endsWith(ext))) {
    const raw = key.split("/").pop() || "download";
    const filename = raw.replace(/[^A-Za-z0-9._-]/g, "_");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }

  return new Response(object.body as ReadableStream, { headers });
};
