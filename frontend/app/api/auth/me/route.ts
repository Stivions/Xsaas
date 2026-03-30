import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const optional = url.searchParams.get("optional");
  const backendPath = optional ? `/api/auth/me?optional=${encodeURIComponent(optional)}` : "/api/auth/me";
  return proxyToBackend(request, backendPath);
}
