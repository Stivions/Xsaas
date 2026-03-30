import mongoose from "mongoose";

const xAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      unique: true
    },
    provider: {
      type: String,
      default: "x"
    },
    connectionMode: {
      type: String,
      default: "browser_session"
    },
    accountId: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    displayName: {
      type: String,
      default: "",
      trim: true
    },
    tokenType: {
      type: String,
      default: "bearer"
    },
    storageStateEnc: {
      type: String,
      default: ""
    },
    scopes: {
      type: [String],
      default: []
    },
    accessTokenEnc: {
      type: String,
      default: ""
    },
    refreshTokenEnc: {
      type: String,
      default: ""
    },
    expiresAt: {
      type: Date,
      default: null
    },
    connectedAt: {
      type: Date,
      default: Date.now
    },
    lastRefreshAt: {
      type: Date,
      default: null
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    lastError: {
      type: String,
      default: ""
    },
    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

xAccountSchema.index({ userId: 1, username: 1 });

export const XAccount = mongoose.models.XAccount || mongoose.model("XAccount", xAccountSchema);
