/// <reference types="astro/client" />

import type { CacheStorage as CloudflareCacheStorage } from "@cloudflare/workers-types";

// Cloudflare bindings exposed to your Worker. Add fields as you apply
// recipes that need bindings (KV, R2, D1, secrets, etc.).
type CloudflareEnv = {
  // Example: GOOGLE_CLIENT_ID: string;
  // Example: SESSIONS: KVNamespace;
  // Example: ASSETS_BUCKET: R2Bucket;
};

declare global {
  namespace App {
    interface Locals {
      runtime: {
        env: CloudflareEnv;
        caches: CloudflareCacheStorage;
        cf: unknown;
        ctx: { waitUntil(promise: Promise<unknown>): void };
      };
    }
  }
}

export {};
