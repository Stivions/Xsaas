import crypto from "node:crypto";

function getKey(secret) {
  return crypto.createHash("sha256").update(String(secret || "")).digest();
}

export function encryptSecret(value, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(String(value || ""), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), encrypted.toString("base64url"), tag.toString("base64url")].join(".");
}

export function decryptSecret(payload, secret) {
  const [ivRaw, encryptedRaw, tagRaw] = String(payload || "").split(".");
  if (!ivRaw || !encryptedRaw || !tagRaw) {
    return "";
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(secret),
    Buffer.from(ivRaw, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
