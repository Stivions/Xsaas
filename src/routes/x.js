import crypto from "node:crypto";

import { Router } from "express";

import { encryptSecret } from "../lib/crypto.js";
import {
  closeXSession,
  createManualLoginSession,
  normalizeXErrorMessage,
  waitForManualLogin
} from "../lib/x-browser.js";
import { Workspace } from "../models/Workspace.js";
import { XAccount } from "../models/XAccount.js";

const connectJobs = new Map();
const JOB_RETENTION_MS = 5 * 60 * 1000;

function serializeAccount(xAccount) {
  if (!xAccount || !xAccount.storageStateEnc) {
    return null;
  }

  return {
    id: String(xAccount._id),
    accountId: xAccount.accountId,
    username: xAccount.username,
    displayName: xAccount.displayName,
    scopes: (xAccount.scopes || []).length ? xAccount.scopes : ["browser_session", "tweet.write"],
    connectedAt: xAccount.connectedAt,
    expiresAt: null,
    lastRefreshAt: null,
    lastUsedAt: xAccount.lastUsedAt,
    lastError: xAccount.lastError || "",
    connectionMode: xAccount.connectionMode || "browser_session"
  };
}

function serializeJob(job) {
  if (!job) {
    return null;
  }

  return {
    ticketId: job.ticketId,
    status: job.status,
    message: job.message,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
    account: job.account || null
  };
}

function scheduleJobCleanup(ticketId) {
  const timer = setTimeout(() => {
    const current = connectJobs.get(ticketId);
    if (!current || current.status === "pending") {
      return;
    }
    connectJobs.delete(ticketId);
  }, JOB_RETENTION_MS);

  timer.unref?.();
}

function getPendingJobForWorkspace(workspaceId) {
  for (const job of connectJobs.values()) {
    if (job.workspaceId === String(workspaceId) && job.status === "pending") {
      return job;
    }
  }

  return null;
}

async function closePendingJobsForWorkspace(workspaceId) {
  for (const [ticketId, job] of connectJobs.entries()) {
    if (job.workspaceId !== String(workspaceId)) {
      continue;
    }

    if (job.session) {
      await closeXSession(job.session);
    }

    connectJobs.delete(ticketId);
  }
}

async function getWorkspace(req) {
  return Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });
}

async function getStoredBrowserAccount(workspaceId) {
  return XAccount.findOne({
    workspaceId,
    connectionMode: "browser_session",
    storageStateEnc: { $ne: "" }
  });
}

async function finalizeConnectJob(config, ticketId) {
  const job = connectJobs.get(ticketId);
  if (!job) {
    return;
  }

  try {
    const { storageStateB64, profile } = await waitForManualLogin(job.session, {
      timeoutMs: config.x.connectTimeoutMs
    });

    const workspace = await Workspace.findById(job.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    const xAccount =
      (await XAccount.findOne({ workspaceId: workspace._id })) ||
      new XAccount({
        userId: job.userId,
        workspaceId: workspace._id,
        accountId: profile.accountId,
        username: profile.username
      });

    xAccount.userId = job.userId;
    xAccount.workspaceId = workspace._id;
    xAccount.provider = "x";
    xAccount.connectionMode = "browser_session";
    xAccount.accountId = profile.accountId || profile.username;
    xAccount.username = String(profile.username || "").toLowerCase();
    xAccount.displayName = profile.displayName || profile.username || "";
    xAccount.tokenType = "browser_session";
    xAccount.scopes = ["browser_session", "tweet.write"];
    xAccount.storageStateEnc = encryptSecret(storageStateB64, config.encryptionSecret);
    xAccount.accessTokenEnc = "";
    xAccount.refreshTokenEnc = "";
    xAccount.expiresAt = null;
    xAccount.connectedAt = new Date();
    xAccount.lastRefreshAt = null;
    xAccount.lastUsedAt = new Date();
    xAccount.lastError = "";
    xAccount.profile = profile.profile || {};
    await xAccount.save();

    workspace.xConnectionStatus = "connected";
    await workspace.save();

    job.status = "connected";
    job.message = `Connected as @${xAccount.username}.`;
    job.account = serializeAccount(xAccount);
    job.updatedAt = new Date().toISOString();
  } catch (error) {
    const workspace = await Workspace.findById(job.workspaceId).catch(() => null);
    const existingAccount = await getStoredBrowserAccount(job.workspaceId).catch(() => null);

    if (workspace) {
      workspace.xConnectionStatus = existingAccount ? "connected" : "error";
      await workspace.save().catch(() => {});
    }

    job.status = "error";
    job.message = normalizeXErrorMessage(error);
    job.updatedAt = new Date().toISOString();
  } finally {
    if (job.session) {
      await closeXSession(job.session);
      job.session = null;
    }
    scheduleJobCleanup(ticketId);
  }
}

export function createXRouter(config) {
  const router = Router();

  router.get("/status", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const xAccount = await getStoredBrowserAccount(workspace._id);
    const legacyAccount = xAccount
      ? null
      : await XAccount.findOne({
          workspaceId: workspace._id
        }).select("_id storageStateEnc connectionMode");
    const connectJob = getPendingJobForWorkspace(workspace._id);

    return res.json({
      providerReady: true,
      connectionMode: "browser_session",
      connectJob: serializeJob(connectJob),
      requiresReconnect: Boolean(legacyAccount && !legacyAccount.storageStateEnc),
      account: serializeAccount(xAccount)
    });
  });

  router.post("/connect/start", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const existingJob = getPendingJobForWorkspace(workspace._id);
    if (existingJob) {
      return res.status(202).json(serializeJob(existingJob));
    }

    try {
      const session = await createManualLoginSession(config);
      const ticketId = crypto.randomUUID();
      const job = {
        ticketId,
        workspaceId: String(workspace._id),
        userId: String(req.auth.sub),
        status: "pending",
        message: "Finish the login in the X browser window. This panel will close when the session is saved.",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        account: null,
        session
      };

      connectJobs.set(ticketId, job);
      workspace.xConnectionStatus = "connecting";
      await workspace.save();

      void finalizeConnectJob(config, ticketId);

      return res.status(202).json(serializeJob(job));
    } catch (error) {
      workspace.xConnectionStatus = "error";
      await workspace.save().catch(() => {});
      return res.status(400).json({
        error: normalizeXErrorMessage(error)
      });
    }
  });

  router.get("/connect/progress", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const ticketId = String(req.query?.ticket || "").trim();
    if (!ticketId) {
      return res.status(400).json({ error: "Missing connection ticket." });
    }

    const job = connectJobs.get(ticketId);
    if (!job || job.workspaceId !== String(workspace._id)) {
      const xAccount = await getStoredBrowserAccount(workspace._id);
      if (xAccount) {
        return res.json({
          ticketId,
          status: "connected",
          message: `Connected as @${xAccount.username}.`,
          account: serializeAccount(xAccount)
        });
      }

      return res.status(404).json({
        status: "expired",
        message: "The X connection session expired. Start the connection again."
      });
    }

    return res.json(serializeJob(job));
  });

  router.post("/disconnect", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    await closePendingJobsForWorkspace(workspace._id);
    await XAccount.findOneAndDelete({ workspaceId: workspace._id });

    workspace.xConnectionStatus = "not_connected";
    await workspace.save();

    return res.json({ ok: true });
  });

  return router;
}
