import { NextResponse } from "next/server"

function getBackendUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
}

function popupHtml(origin: string, payload: { status: string; message: string; ticketId?: string }) {
  const pollScript = payload.ticketId
    ? `
      const ticketId = ${JSON.stringify(payload.ticketId)};
      const messageNode = document.getElementById("message");
      async function poll() {
        try {
          const response = await fetch("/api/x/connect/progress?ticket=" + encodeURIComponent(ticketId), { cache: "no-store" });
          const data = await response.json();
          if (data?.message && messageNode) {
            messageNode.textContent = data.message;
          }
          if (data?.status && data.status !== "pending") {
            const finalPayload = {
              type: "xsaas-x-connect",
              status: data.status,
              message: data.message || ""
            };
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(finalPayload, ${JSON.stringify(origin)});
              try { window.opener.focus(); } catch {}
            }
            window.close();
            return;
          }
        } catch (error) {
          if (messageNode) {
            messageNode.textContent = "We could not read the X session status. Keep the X login window open and try again if this does not finish.";
          }
        }
        window.setTimeout(poll, 1500);
      }
      window.setTimeout(poll, 1200);
    `
    : `
      const finalPayload = {
        type: "xsaas-x-connect",
        status: ${JSON.stringify(payload.status)},
        message: ${JSON.stringify(payload.message)}
      };
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(finalPayload, ${JSON.stringify(origin)});
        try { window.opener.focus(); } catch {}
      }
      window.setTimeout(() => window.close(), 1200);
    `

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>X connection</title>
  </head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#09090b;color:#fafafa;font-family:ui-sans-serif,system-ui,sans-serif;">
    <div style="width:min(92vw,460px);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px;background:rgba(24,24,27,.96);box-shadow:0 20px 80px rgba(0,0,0,.35);">
      <h1 style="margin:0 0 12px;font-size:22px;">Connect your X session</h1>
      <p id="message" style="margin:0 0 16px;line-height:1.6;color:rgba(250,250,250,.78);">${payload.message}</p>
      <p style="margin:0;color:rgba(250,250,250,.58);font-size:13px;">Keep the X browser window open until we save the session. This helper window will close on its own.</p>
    </div>
    <script>${pollScript}</script>
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
  const response = await fetch(`${getBackendUrl()}/api/x/connect/start`, {
    method: "POST",
    headers: {
      cookie: request.headers.get("cookie") || ""
    },
    cache: "no-store"
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    return popupHtml(url.origin, {
      status: "error",
      message: String(payload.error || "Could not start the X browser session.")
    })
  }

  return popupHtml(url.origin, {
    status: String(payload.status || "pending"),
    message: String(
      payload.message ||
        "We opened an X browser window. Finish logging in there and we will save the session automatically."
    ),
    ticketId: String(payload.ticketId || "")
  })
}
