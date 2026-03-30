import { randomBytes } from "node:crypto";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

function resolveGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || "http://localhost:5000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.");
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildGoogleAuthUrl(state: string): string {
  const config = resolveGoogleOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "online",
    prompt: "select_account",
    scope: "openid email profile",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCodeForToken(code: string): Promise<{
  access_token: string;
  id_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}> {
  const config = resolveGoogleOAuthConfig();

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Google token exchange failed: ${response.status} ${payload}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!data.access_token) {
    throw new Error(`Google token exchange returned no access token: ${JSON.stringify(data)}`);
  }

  return data as {
    access_token: string;
    id_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
  };
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Google userinfo fetch failed: ${response.status} ${payload}`);
  }

  const user = (await response.json()) as GoogleUserInfo;
  if (!user.email || typeof user.email !== "string") {
    throw new Error("Google userinfo response did not include a valid email.");
  }

  return user;
}

export async function verifyGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const userInfo = await fetchGoogleUserInfo(accessToken);

  if (!userInfo.email_verified) {
    throw new Error("Google account email must be verified.");
  }

  return userInfo;
}
