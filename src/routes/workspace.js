import { Router } from "express";

import { Workspace } from "../models/Workspace.js";

function sanitizeTopics(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function createWorkspaceRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    const workspace = await Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    return res.json({
      workspace: {
        id: String(workspace._id),
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        status: workspace.status,
        xConnectionStatus: workspace.xConnectionStatus,
        automation: {
          enabled: Boolean(workspace.automation?.enabled),
          language: workspace.automation?.language || "es",
          tone: workspace.automation?.tone || "sharp",
          topics: workspace.automation?.topics || [],
          brandVoice: workspace.automation?.brandVoice || "",
          audience: workspace.automation?.audience || "",
          cadenceMinutes: workspace.automation?.cadenceMinutes || 180,
          mode: workspace.automation?.mode || "draft_only",
          lastRunAt: workspace.automation?.lastRunAt || null,
          lastStatus: workspace.automation?.lastStatus || "idle",
          lastError: workspace.automation?.lastError || "",
          lastDraftId: workspace.automation?.lastDraftId || ""
        }
      }
    });
  });

  router.patch("/", async (req, res) => {
    const workspace = await Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const { name = "", automation = {} } = req.body || {};

    if (String(name || "").trim()) {
      workspace.name = String(name).trim();
    }

    workspace.automation.enabled = Boolean(automation.enabled);
    workspace.automation.language = ["en", "es"].includes(String(automation.language || "")) ? String(automation.language) : "es";
    workspace.automation.tone = String(automation.tone || "sharp").trim().slice(0, 32) || "sharp";
    workspace.automation.topics = Array.isArray(automation.topics)
      ? automation.topics.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12)
      : sanitizeTopics(automation.topics);
    workspace.automation.brandVoice = String(automation.brandVoice || "").trim().slice(0, 280);
    workspace.automation.audience = String(automation.audience || "").trim().slice(0, 160);
    workspace.automation.cadenceMinutes = Math.max(15, Math.min(1440, Number(automation.cadenceMinutes) || 180));
    workspace.automation.mode = ["draft_only"].includes(String(automation.mode || "")) ? String(automation.mode) : "draft_only";

    await workspace.save();

    return res.json({
      ok: true,
      workspace: {
        id: String(workspace._id),
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        automation: workspace.automation
      }
    });
  });

  return router;
}
