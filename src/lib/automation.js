import { Draft } from "../models/Draft.js";
import { Workspace } from "../models/Workspace.js";
import { User } from "../models/User.js";

let schedulerHandle = null;
let schedulerBusy = false;

function normalizeTopics(value = []) {
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

function buildPrompt(workspace) {
  const automation = workspace.automation || {};
  const topics = normalizeTopics(automation.topics);
  const language = automation.language || "es";
  const tone = automation.tone || "sharp";
  const audience = automation.audience || "creators and founders on X";
  const brandVoice = automation.brandVoice || "direct, useful, credible";

  return [
    `Write one high-quality X post draft in ${language === "es" ? "Spanish" : "English"}.`,
    "Keep it natural, human, and sharp. Avoid hashtags, emojis, and generic AI phrasing.",
    "The output must be only the post text.",
    "Keep it under 260 characters unless a slightly longer post is clearly stronger.",
    `Tone: ${tone}.`,
    `Audience: ${audience}.`,
    `Brand voice: ${brandVoice}.`,
    topics.length ? `Topics to prioritize: ${topics.join(", ")}.` : "Topics to prioritize: X growth, content systems, audience building.",
    "Make it specific enough to feel useful, not vague inspiration."
  ].join("\n");
}

export async function generateDraftWithGroq(config, workspace) {
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
          content: "You write publish-ready X posts for a premium SaaS product."
        },
        {
          role: "user",
          content: buildPrompt(workspace)
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "Groq generation failed.");
  }

  const content = payload?.choices?.[0]?.message?.content?.trim() || "";
  if (!content) {
    throw new Error("Groq returned an empty draft.");
  }

  return content.replace(/^["']|["']$/g, "").trim();
}

export async function createDraftRecord({ workspace, userId, content, source = "automation" }) {
  const trimmed = String(content || "").trim();
  const draft = await Draft.create({
    userId,
    workspaceId: workspace._id,
    content: trimmed,
    status: "draft",
    source,
    characterCount: trimmed.length,
    metadata: {
      generatedFromTopics: workspace.automation?.topics || []
    }
  });

  workspace.automation.lastDraftId = String(draft._id);
  workspace.automation.lastRunAt = new Date();
  workspace.automation.lastStatus = "success";
  workspace.automation.lastError = "";
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
    const content = await generateDraftWithGroq(config, workspace);
    return createDraftRecord({
      workspace,
      userId: user._id,
      content,
      source: "automation"
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
        await runWorkspaceAutomation(config, workspace._id);
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
