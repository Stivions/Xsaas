import crypto from "node:crypto";

import { decryptSecret, encryptSecret } from "./crypto.js";

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkcePair() {
  const verifier = toBase64Url(crypto.randomBytes(48));
  const challenge = toBase64Url(crypto.createHash("sha256").update(verifier).digest());
  const state = crypto.randomUUID();
  return { verifier, challenge, state };
}

function getBasicAuth(config) {
  if (!config.x.clientSecret) {
    return "";
  }
  return Buffer.from(`${config.x.clientId}:${config.x.clientSecret}`).toString("base64");
}

export function normalizeXErrorMessage(error) {
  const raw = String(error instanceof Error ? error.message : error || "").trim();
  if (!raw) {
    return "X rejected the request.";
  }

  if (/does not have any credits to fulfill this request/i.test(raw)) {
    return "X rejected the publish request because the developer account has no API credits. The account is still connected.";
  }

  if (/Unauthorized|invalid token|expired token/i.test(raw)) {
    return "X rejected the request because the session token is no longer valid. Reconnect the account and try again.";
  }

  if (/duplicate/i.test(raw)) {
    return "X rejected the post because the content looks duplicated.";
  }

  return raw;
}

export function buildXAuthorizationUrl(config, { state, challenge }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.x.clientId,
    redirect_uri: config.x.redirectUri,
    scope: config.x.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });

  return `${config.x.authUrl}?${params.toString()}`;
}

async function tokenRequest(config, body) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };
  const basicAuth = getBasicAuth(config);
  if (basicAuth) {
    headers.Authorization = `Basic ${basicAuth}`;
  }

  const response = await fetch(config.x.tokenUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(body).toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || payload.detail || "X token request failed.");
  }

  return payload;
}

export async function exchangeXCode(config, { code, verifier }) {
  return tokenRequest(config, {
    code,
    grant_type: "authorization_code",
    client_id: config.x.clientId,
    redirect_uri: config.x.redirectUri,
    code_verifier: verifier
  });
}

export async function refreshXToken(config, refreshToken) {
  return tokenRequest(config, {
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: config.x.clientId
  });
}

export async function xApiRequest(config, path, { method = "GET", accessToken, body, query } = {}) {
  const url = new URL(path.startsWith("http") ? path : `${config.x.apiBaseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(normalizeXErrorMessage(payload?.detail || payload?.title || payload?.error || "X API request failed."));
  }

  return payload;
}

export async function getAuthenticatedXUser(config, accessToken) {
  const payload = await xApiRequest(config, "/2/users/me", {
    accessToken,
    query: {
      "user.fields": "id,name,username,profile_image_url,verified"
    }
  });

  return payload.data || null;
}

export async function createXPost(config, accessToken, text) {
  return xApiRequest(config, "/2/tweets", {
    method: "POST",
    accessToken,
    body: {
      text
    }
  });
}

export async function getFreshAccessTokenForAccount(config, xAccount) {
  if (!xAccount?.accessTokenEnc) {
    throw new Error("X account is not connected.");
  }

  const now = Date.now();
  const expiresAt = xAccount.expiresAt ? new Date(xAccount.expiresAt).getTime() : 0;
  let accessToken = decryptSecret(xAccount.accessTokenEnc, config.encryptionSecret);

  if (expiresAt && now < expiresAt - 120_000) {
    return accessToken;
  }

  if (!xAccount.refreshTokenEnc) {
    return accessToken;
  }

  const refreshToken = decryptSecret(xAccount.refreshTokenEnc, config.encryptionSecret);
  const refreshed = await refreshXToken(config, refreshToken);

  accessToken = refreshed.access_token || accessToken;
  xAccount.accessTokenEnc = encryptSecret(accessToken, config.encryptionSecret);
  if (refreshed.refresh_token) {
    xAccount.refreshTokenEnc = encryptSecret(refreshed.refresh_token, config.encryptionSecret);
  }
  xAccount.tokenType = refreshed.token_type || xAccount.tokenType || "bearer";
  xAccount.scopes = String(refreshed.scope || "")
    .split(/\s+/)
    .filter(Boolean);
  xAccount.expiresAt = refreshed.expires_in ? new Date(Date.now() + Number(refreshed.expires_in) * 1000) : xAccount.expiresAt;
  xAccount.lastRefreshAt = new Date();
  xAccount.lastError = "";
  await xAccount.save();

  return accessToken;
}
