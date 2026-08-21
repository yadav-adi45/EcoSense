import mongoose from "mongoose";

const ecoCoinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["earn", "spend"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: [
        "eco_route",
        "community_proof",
        "community_like",
        "assessment",
        "daily_login",
        "product_discount",
        "bonus",
        "rideshare",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    relatedId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const EcoCoinTransaction = mongoose.model(
  "EcoCoinTransaction",
  ecoCoinTransactionSchema
);
