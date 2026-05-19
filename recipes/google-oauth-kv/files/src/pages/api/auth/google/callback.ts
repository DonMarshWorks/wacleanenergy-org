/**
 * GET /api/auth/google/callback
 *
 * Receives Google's redirect after consent, exchanges the code for tokens,
 * stores them in KV keyed by the session UUID, and shows a success page.
 */
import type { APIRoute } from "astro";
import {
  exchangeCodeForTokens,
  fetchUserEmail,
  storeTokens,
} from "../../../../lib/google-auth";

export const prerender = false;

// Must exactly match the URL registered with Google AND the URL in start.ts.
const REDIRECT_URI = "https://example.com/api/auth/google/callback";

export const GET: APIRoute = async ({ url, locals }) => {
  const { env } = locals.runtime;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(errorPage("Authorization denied", error), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!code || !state) {
    return new Response(
      errorPage("Missing parameters", "No code or state received from Google."),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  const result = await exchangeCodeForTokens(
    code,
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );

  if (!result.ok || !result.access_token) {
    return new Response(
      errorPage("Token exchange failed", result.error ?? "Unknown error"),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  }

  const email = await fetchUserEmail(result.access_token);

  await storeTokens(env.GOOGLE_AUTH_KV, state, {
    access_token: result.access_token,
    refresh_token: result.refresh_token ?? "",
    email,
    expires_in: result.expires_in ?? 3600,
  });

  return new Response(successPage(email), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
};

function successPage(email: string | null): string {
  const emailLine = email
    ? `<p style="color:#666;margin-top:8px">${email}</p>`
    : "";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connected</title>
<style>body{background:#fff;color:#111;font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{text-align:center;padding:40px;max-width:420px}
.check{font-size:64px;margin-bottom:16px;color:#16a34a}
h1{font-size:1.4rem;font-weight:600;margin:0}
p{font-size:0.95rem;margin-top:16px;color:#666}</style></head>
<body><div class="card">
<div class="check">&#10003;</div>
<h1>Connected</h1>
${emailLine}
<p>You can close this tab.</p>
</div></body></html>`;
}

function errorPage(title: string, detail: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Error</title>
<style>body{background:#fff;color:#111;font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{text-align:center;padding:40px;max-width:420px}
.icon{font-size:64px;margin-bottom:16px;color:#dc2626}
h1{font-size:1.4rem;font-weight:600;margin:0;color:#dc2626}
p{font-size:0.95rem;margin-top:16px;color:#666}</style></head>
<body><div class="card">
<div class="icon">&#10007;</div>
<h1>${title}</h1>
<p>${detail}</p>
<p>Close this tab and try again.</p>
</div></body></html>`;
}
