import { NextRequest, NextResponse } from "next/server";

function getBackendUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export async function proxyToBackend(request: NextRequest, backendPath: string, method = request.method) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");

  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (authorization) {
    headers.set("authorization", authorization);
  }
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());
  const body = hasBody ? await request.text() : undefined;
  const response = await fetch(`${getBackendUrl()}${backendPath}`, {
    method,
    headers,
    body,
    cache: "no-store"
  });

  const payload = await response.text();
  const nextResponse = new NextResponse(payload, {
    status: response.status
  });

  const responseContentType = response.headers.get("content-type");
  const setCookie = response.headers.get("set-cookie");

  if (responseContentType) {
    nextResponse.headers.set("content-type", responseContentType);
  }
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  return nextResponse;
}
