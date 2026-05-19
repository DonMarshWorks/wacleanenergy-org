/**
 * Google OAuth relay — public site acts as the OAuth redirect target on
 * behalf of clients (CLIs, devices, headless servers) that can't receive
 * redirects directly. Tokens are held briefly in Cloudflare KV
 * (globally consistent) and consumed by the client via a single read.
 */

import type { KVNamespace } from "@cloudflare/workers-types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo";

// Adjust per project. Space-separated for multiple scopes.
const SCOPES = "openid email profile";

const KV_TTL_SECONDS = 300; // 5 minutes

// ─── KV helpers ────────────────────────────────────────────────────────────

export interface CachedTokens {
  access_token: string;
  refresh_token: string;
  email: string | null;
  expires_in: number;
}

/**
 * Read tokens from KV and immediately delete them — first reader wins.
 */
export async function consumeTokens(
  kv: KVNamespace,
  session: string,
): Promise<CachedTokens | null> {
  const value = await kv.get(session, "json");
  if (!value) return null;
  await kv.delete(session);
  return value as CachedTokens;
}

export async function storeTokens(
  kv: KVNamespace,
  session: string,
  tokens: CachedTokens,
): Promise<void> {
  await kv.put(session, JSON.stringify(tokens), {
    expirationTtl: KV_TTL_SECONDS,
  });
}

// ─── Auth URL ──────────────────────────────────────────────────────────────

export function buildAuthUrl(
  clientId: string,
  redirectUri: string,
  session: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state: session,
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

// ─── Token exchange ────────────────────────────────────────────────────────

export interface TokenExchangeResult {
  ok: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<TokenExchangeResult> {
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await resp.json()) as Record<string, unknown>;

  if (!resp.ok || !data.access_token) {
    return {
      ok: false,
      error: (data.error_description ??
        data.error ??
        "Token exchange failed") as string,
    };
  }

  return {
    ok: true,
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string | undefined,
    expires_in: data.expires_in as number | undefined,
  };
}

// ─── Token refresh ─────────────────────────────────────────────────────────

export interface TokenRefreshResult {
  ok: boolean;
  access_token?: string;
  expires_in?: number;
  error?: string;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenRefreshResult> {
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = (await resp.json()) as Record<string, unknown>;

  if (!resp.ok || !data.access_token) {
    return {
      ok: false,
      error: (data.error_description ??
        data.error ??
        "Token refresh failed") as string,
    };
  }

  return {
    ok: true,
    access_token: data.access_token as string,
    expires_in: data.expires_in as number | undefined,
  };
}

// ─── User info ─────────────────────────────────────────────────────────────

/**
 * Best-effort fetch of the authenticated user's email.
 */
export async function fetchUserEmail(
  accessToken: string,
): Promise<string | null> {
  try {
    const resp = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as Record<string, unknown>;
    return (data.email as string) ?? null;
  } catch {
    return null;
  }
}
