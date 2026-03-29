import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { getConfig } from "./config.js";
import { startAutomationScheduler } from "./lib/automation.js";
import { connectToDatabase } from "./lib/db.js";
import { authRequired } from "./middleware/auth.js";
import { createAuthRouter } from "./routes/auth.js";
import { createAutomationRouter } from "./routes/automation.js";
import { createBillingRouter, createPayPalWebhookHandler } from "./routes/billing.js";
import { createDraftsRouter } from "./routes/drafts.js";
import { createHealthRouter } from "./routes/health.js";
import { createWorkspaceRouter } from "./routes/workspace.js";

const config = getConfig();
const app = express();

app.use(
  cors({
    origin: config.appUrl,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/health", createHealthRouter());
app.use("/api/auth", createAuthRouter(config));
app.post("/api/billing/paypal/webhook", createPayPalWebhookHandler(config));
app.use("/api/billing", authRequired(config), createBillingRouter(config));
app.use("/api/workspace", authRequired(config), createWorkspaceRouter(config));
app.use("/api/drafts", authRequired(config), createDraftsRouter(config));
app.use("/api/automation", authRequired(config), createAutomationRouter(config));

app.get("/", (_req, res) => {
  res.json({
    name: "xsaas-api",
    status: "ok",
    docs: {
      health: "/health",
      auth: "/api/auth",
      billing: "/api/billing"
    }
  });
});

connectToDatabase(config.mongodbUri)
  .then(() => {
    app.listen(config.port, () => {
      console.log(`[xsaas] API running on port ${config.port}`);
    });
    startAutomationScheduler(config);
  })
  .catch((error) => {
    console.error("[xsaas] Failed to start API", error);
    process.exitCode = 1;
  });
