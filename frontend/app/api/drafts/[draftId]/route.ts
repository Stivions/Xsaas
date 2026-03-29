import { NextRequest } from "next/server";

import { proxyToBackend } from "@/lib/backend";

type Context = {
  params: Promise<{
    draftId: string
  }>
}

export async function PATCH(request: NextRequest, context: Context) {
  const { draftId } = await context.params;
  return proxyToBackend(request, `/api/drafts/${draftId}`);
}

export async function DELETE(request: NextRequest, context: Context) {
  const { draftId } = await context.params;
  return proxyToBackend(request, `/api/drafts/${draftId}`);
}
