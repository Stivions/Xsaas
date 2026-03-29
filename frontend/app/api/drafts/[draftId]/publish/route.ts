import { NextRequest } from "next/server"

import { proxyToBackend } from "@/lib/backend"

type RouteContext = {
  params: Promise<{
    draftId: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { draftId } = await context.params
  return proxyToBackend(request, `/api/drafts/${draftId}/publish`)
}
