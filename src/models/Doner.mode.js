import mongoose, { Schema } from "mongoose";

const donerSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    avalable: {
      type: Boolean,
      default: true,
    },
    donationDate: {
      type: Date,
      default: undefined,
    },
    country: {
      type: String,
      default: "India",
    },
    location: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Doners = mongoose.model("Doners", donerSchema);
