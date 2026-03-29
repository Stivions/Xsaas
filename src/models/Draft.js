import mongoose from "mongoose";

const draftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      default: "draft"
    },
    source: {
      type: String,
      default: "manual"
    },
    characterCount: {
      type: Number,
      default: 0
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

draftSchema.index({ workspaceId: 1, updatedAt: -1 });

export const Draft = mongoose.models.Draft || mongoose.model("Draft", draftSchema);
