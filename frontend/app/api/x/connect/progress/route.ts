import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ticket = url.searchParams.get("ticket") || "";
  return proxyToBackend(request, `/api/x/connect/progress?ticket=${encodeURIComponent(ticket)}`);
}
