import { Router } from "express";

import { Draft } from "../models/Draft.js";
import { Workspace } from "../models/Workspace.js";
import { XAccount } from "../models/XAccount.js";
import { createXPost, getFreshAccessTokenForAccount } from "../lib/x.js";

function serializeDraft(draft) {
  return {
    id: String(draft._id),
    content: draft.content,
    status: draft.status,
    source: draft.source,
    characterCount: draft.characterCount,
    scheduledFor: draft.scheduledFor,
    externalPostId: draft.externalPostId || "",
    externalPostUrl: draft.externalPostUrl || "",
    publishedAt: draft.publishedAt || null,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt
  };
}

async function getWorkspace(req) {
  return Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });
}

function buildPostUrl(username, postId) {
  if (!username || !postId) {
    return "";
  }

  return `https://x.com/${String(username).replace(/^@/, "")}/status/${postId}`;
}

async function publishDraftToX(config, workspace, draft) {
  const xAccount = await XAccount.findOne({ workspaceId: workspace._id });
  if (!xAccount) {
    throw new Error("Connect an X account before publishing.");
  }

  try {
    const accessToken = await getFreshAccessTokenForAccount(config, xAccount);
    const payload = await createXPost(config, accessToken, draft.content);
    const postId = payload?.data?.id || "";
    const postUrl = buildPostUrl(xAccount.username, postId);
    const publishedAt = new Date();

    draft.status = "published";
    draft.publishedAt = publishedAt;
    draft.scheduledFor = null;
    draft.externalPostId = postId;
    draft.externalPostUrl = postUrl;
    await draft.save();

    workspace.xConnectionStatus = "connected";
    workspace.automation.lastPublishedPostId = postId;
    workspace.automation.lastPublishedPostUrl = postUrl;
    workspace.automation.lastPublishedAt = publishedAt;
    workspace.automation.lastStatus = "success";
    workspace.automation.lastError = "";
    await workspace.save();

    xAccount.lastUsedAt = publishedAt;
    xAccount.lastError = "";
    await xAccount.save();

    return draft;
  } catch (error) {
    workspace.automation.lastStatus = "error";
    workspace.automation.lastError = error instanceof Error ? error.message : "Failed to publish draft.";
    await workspace.save();

    if (xAccount) {
      xAccount.lastError = error instanceof Error ? error.message : "Failed to publish draft.";
      await xAccount.save();
    }

    throw error;
  }
}

export function createDraftsRouter(config) {
  const router = Router();

  router.get("/", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const drafts = await Draft.find({ workspaceId: workspace._id }).sort({ updatedAt: -1 }).limit(100);
    return res.json({
      drafts: drafts.map(serializeDraft)
    });
  });

  router.post("/", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const content = String(req.body?.content || "").trim();
    if (!content) {
      return res.status(400).json({ error: "Draft content is required." });
    }

    const status = ["draft", "scheduled", "published"].includes(String(req.body?.status || ""))
      ? String(req.body.status)
      : "draft";
    const source = ["manual", "automation"].includes(String(req.body?.source || "")) ? String(req.body.source) : "manual";
    const scheduledFor = req.body?.scheduledFor ? new Date(req.body.scheduledFor) : null;

    const draft = await Draft.create({
      userId: req.auth.sub,
      workspaceId: workspace._id,
      content,
      status,
      source,
      characterCount: content.length,
      scheduledFor: scheduledFor && !Number.isNaN(scheduledFor.getTime()) ? scheduledFor : null
    });

    return res.status(201).json({
      draft: serializeDraft(draft)
    });
  });

  router.patch("/:draftId", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const draft = await Draft.findOne({ _id: req.params.draftId, workspaceId: workspace._id });
    if (!draft) {
      return res.status(404).json({ error: "Draft not found." });
    }

    if (req.body?.content != null) {
      draft.content = String(req.body.content).trim();
      draft.characterCount = draft.content.length;
    }
    if (req.body?.status != null && ["draft", "scheduled", "published"].includes(String(req.body.status))) {
      draft.status = String(req.body.status);
    }
    if (req.body?.scheduledFor !== undefined) {
      draft.scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : null;
    }

    await draft.save();
    return res.json({ draft: serializeDraft(draft) });
  });

  router.post("/:draftId/publish", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const draft = await Draft.findOne({ _id: req.params.draftId, workspaceId: workspace._id });
    if (!draft) {
      return res.status(404).json({ error: "Draft not found." });
    }

    if (!draft.content?.trim()) {
      return res.status(400).json({ error: "Draft content is required before publishing." });
    }

    if (draft.externalPostId) {
      draft.status = "published";
      await draft.save();
      return res.json({ draft: serializeDraft(draft) });
    }

    try {
      const publishedDraft = await publishDraftToX(config, workspace, draft);
      return res.json({ draft: serializeDraft(publishedDraft) });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to publish draft."
      });
    }
  });

  router.delete("/:draftId", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const deleted = await Draft.findOneAndDelete({ _id: req.params.draftId, workspaceId: workspace._id });
    if (!deleted) {
      return res.status(404).json({ error: "Draft not found." });
    }

    return res.json({ ok: true });
  });

  return router;
}
