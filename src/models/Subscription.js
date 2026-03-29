import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
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
    provider: {
      type: String,
      default: "paypal"
    },
    planKey: {
      type: String,
      required: true
    },
    providerPlanId: {
      type: String,
      default: ""
    },
    providerSubscriptionId: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

export const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
