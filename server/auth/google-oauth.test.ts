import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGoogleAuthState,
  buildGoogleAuthUrl,
  exchangeGoogleCodeForToken,
  fetchGoogleUserInfo,
  verifyGoogleUserInfo,
} from "./google-oauth.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("buildGoogleAuthState returns a random hex string of expected length", () => {
  const state = buildGoogleAuthState();
  assert.equal(typeof state, "string");
  assert.equal(state.length, 48);
});

test("buildGoogleAuthUrl includes the configured client id, redirect uri, and state", () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test-secret";
  process.env.GOOGLE_OAUTH_REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";

  const url = buildGoogleAuthUrl("test-state");
  const parsed = new URL(url);

  assert.equal(parsed.origin, "https://accounts.google.com");
  assert.equal(parsed.pathname, "/o/oauth2/v2/auth");
  assert.equal(parsed.searchParams.get("client_id"), "test-client");
  assert.equal(parsed.searchParams.get("redirect_uri"), "http://localhost:5000/api/auth/google/callback");
  assert.equal(parsed.searchParams.get("state"), "test-state");
  assert.equal(parsed.searchParams.get("response_type"), "code");
  assert.equal(parsed.searchParams.get("scope"), "openid email profile");
});

test("exchangeGoogleCodeForToken throws when Google returns a non-ok response", async () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client";
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test-secret";
  process.env.GOOGLE_OAUTH_REDIRECT_URI = "http://localhost:5000/api/auth/google/callback";

  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    text: async () => "bad request",
  } as Response);

  await assert.rejects(
    async () => {
      await exchangeGoogleCodeForToken("bad-code");
    },
    {
      message: /Google token exchange failed/,
    },
  );
});

test("fetchGoogleUserInfo throws when Google userinfo response lacks email", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ name: "Test User" }),
  } as Response);

  await assert.rejects(
    async () => {
      await fetchGoogleUserInfo("invalid-token");
    },
    {
      message: /Google userinfo response did not include a valid email/,
    },
  );
});

test("verifyGoogleUserInfo throws when email is not verified", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      email: "test@example.com",
      email_verified: false,
    }),
  } as Response);

  await assert.rejects(
    async () => {
      await verifyGoogleUserInfo("valid-token");
    },
    {
      message: /Google account email must be verified/,
    },
  );
});
