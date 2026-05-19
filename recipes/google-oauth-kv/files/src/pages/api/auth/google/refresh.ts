/**
 * POST /api/auth/google/refresh
 *
 * Refreshes an access token. The client_secret is held server-side so
 * the polling client never needs to store it.
 *
 * Body:    { "refresh_token": "..." }
 * Returns: { "access_token": "...", "expires_in": 3600 }
 */
import type { APIRoute } from "astro";
import { refreshAccessToken } from "../../../../lib/google-auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  let body: { refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const refreshToken = body.refresh_token;
  if (!refreshToken) {
    return Response.json(
      { error: "refresh_token is required" },
      { status: 400 },
    );
  }

  const result = await refreshAccessToken(
    refreshToken,
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );

  if (!result.ok) {
    return Response.json(
      { error: result.error ?? "Token refresh failed" },
      { status: 401 },
    );
  }

  return Response.json({
    access_token: result.access_token,
    expires_in: result.expires_in ?? 3600,
  });
};
