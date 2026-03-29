import "dotenv/config";

function read(value, fallback = "") {
  return String(value ?? fallback).trim();
}

export function getConfig() {
  return {
    nodeEnv: read(process.env.NODE_ENV, "development"),
    port: Number.parseInt(read(process.env.PORT, "4000"), 10) || 4000,
    appUrl: read(process.env.APP_URL, "http://localhost:3000"),
    apiUrl: read(process.env.API_URL, "http://localhost:4000"),
    mongodbUri: read(process.env.MONGODB_URI, "mongodb://127.0.0.1:27017/xsaas"),
    jwtSecret: read(process.env.JWT_SECRET, "change-me"),
    cookieName: read(process.env.COOKIE_NAME, "xsaas_token"),
    paypal: {
      env: read(process.env.PAYPAL_ENV, "sandbox"),
      clientId: read(process.env.PAYPAL_CLIENT_ID),
      clientSecret: read(process.env.PAYPAL_CLIENT_SECRET),
      webhookId: read(process.env.PAYPAL_WEBHOOK_ID),
      planIds: {
        starter: read(process.env.PAYPAL_STARTER_PLAN_ID),
        pro: read(process.env.PAYPAL_PRO_PLAN_ID),
        agency: read(process.env.PAYPAL_AGENCY_PLAN_ID)
      }
    }
  };
}
