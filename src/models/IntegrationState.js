import mongoose from "mongoose";

const integrationStateSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true
    },
    environment: {
      type: String,
      required: true,
      trim: true
    },
    productId: {
      type: String,
      default: ""
    },
    webhookId: {
      type: String,
      default: ""
    },
    planIds: {
      starter: {
        type: String,
        default: ""
      },
      pro: {
        type: String,
        default: ""
      },
      agency: {
        type: String,
        default: ""
      }
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

integrationStateSchema.index({ provider: 1, environment: 1 }, { unique: true });

export const IntegrationState =
  mongoose.models.IntegrationState || mongoose.model("IntegrationState", integrationStateSchema);
