import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { Workspace } from "../models/Workspace.js";

function makeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function issueSession(user, config) {
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

function sendSession(res, token, config) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function createAuthRouter(config) {
  const router = Router();
  const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
    const token = bearer || req.cookies?.[config.cookieName];

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    try {
      req.auth = jwt.verify(token, config.jwtSecret);
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
  };

  router.post("/register", async (req, res) => {
    const { email = "", password = "", fullName = "", name = "", workspaceName = "" } = req.body || {};
    const normalizedEmail = String(email).trim().toLowerCase();
    const resolvedFullName = String(fullName || name).trim();

    if (!normalizedEmail || !password || password.length < 8) {
      return res.status(400).json({ error: "Email and a password with at least 8 characters are required." });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "This email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      fullName: resolvedFullName
    });

    const baseSlug = makeSlug(workspaceName || resolvedFullName || normalizedEmail.split("@")[0] || "workspace");
    let slug = baseSlug || `workspace-${String(user._id).slice(-6)}`;
    let counter = 1;
    while (await Workspace.findOne({ slug })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    const workspace = await Workspace.create({
      ownerUserId: user._id,
      name: String(workspaceName || `${resolvedFullName || "My"} Workspace`).trim(),
      slug,
      plan: "starter"
    });

    const token = issueSession(user, config);
    sendSession(res, token, config);

    return res.status(201).json({
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      workspace: {
        id: String(workspace._id),
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan
      },
      token
    });
  });

  router.post("/login", async (req, res) => {
    const { email = "", password = "" } = req.body || {};
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const workspace = await Workspace.findOne({ ownerUserId: user._id }).sort({ createdAt: 1 });
    const token = issueSession(user, config);
    sendSession(res, token, config);

    return res.json({
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      workspace: workspace
        ? {
            id: String(workspace._id),
            name: workspace.name,
            slug: workspace.slug,
            plan: workspace.plan
          }
        : null,
      token
    });
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie(config.cookieName);
    return res.json({ ok: true });
  });

  router.get("/me", requireAuth, async (req, res) => {
    if (!req.auth?.sub) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const user = await User.findById(req.auth.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const workspaces = await Workspace.find({ ownerUserId: user._id }).sort({ createdAt: 1 });
    return res.json({
      user: {
        id: String(user._id),
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      workspaces: workspaces.map((workspace) => ({
        id: String(workspace._id),
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        status: workspace.status,
        xConnectionStatus: workspace.xConnectionStatus
      }))
    });
  });

  return router;
}
