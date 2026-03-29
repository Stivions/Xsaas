import { Router } from "express";

import { Workspace } from "../models/Workspace.js";
import { XAccount } from "../models/XAccount.js";
import { encryptSecret } from "../lib/crypto.js";
import { exchangeXCode, getAuthenticatedXUser } from "../lib/x.js";

function serializeAccount(xAccount) {
  if (!xAccount) {
    return null;
  }

  return {
    id: String(xAccount._id),
    accountId: xAccount.accountId,
    username: xAccount.username,
    displayName: xAccount.displayName,
    scopes: xAccount.scopes || [],
    connectedAt: xAccount.connectedAt,
    expiresAt: xAccount.expiresAt,
    lastRefreshAt: xAccount.lastRefreshAt,
    lastUsedAt: xAccount.lastUsedAt,
    lastError: xAccount.lastError || ""
  };
}

async function getWorkspace(req) {
  return Workspace.findOne({ ownerUserId: req.auth.sub }).sort({ createdAt: 1 });
}

export function createXRouter(config) {
  const router = Router();

  router.get("/status", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const xAccount = await XAccount.findOne({ workspaceId: workspace._id });
    return res.json({
      providerReady: Boolean(config.x.clientId),
      clientId: config.x.clientId || "",
      redirectUri: config.x.redirectUri,
      scopes: config.x.scopes,
      account: serializeAccount(xAccount)
    });
  });

  router.post("/connect/callback", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    if (!config.x.clientId) {
      return res.status(400).json({ error: "X OAuth is not configured yet." });
    }

    const code = String(req.body?.code || "").trim();
    const verifier = String(req.body?.verifier || "").trim();
    if (!code || !verifier) {
      return res.status(400).json({ error: "Missing X OAuth code or verifier." });
    }

    try {
      const tokenPayload = await exchangeXCode(config, { code, verifier });
      const accessToken = tokenPayload.access_token || "";
      const refreshToken = tokenPayload.refresh_token || "";
      const profile = await getAuthenticatedXUser(config, accessToken);

      if (!profile?.id || !profile?.username) {
        throw new Error("X account profile could not be loaded.");
      }

      const xAccount =
        (await XAccount.findOne({ workspaceId: workspace._id })) ||
        new XAccount({
          userId: req.auth.sub,
          workspaceId: workspace._id,
          accountId: profile.id,
          username: profile.username,
          accessTokenEnc: "",
          refreshTokenEnc: ""
        });

      xAccount.userId = req.auth.sub;
      xAccount.workspaceId = workspace._id;
      xAccount.accountId = profile.id;
      xAccount.username = String(profile.username || "").toLowerCase();
      xAccount.displayName = profile.name || "";
      xAccount.tokenType = tokenPayload.token_type || "bearer";
      xAccount.scopes = String(tokenPayload.scope || "")
        .split(/\s+/)
        .filter(Boolean);
      xAccount.accessTokenEnc = encryptSecret(accessToken, config.encryptionSecret);
      xAccount.refreshTokenEnc = refreshToken ? encryptSecret(refreshToken, config.encryptionSecret) : "";
      xAccount.expiresAt = tokenPayload.expires_in
        ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000)
        : null;
      xAccount.connectedAt = new Date();
      xAccount.lastRefreshAt = null;
      xAccount.lastUsedAt = new Date();
      xAccount.lastError = "";
      xAccount.profile = profile;
      await xAccount.save();

      workspace.xConnectionStatus = "connected";
      await workspace.save();

      return res.json({
        ok: true,
        account: serializeAccount(xAccount)
      });
    } catch (error) {
      workspace.xConnectionStatus = "error";
      await workspace.save();
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to connect X account."
      });
    }
  });

  router.post("/disconnect", async (req, res) => {
    const workspace = await getWorkspace(req);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    await XAccount.findOneAndDelete({ workspaceId: workspace._id });
    workspace.xConnectionStatus = "not_connected";
    await workspace.save();

    return res.json({ ok: true });
  });

  return router;
}
