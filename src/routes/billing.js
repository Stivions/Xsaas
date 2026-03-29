import { Router } from "express";

import { Subscription } from "../models/Subscription.js";
import { Workspace } from "../models/Workspace.js";

const PLAN_META = {
  starter: {
    label: "Starter",
    price: 0,
    limitAlerts: 5,
    limitAccounts: 1,
    features: [
      "5 opportunity alerts per day",
      "Basic draft workspace",
      "1 connected account",
      "Community support"
    ]
  },
  pro: {
    label: "Pro",
    price: 19,
    limitAlerts: null,
    limitAccounts: 3,
    features: [
      "Unlimited opportunity alerts",
      "Advanced draft workspace",
      "3 connected accounts",
      "Priority support",
      "Analytics dashboard",
      "Content recycling"
    ]
  },
  agency: {
    label: "Agency",
    price: 79,
    limitAlerts: null,
    limitAccounts: null,
    features: [
      "Everything in Pro",
      "Unlimited accounts",
      "Team collaboration",
      "White-label reports",
      "Dedicated support",
      "API access"
    ]
  }
};

export function createBillingRouter(config) {
  const router = Router();

  router.get("/config", async (req, res) => {
    const userId = req.auth?.sub;
    const workspace = userId ? await Workspace.findOne({ ownerUserId: userId }).sort({ createdAt: 1 }) : null;
    const subscription = workspace
      ? await Subscription.findOne({ workspaceId: workspace._id }).sort({ createdAt: -1 })
      : null;
    const currentPlan = workspace?.plan || subscription?.planKey || "starter";

    res.json({
      currentPlan,
      provider: "paypal",
      paypal: {
        environment: config.paypal.env,
        clientId: config.paypal.clientId
      },
      workspace: workspace
        ? {
            id: String(workspace._id),
            name: workspace.name,
            slug: workspace.slug,
            plan: workspace.plan,
            status: workspace.status,
            xConnectionStatus: workspace.xConnectionStatus
          }
        : null,
      plans: Object.entries(PLAN_META).map(([key, plan]) => ({
        id: key,
        key,
        name: plan.label,
        price: plan.price,
        providerPlanId: config.paypal.planIds[key] || "",
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
    const providerPlanId = config.paypal.planIds[resolvedPlanKey];
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

    const subscription = await Subscription.create({
      userId: userId || workspace.ownerUserId,
      workspaceId: workspace._id,
      planKey: resolvedPlanKey,
      provider: "paypal",
      providerPlanId,
      status: "pending"
    });

    return res.status(201).json({
      subscriptionId: String(subscription._id),
      provider: "paypal",
      providerPlanId,
      planKey: resolvedPlanKey,
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
