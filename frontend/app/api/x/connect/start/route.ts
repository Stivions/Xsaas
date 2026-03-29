import crypto from "node:crypto"

import { NextResponse } from "next/server"

function getBackendUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
}

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function createPkcePair() {
  const verifier = toBase64Url(crypto.randomBytes(48))
  const challenge = toBase64Url(crypto.createHash("sha256").update(verifier).digest())
  const state = crypto.randomUUID()
  return { verifier, challenge, state }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin
  let clientId = process.env.X_CLIENT_ID || ""
  let redirectUri = process.env.X_REDIRECT_URI || `${appUrl.replace(/\/+$/, "")}/api/x/connect/callback`
  let scopes = (process.env.X_SCOPES || "tweet.read tweet.write users.read offline.access").trim()

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/api/x/status`, {
      headers: {
        cookie: request.headers.get("cookie") || ""
      },
      cache: "no-store"
    })

    if (backendResponse.ok) {
      const payload = await backendResponse.json()
      clientId = String(payload.clientId || clientId || "")
      redirectUri = String(payload.redirectUri || redirectUri)
      scopes = Array.isArray(payload.scopes) ? payload.scopes.join(" ") : scopes
    }
  } catch {
    // fall back to local env configuration
  }

  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard/settings?x=missing_client", url.origin))
  }

  const { verifier, challenge, state } = createPkcePair()
  const authorizeUrl = new URL(process.env.X_AUTH_URL || "https://x.com/i/oauth2/authorize")
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("client_id", clientId)
  authorizeUrl.searchParams.set("redirect_uri", redirectUri)
  authorizeUrl.searchParams.set("scope", scopes)
  authorizeUrl.searchParams.set("state", state)
  authorizeUrl.searchParams.set("code_challenge", challenge)
  authorizeUrl.searchParams.set("code_challenge_method", "S256")

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set("xsaas_x_oauth", JSON.stringify({ verifier, state }), {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 60 * 10,
    path: "/"
  })
  return response
}
