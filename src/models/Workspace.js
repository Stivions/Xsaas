import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    plan: {
      type: String,
      default: "starter"
    },
    status: {
      type: String,
      default: "active"
    },
    xConnectionStatus: {
      type: String,
      default: "not_connected"
    },
    automation: {
      enabled: {
        type: Boolean,
        default: false
      },
      language: {
        type: String,
        default: "es"
      },
      tone: {
        type: String,
        default: "sharp"
      },
      topics: {
        type: [String],
        default: []
      },
      brandVoice: {
        type: String,
        default: ""
      },
      audience: {
        type: String,
        default: ""
      },
      cadenceMinutes: {
        type: Number,
        default: 180
      },
      mode: {
        type: String,
        default: "draft_only"
      },
      source: {
        type: String,
        default: "trends_news"
      },
      lastRunAt: {
        type: Date,
        default: null
      },
      lastStatus: {
        type: String,
        default: "idle"
      },
      lastError: {
        type: String,
        default: ""
      },
      lastDraftId: {
        type: String,
        default: ""
      },
      lastPublishedPostId: {
        type: String,
        default: ""
      },
      lastPublishedPostUrl: {
        type: String,
        default: ""
      },
      lastPublishedAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

export const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
