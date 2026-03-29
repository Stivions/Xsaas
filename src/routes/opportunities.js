import { Router } from "express";

import { collectTrendCandidates } from "../lib/trends.js";
import { Workspace } from "../models/Workspace.js";

async function getWorkspace(req) {
  return Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });
}

function serializeOpportunity(candidate) {
  return {
    topic: candidate.topic || "",
    score: Number(candidate.score || 0),
    sourceKind: candidate.sourceKind || "fallback",
    articleTitle: candidate.articleTitle || "",
    articleLink: candidate.articleLink || "",
    articleSnippet: candidate.articleSnippet || "",
    articlePublishedAt: candidate.articlePublishedAt || null,
    trendLink: candidate.trendLink || ""
  };
}

export function createOpportunitiesRouter(config) {
  const router = Router();

  router.get("/", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const limit = Math.max(1, Math.min(Number.parseInt(String(req.query.limit || "12"), 10) || 12, 24));
    const priorityTopics = Array.isArray(workspace.automation?.topics) ? workspace.automation.topics : [];
    const candidates = await collectTrendCandidates(config, priorityTopics);

    return res.json({
      opportunities: candidates.slice(0, limit).map(serializeOpportunity),
      workspace: {
        id: String(workspace._id),
        xConnectionStatus: workspace.xConnectionStatus || "not_connected",
        automation: {
          enabled: Boolean(workspace.automation?.enabled),
          mode: workspace.automation?.mode || "draft_only",
          source: workspace.automation?.source || "trends_news",
          topics: priorityTopics
        }
      }
    });
  });

  return router;
}
