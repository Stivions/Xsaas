import { Draft } from "../models/Draft.js";
import { Workspace } from "../models/Workspace.js";
import { User } from "../models/User.js";
import { XAccount } from "../models/XAccount.js";
import { collectTrendCandidates } from "./trends.js";
import { createXPost, getFreshAccessTokenForAccount } from "./x.js";

let schedulerHandle = null;
let schedulerBusy = false;

function normalizeTopics(value = []) {
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

function buildPrompt(workspace, candidate) {
  const automation = workspace.automation || {};
  const topics = normalizeTopics(automation.topics);
  const language = automation.language || "es";
  const tone = automation.tone || "sharp";
  const audience = automation.audience || "creators and founders on X";
  const brandVoice = automation.brandVoice || "direct, useful, credible";

  const contextLines = candidate
    ? [
        `Topic: ${candidate.topic}.`,
        `Headline: ${candidate.articleTitle}.`,
        `Context: ${candidate.articleSnippet}.`,
        candidate.articlePublishedAt ? `Published at: ${candidate.articlePublishedAt}.` : ""
      ].filter(Boolean)
    : [];

  return [
    `Write one high-quality X post in ${language === "es" ? "Spanish" : "English"}.`,
    "Keep it natural, human, sharp, and native to X.",
    "Do not use hashtags, emojis, markdown, or generic AI wording.",
    "The output must be only the final post text.",
    "Aim for 220-260 characters max unless a shorter post is stronger.",
    `Tone: ${tone}.`,
    `Audience: ${audience}.`,
    `Brand voice: ${brandVoice}.`,
    topics.length ? `Priority topics: ${topics.join(", ")}.` : "Priority topics: X growth, audience building, online business.",
    ...contextLines,
    "The post should feel timely, informed, and opinionated without sounding robotic."
  ].join("\n");
}

function cleanGeneratedPost(text) {
  return String(text || "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

async function generateDraftWithGroq(config, workspace, candidate) {
  if (!config.groq.apiKey) {
    throw new Error("Groq API key is missing.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.groq.model,
      temperature: 0.7,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: "You write timely, publish-ready posts for X."
        },
        {
          role: "user",
          content: buildPrompt(workspace, candidate)
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "Groq generation failed.");
  }

  const content = cleanGeneratedPost(payload?.choices?.[0]?.message?.content || "");
  if (!content) {
    throw new Error("Groq returned an empty draft.");
  }

  return content;
}

async function pickCandidate(config, workspace) {
  const candidates = await collectTrendCandidates(config, normalizeTopics(workspace.automation?.topics || []));
  return candidates[0] || null;
}

function buildPostUrl(username, postId) {
  if (!username || !postId) {
    return "";
  }
  return `https://x.com/${String(username).replace(/^@/, "")}/status/${postId}`;
}

async function publishToX(config, workspace, content) {
  const xAccount = await XAccount.findOne({ workspaceId: workspace._id });
  if (!xAccount) {
    throw new Error("Connect an X account before enabling auto-post.");
  }

  const accessToken = await getFreshAccessTokenForAccount(config, xAccount);
  const payload = await createXPost(config, accessToken, content);
  const postId = payload?.data?.id || "";

  xAccount.lastUsedAt = new Date();
  xAccount.lastError = "";
  await xAccount.save();

  return {
    id: postId,
    url: buildPostUrl(xAccount.username, postId)
  };
}

async function createDraftRecord({
  workspace,
  userId,
  content,
  source = "automation",
  status = "draft",
  metadata = {},
  externalPostId = "",
  externalPostUrl = "",
  publishedAt = null
}) {
  const trimmed = String(content || "").trim();
  const draft = await Draft.create({
    userId,
    workspaceId: workspace._id,
    content: trimmed,
    status,
    source,
    characterCount: trimmed.length,
    externalPostId,
    externalPostUrl,
    publishedAt,
    metadata
  });

  workspace.automation.lastDraftId = String(draft._id);
  workspace.automation.lastRunAt = new Date();
  workspace.automation.lastStatus = "success";
  workspace.automation.lastError = "";
  if (externalPostId) {
    workspace.automation.lastPublishedPostId = externalPostId;
    workspace.automation.lastPublishedPostUrl = externalPostUrl;
    workspace.automation.lastPublishedAt = publishedAt || new Date();
  }
  await workspace.save();

  return draft;
}

export async function runWorkspaceAutomation(config, workspaceId, { force = false } = {}) {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  if (!force && !workspace.automation?.enabled) {
    throw new Error("Automation is disabled for this workspace.");
  }

  workspace.automation.lastStatus = "running";
  workspace.automation.lastError = "";
  await workspace.save();

  const user = await User.findById(workspace.ownerUserId);
  if (!user) {
    workspace.automation.lastStatus = "error";
    workspace.automation.lastError = "Workspace owner not found.";
    await workspace.save();
    throw new Error("Workspace owner not found.");
  }

  try {
    const candidate = workspace.automation?.source === "trends_news" ? await pickCandidate(config, workspace) : null;
    const content = await generateDraftWithGroq(config, workspace, candidate);

    if (workspace.automation?.mode === "auto_post") {
      const published = await publishToX(config, workspace, content);
      return createDraftRecord({
        workspace,
        userId: user._id,
        content,
        source: "automation",
        status: "published",
        externalPostId: published.id,
        externalPostUrl: published.url,
        publishedAt: new Date(),
        metadata: {
          candidate
        }
      });
    }

    return createDraftRecord({
      workspace,
      userId: user._id,
      content,
      source: "automation",
      status: "draft",
      metadata: {
        candidate
      }
    });
  } catch (error) {
    workspace.automation.lastRunAt = new Date();
    workspace.automation.lastStatus = "error";
    workspace.automation.lastError = error instanceof Error ? error.message : "Automation failed.";
    await workspace.save();
    throw error;
  }
}

async function processAutomationTick(config) {
  if (schedulerBusy) {
    return;
  }

  schedulerBusy = true;
  try {
    const workspaces = await Workspace.find({ "automation.enabled": true, status: "active" });

    for (const workspace of workspaces) {
      const cadenceMinutes = Number(workspace.automation?.cadenceMinutes || config.automation.defaultCadenceMinutes || 180);
      const lastRunAt = workspace.automation?.lastRunAt ? new Date(workspace.automation.lastRunAt).getTime() : 0;
      const dueAt = lastRunAt + cadenceMinutes * 60 * 1000;

      if (Date.now() >= dueAt) {
        try {
          await runWorkspaceAutomation(config, workspace._id);
        } catch (error) {
          console.error(`[xsaas] automation failed for workspace ${workspace._id}`, error);
        }
      }
    }
  } catch (error) {
    console.error("[xsaas] automation tick failed", error);
  } finally {
    schedulerBusy = false;
  }
}

export function startAutomationScheduler(config) {
  if (!config.automation.enabled || schedulerHandle) {
    return;
  }

  schedulerHandle = setInterval(() => {
    void processAutomationTick(config);
  }, config.automation.tickMs);

  void processAutomationTick(config);
}
