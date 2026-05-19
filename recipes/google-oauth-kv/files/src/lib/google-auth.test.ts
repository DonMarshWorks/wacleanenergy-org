import { describe, it, expect, vi, beforeEach } from "vitest";
import type { KVNamespace } from "@cloudflare/workers-types";
import {
  buildAuthUrl,
  storeTokens,
  consumeTokens,
  type CachedTokens,
} from "./google-auth";

function fakeKv() {
  const store = new Map<string, string>();
  const kv = {
    get: vi.fn(async (key: string, type?: "json") => {
      const v = store.get(key);
      if (v === undefined) return null;
      return type === "json" ? JSON.parse(v) : v;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  } as unknown as KVNamespace;
  return { kv, store };
}

describe("buildAuthUrl", () => {
  it("includes client_id, redirect_uri, scope, and state", () => {
    const url = buildAuthUrl("client-123", "https://x/y", "session-abc");
    expect(url).toContain("client_id=client-123");
    expect(url).toContain("redirect_uri=https%3A%2F%2Fx%2Fy");
    expect(url).toContain("state=session-abc");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("scope=");
  });
});

describe("storeTokens / consumeTokens", () => {
  let kv: KVNamespace;
  let store: Map<string, string>;

  beforeEach(() => {
    ({ kv, store } = fakeKv());
  });

  const tokens: CachedTokens = {
    access_token: "AT",
    refresh_token: "RT",
    email: "u@example.com",
    expires_in: 3600,
  };

  it("round-trips tokens through KV", async () => {
    await storeTokens(kv, "s1", tokens);
    expect(store.get("s1")).toBeDefined();

    const got = await consumeTokens(kv, "s1");
    expect(got).toEqual(tokens);
  });

  it("returns null when no tokens are present", async () => {
    expect(await consumeTokens(kv, "missing")).toBeNull();
  });

  it("deletes tokens after consumption (first reader wins)", async () => {
    await storeTokens(kv, "s1", tokens);
    await consumeTokens(kv, "s1");
    expect(await consumeTokens(kv, "s1")).toBeNull();
  });
});
