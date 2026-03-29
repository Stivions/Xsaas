import jwt from "jsonwebtoken";

import { PAID_PLAN_KEYS } from "./plans.js";
import { Workspace } from "../models/Workspace.js";
import { XAccount } from "../models/XAccount.js";

const PERSISTENT_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function issueSession(user, config) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function readSessionTokenFromRequest(req, config) {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  return bearer || req.cookies?.[config.cookieName] || "";
}

export function verifySessionToken(token, config) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

export function sendSessionCookie(res, token, config, { persistent = false } = {}) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/"
  };

  if (persistent) {
    cookieOptions.maxAge = PERSISTENT_SESSION_MS;
  }

  res.cookie(config.cookieName, token, cookieOptions);
}

export function clearSessionCookie(res, config) {
  res.clearCookie(config.cookieName, {
    path: "/",
    sameSite: "lax",
    secure: config.nodeEnv === "production"
  });
}

export async function userHasPaidPlan(userId) {
  const paidWorkspace = await Workspace.findOne({
    ownerUserId: userId,
    plan: { $in: PAID_PLAN_KEYS }
  }).select("_id");

  return Boolean(paidWorkspace);
}

export async function clearStarterConnectionsForUser(userId) {
  const starterWorkspaces = await Workspace.find({
    ownerUserId: userId,
    plan: "starter"
  });

  if (!starterWorkspaces.length) {
    return 0;
  }

  const workspaceIds = starterWorkspaces.map((workspace) => workspace._id);
  await XAccount.deleteMany({ workspaceId: { $in: workspaceIds } });

  await Workspace.updateMany(
    { _id: { $in: workspaceIds } },
    {
      $set: {
        xConnectionStatus: "not_connected"
      }
    }
  );

  return workspaceIds.length;
}

export async function issueWorkspaceSession(res, user, config) {
  const hasPaidPlan = await userHasPaidPlan(user._id);
  if (!hasPaidPlan) {
    await clearStarterConnectionsForUser(user._id);
  }

  const token = issueSession(user, config);
  sendSessionCookie(res, token, config, { persistent: hasPaidPlan });

  return {
    token,
    persistent: hasPaidPlan
  };
}
