import { Router } from "express";

import { Subscription } from "../models/Subscription.js";
import { Workspace } from "../models/Workspace.js";

const PLAN_META = {
  starter: {
    label: "Starter"
  },
  pro: {
    label: "Pro"
  },
  agency: {
    label: "Agency"
  }
};

export function createBillingRouter(config) {
  const router = Router();

  router.get("/config", (_req, res) => {
    res.json({
      provider: "paypal",
      environment: config.paypal.env,
      clientId: config.paypal.clientId,
      plans: Object.entries(config.paypal.planIds)
        .filter(([, planId]) => planId)
        .map(([key, planId]) => ({
          key,
          label: PLAN_META[key]?.label || key,
          planId
        }))
    });
  });

  router.post("/checkout-link", async (req, res) => {
    const { planKey = "", workspaceId = "", userId = "" } = req.body || {};
    const providerPlanId = config.paypal.planIds[planKey];

    if (!providerPlanId) {
      return res.status(400).json({ error: "Unknown or unavailable plan." });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const subscription = await Subscription.create({
      userId,
      workspaceId,
      planKey,
      provider: "paypal",
      providerPlanId,
      status: "pending"
    });

    return res.status(201).json({
      subscriptionId: String(subscription._id),
      provider: "paypal",
      providerPlanId,
      nextStep: "Create the real PayPal subscription URL here after wiring the frontend buttons."
    });
  });

  router.post("/paypal/webhook", async (req, res) => {
    return res.json({
      ok: true,
      received: true,
      message: "Webhook endpoint is ready for PayPal event verification and subscription syncing."
    });
  });

  return router;
}
