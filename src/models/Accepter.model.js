import mongoose, { Schema } from "mongoose";

const accepterSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      require: true,
    },
    requestValid: {
      type: Boolean,
      default: true,
    },
    country: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Accepters = mongoose.model("Accepters", accepterSchema);
