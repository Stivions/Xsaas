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
    }
  },
  {
    timestamps: true
  }
);

export const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
