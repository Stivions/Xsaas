import { Router } from "express";

import { Draft } from "../models/Draft.js";
import { Workspace } from "../models/Workspace.js";
import { runWorkspaceAutomation } from "../lib/automation.js";

async function getWorkspace(req) {
  return Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });
}

export function createAutomationRouter(config) {
  const router = Router();

  router.get("/status", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const lastDraft = workspace.automation?.lastDraftId
      ? await Draft.findById(workspace.automation.lastDraftId)
      : null;

    return res.json({
      automation: {
        enabled: Boolean(workspace.automation?.enabled),
        language: workspace.automation?.language || "es",
        tone: workspace.automation?.tone || "sharp",
        topics: workspace.automation?.topics || [],
        brandVoice: workspace.automation?.brandVoice || "",
        audience: workspace.automation?.audience || "",
        cadenceMinutes: workspace.automation?.cadenceMinutes || config.automation.defaultCadenceMinutes,
        mode: workspace.automation?.mode || "draft_only",
        lastRunAt: workspace.automation?.lastRunAt || null,
        lastStatus: workspace.automation?.lastStatus || "idle",
        lastError: workspace.automation?.lastError || "",
        lastDraft: lastDraft
          ? {
              id: String(lastDraft._id),
              content: lastDraft.content,
              status: lastDraft.status,
              updatedAt: lastDraft.updatedAt
            }
          : null
      }
    });
  });

  router.post("/run", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    try {
      const draft = await runWorkspaceAutomation(config, workspace._id, { force: true });
      return res.status(201).json({
        ok: true,
        draft: {
          id: String(draft._id),
          content: draft.content,
          status: draft.status,
          source: draft.source,
          characterCount: draft.characterCount,
          updatedAt: draft.updatedAt
        }
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Automation failed."
      });
    }
  });

  return router;
}
