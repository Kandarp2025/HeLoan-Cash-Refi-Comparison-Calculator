import { Schema, model } from "mongoose";

const financialResponseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    phoneDigits: {
      type: String,
      trim: true,
      default: ""
    },
    inputData: {
      type: Schema.Types.Mixed,
      required: true
    },
    normalizedData: {
      type: Schema.Types.Mixed,
      required: true
    },
    calculationResult: {
      type: Schema.Types.Mixed,
      required: true
    },
    webhookResponse: {
      type: Schema.Types.Mixed
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

financialResponseSchema.index({ email: 1 });
financialResponseSchema.index({ phone: 1 });
financialResponseSchema.index({ phoneDigits: 1 });
financialResponseSchema.index({ name: 1 });

export const CalculatedFinancialResponseModel = model(
  "CalculatedFinancialResponse",
  financialResponseSchema,
  "CalculatedFinancialResponse"
);
