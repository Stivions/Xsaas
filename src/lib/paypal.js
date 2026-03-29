import crypto from "node:crypto";

import { IntegrationState } from "../models/IntegrationState.js";
import { PLAN_META, PAID_PLAN_KEYS } from "./plans.js";

const accessTokenCache = new Map();

function getPayPalBaseUrl(env) {
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getCacheKey(config) {
  return `${config.paypal.env}:${config.paypal.clientId}`;
}

function isPublicHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) && !["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function splitName(fullName = "") {
  const safe = String(fullName || "").trim();
  if (!safe) {
    return {
      given_name: "Xsaas",
      surname: "Member"
    };
  }

  const parts = safe.split(/\s+/).filter(Boolean);
  return {
    given_name: parts[0] || "Xsaas",
    surname: parts.slice(1).join(" ") || "Member"
  };
}

function makePlanDescription(planKey) {
  const plan = PLAN_META[planKey];
  return `${plan.label} membership for Xsaas`;
}

export async function getPayPalAccessToken(config) {
  if (!config.paypal.clientId || !config.paypal.clientSecret) {
    throw new Error("PayPal client credentials are missing.");
  }

  const cacheKey = getCacheKey(config);
  const cached = accessTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.accessToken;
  }

  const auth = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString("base64");
  const response = await fetch(`${getPayPalBaseUrl(config.paypal.env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Failed to authenticate with PayPal.");
  }

  accessTokenCache.set(cacheKey, {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000
  });

  return payload.access_token;
}

export async function paypalRequest(config, path, { method = "GET", body, headers = {} } = {}) {
  const accessToken = await getPayPalAccessToken(config);
  const response = await fetch(`${getPayPalBaseUrl(config.paypal.env)}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      payload?.details?.[0]?.description || payload?.message || payload?.error_description || "PayPal request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function ensurePayPalProduct(config) {
  const state =
    (await IntegrationState.findOne({ provider: "paypal", environment: config.paypal.env })) ||
    (await IntegrationState.create({ provider: "paypal", environment: config.paypal.env }));

  if (state.productId) {
    return state;
  }

  const product = await paypalRequest(config, "/v1/catalogs/products", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": crypto.randomUUID()
    },
    body: {
      name: "Xsaas Membership",
      description: "Recurring subscriptions for Xsaas workspaces",
      type: "SERVICE",
      category: "SOFTWARE"
    }
  });

  state.productId = product.id || "";
  await state.save();
  return state;
}

async function createPlan(config, productId, planKey) {
  const plan = PLAN_META[planKey];

  return paypalRequest(config, "/v1/billing/plans", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": crypto.randomUUID()
    },
    body: {
      product_id: productId,
      name: `Xsaas ${plan.label}`,
      description: makePlanDescription(planKey),
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              currency_code: plan.currency,
              value: String(plan.price)
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      }
    }
  });
}

async function maybeEnsureWebhook(config, state) {
  if (state.webhookId || config.paypal.webhookId) {
    return state;
  }

  if (!isPublicHttpUrl(config.appUrl)) {
    return state;
  }

  const webhook = await paypalRequest(config, "/v1/notifications/webhooks", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": crypto.randomUUID()
    },
    body: {
      url: `${config.appUrl.replace(/\/+$/, "")}/api/billing/paypal/webhook`,
      event_types: [
        { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
        { name: "BILLING.SUBSCRIPTION.CANCELLED" },
        { name: "BILLING.SUBSCRIPTION.EXPIRED" },
        { name: "BILLING.SUBSCRIPTION.PAYMENT.FAILED" },
        { name: "PAYMENT.SALE.COMPLETED" }
      ]
    }
  });

  state.webhookId = webhook.id || "";
  await state.save();
  return state;
}

export async function ensurePayPalCatalog(config) {
  if (!config.paypal.clientId || !config.paypal.clientSecret) {
    return {
      productId: "",
      webhookId: config.paypal.webhookId || "",
      planIds: { ...config.paypal.planIds }
    };
  }

  const state = await ensurePayPalProduct(config);
  const mergedPlanIds = {
    starter: config.paypal.planIds.starter || state.planIds?.starter || "",
    pro: config.paypal.planIds.pro || state.planIds?.pro || "",
    agency: config.paypal.planIds.agency || state.planIds?.agency || ""
  };

  for (const planKey of PAID_PLAN_KEYS) {
    if (!mergedPlanIds[planKey]) {
      const plan = await createPlan(config, state.productId, planKey);
      mergedPlanIds[planKey] = plan.id || "";
    }
  }

  state.planIds = mergedPlanIds;
  await state.save();
  await maybeEnsureWebhook(config, state);

  return {
    productId: state.productId,
    webhookId: config.paypal.webhookId || state.webhookId || "",
    planIds: mergedPlanIds
  };
}

export async function createPayPalSubscription(config, { planId, workspace, user }) {
  const returnUrl = `${config.appUrl.replace(/\/+$/, "")}/dashboard/billing?paypal=success`;
  const cancelUrl = `${config.appUrl.replace(/\/+$/, "")}/dashboard/billing?paypal=cancel`;
  const subscriberName = splitName(user?.fullName || "");

  return paypalRequest(config, "/v1/billing/subscriptions", {
    method: "POST",
    headers: {
      "PayPal-Request-Id": crypto.randomUUID(),
      Prefer: "return=representation"
    },
    body: {
      plan_id: planId,
      custom_id: String(workspace._id),
      subscriber: {
        name: subscriberName,
        email_address: user.email
      },
      application_context: {
        brand_name: "Xsaas",
        locale: "en-US",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    }
  });
}

export async function getPayPalSubscription(config, subscriptionId) {
  return paypalRequest(config, `/v1/billing/subscriptions/${subscriptionId}`);
}

export async function verifyPayPalWebhook(config, req) {
  const webhookId = config.paypal.webhookId || "";
  if (!webhookId) {
    return false;
  }

  return paypalRequest(config, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: {
      auth_algo: req.headers["paypal-auth-algo"],
      cert_url: req.headers["paypal-cert-url"],
      transmission_id: req.headers["paypal-transmission-id"],
      transmission_sig: req.headers["paypal-transmission-sig"],
      transmission_time: req.headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: req.body
    }
  }).then((payload) => payload.verification_status === "SUCCESS");
}
