import { Router } from "express";

import { Subscription } from "../models/Subscription.js";
import { Workspace } from "../models/Workspace.js";
import { User } from "../models/User.js";
import { ensurePayPalCatalog, createPayPalSubscription, getPayPalSubscription, verifyPayPalWebhook } from "../lib/paypal.js";
import { PLAN_META } from "../lib/plans.js";
import { clearStarterConnectionsForUser, issueWorkspaceSession } from "../lib/session.js";

function normalizePayPalStatus(status = "") {
  const value = String(status || "").toUpperCase();
  if (value === "ACTIVE") {
    return "active";
  }
  if (["APPROVAL_PENDING", "APPROVED", "PENDING"].includes(value)) {
    return "pending";
  }
  if (["CANCELLED", "SUSPENDED", "EXPIRED"].includes(value)) {
    return "cancelled";
  }
  return value.toLowerCase() || "pending";
}

async function getWorkspaceForRequest(req) {
  return Workspace.findOne({ ownerUserId: req.auth?.sub }).sort({ createdAt: 1 });
}

async function syncPayPalSubscription(config, subscriptionId) {
  const details = await getPayPalSubscription(config, subscriptionId);
  const subscription = await Subscription.findOne({ providerSubscriptionId: subscriptionId }).sort({ createdAt: -1 });
  if (!subscription) {
    throw new Error("Subscription not found.");
  }

  const status = normalizePayPalStatus(details.status);
  subscription.status = status;
  subscription.providerPlanId = details.plan_id || subscription.providerPlanId;
  await subscription.save();

  const workspace = await Workspace.findById(subscription.workspaceId);
  if (workspace) {
    workspace.plan = status === "active" ? subscription.planKey : "starter";
    await workspace.save();

    if (workspace.plan === "starter") {
      await clearStarterConnectionsForUser(workspace.ownerUserId);
      workspace.xConnectionStatus = "not_connected";
      await workspace.save();
    }
  }

  return {
    subscription,
    workspace,
    details
  };
}

export function createBillingRouter(config) {
  const router = Router();

  router.get("/config", async (req, res) => {
    const userId = req.auth?.sub;
    const workspace = userId ? await getWorkspaceForRequest(req) : null;
    const subscription = workspace
      ? await Subscription.findOne({ workspaceId: workspace._id }).sort({ createdAt: -1 })
      : null;
    const catalog = await ensurePayPalCatalog(config);
    const currentPlan = workspace?.plan || subscription?.planKey || "starter";

    res.json({
      currentPlan,
      provider: "paypal",
      paypal: {
        environment: config.paypal.env,
        clientId: config.paypal.clientId,
        webhookConfigured: Boolean(catalog.webhookId)
      },
      workspace: workspace
        ? {
            id: String(workspace._id),
            name: workspace.name,
            slug: workspace.slug,
            plan: workspace.plan,
            status: workspace.status,
            xConnectionStatus: workspace.xConnectionStatus,
            automation: workspace.automation
          }
        : null,
      plans: Object.entries(PLAN_META).map(([key, plan]) => ({
        id: key,
        key,
        name: plan.label,
        price: plan.price,
        providerPlanId: catalog.planIds[key] || "",
        features: plan.features,
        current: currentPlan === key
      })),
      usage: {
        opportunityAlerts: {
          used: 0,
          limit: PLAN_META[currentPlan]?.limitAlerts ?? null
        },
        connectedAccounts: {
          used: workspace?.xConnectionStatus === "connected" ? 1 : 0,
          limit: PLAN_META[currentPlan]?.limitAccounts ?? null
        }
      },
      subscription: subscription
        ? {
            id: String(subscription._id),
            planKey: subscription.planKey,
            status: subscription.status,
            providerSubscriptionId: subscription.providerSubscriptionId
          }
        : null
    });
  });

  router.post("/checkout-link", async (req, res) => {
    const { plan = "", planKey = "", workspaceId = "" } = req.body || {};
    const resolvedPlanKey = String(planKey || plan || "").trim().toLowerCase();
    const catalog = await ensurePayPalCatalog(config);
    const providerPlanId = catalog.planIds[resolvedPlanKey];
    const userId = req.auth?.sub;
    const workspace =
      (workspaceId && (await Workspace.findById(workspaceId))) ||
      (userId ? await Workspace.findOne({ ownerUserId: userId }).sort({ createdAt: 1 }) : null);

    if (!providerPlanId) {
      return res.status(400).json({ error: "Unknown or unavailable plan." });
    }

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const user = await User.findById(userId || workspace.ownerUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const paypalSubscription = await createPayPalSubscription(config, {
      planId: providerPlanId,
      workspace,
      user
    });

    const approvalUrl = paypalSubscription.links?.find((item) => item.rel === "approve")?.href || "";
    const subscription = await Subscription.create({
      userId: user._id,
      workspaceId: workspace._id,
      planKey: resolvedPlanKey,
      provider: "paypal",
      providerPlanId,
      providerSubscriptionId: paypalSubscription.id || "",
      status: normalizePayPalStatus(paypalSubscription.status)
    });

    return res.status(201).json({
      subscriptionId: String(subscription._id),
      provider: "paypal",
      providerPlanId,
      providerSubscriptionId: paypalSubscription.id || "",
      planKey: resolvedPlanKey,
      status: subscription.status,
      url: approvalUrl
    });
  });

  router.post("/sync", async (req, res) => {
    const subscriptionId = String(req.body?.subscriptionId || req.query?.subscriptionId || "").trim();
    if (!subscriptionId) {
      return res.status(400).json({ error: "subscriptionId is required." });
    }

    try {
      const synced = await syncPayPalSubscription(config, subscriptionId);
      const user = req.auth?.sub ? await User.findById(req.auth.sub) : null;
      if (user) {
        await issueWorkspaceSession(res, user, config);
      }
      return res.json({
        ok: true,
        subscription: {
          id: String(synced.subscription._id),
          status: synced.subscription.status,
          planKey: synced.subscription.planKey,
          providerSubscriptionId: synced.subscription.providerSubscriptionId
        },
        workspace: synced.workspace
          ? {
              id: String(synced.workspace._id),
              plan: synced.workspace.plan
            }
          : null,
        paypalStatus: synced.details.status || ""
      });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Failed to sync subscription." });
    }
  });

  return router;
}

export function createPayPalWebhookHandler(config) {
  return async (req, res) => {
    try {
      const verified = config.paypal.webhookId ? await verifyPayPalWebhook(config, req) : false;
      const eventType = String(req.body?.event_type || "");
      const subscriptionId = String(req.body?.resource?.id || "");

      if (subscriptionId && eventType.startsWith("BILLING.SUBSCRIPTION.")) {
        await syncPayPalSubscription(config, subscriptionId);
      }

      return res.json({
        ok: true,
        verified,
        eventType
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "Webhook processing failed."
      });
    }
  };
}
