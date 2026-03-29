import { NextResponse } from "next/server"

function getBackendUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
}

function popupResponse(origin: string, status: string) {
  const html = `<!doctype html>
<html>
  <body style="font-family: sans-serif; padding: 24px;">
    <p>You can close this window.</p>
    <script>
      const payload = ${JSON.stringify({ type: "xsaas-x-connect", status })};
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, ${JSON.stringify(origin)});
      }
      window.close();
    </script>
  </body>
</html>`

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code") || ""
  const state = url.searchParams.get("state") || ""
  const error = url.searchParams.get("error") || ""
  const cookiePayload = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("xsaas_x_oauth="))
    ?.split("=")
    .slice(1)
    .join("=")

  const redirectBase = new URL("/dashboard/settings", url.origin)

  if (error) {
    redirectBase.searchParams.set("x", "oauth_error")
    const response = NextResponse.redirect(redirectBase)
    response.cookies.delete("xsaas_x_oauth")
    return response
  }

  if (!code || !state || !cookiePayload) {
    redirectBase.searchParams.set("x", "invalid_callback")
    const response = NextResponse.redirect(redirectBase)
    response.cookies.delete("xsaas_x_oauth")
    return response
  }

  let verifier = ""
  let expectedState = ""
  let popup = false
  try {
    const decoded = JSON.parse(decodeURIComponent(cookiePayload))
    verifier = decoded.verifier || ""
    expectedState = decoded.state || ""
    popup = Boolean(decoded.popup)
  } catch {
    if (!popup) {
      redirectBase.searchParams.set("x", "invalid_state")
    }
    const response = popup ? popupResponse(url.origin, "invalid_state") : NextResponse.redirect(redirectBase)
    response.cookies.delete("xsaas_x_oauth")
    return response
  }

  if (!verifier || state !== expectedState) {
    if (!popup) {
      redirectBase.searchParams.set("x", "state_mismatch")
    }
    const response = popup ? popupResponse(url.origin, "state_mismatch") : NextResponse.redirect(redirectBase)
    response.cookies.delete("xsaas_x_oauth")
    return response
  }

  const backendResponse = await fetch(`${getBackendUrl()}/api/x/connect/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || ""
    },
    body: JSON.stringify({ code, state, verifier })
  })

  const status = backendResponse.ok ? "connected" : "error"
  if (!popup) {
    redirectBase.searchParams.set("x", status)
  }

  const response = popup ? popupResponse(url.origin, status) : NextResponse.redirect(redirectBase)
  response.cookies.delete("xsaas_x_oauth")
  return response
}
