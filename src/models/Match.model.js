import mongoose from "mongoose";

/**
 * all are document ids
 */

const matchSchema = new mongoose.Schema(
  {
    donerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    donerDocId: { type: mongoose.Schema.Types.ObjectId, required: true },
    acceptorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    acceptorDocId: { type: mongoose.Schema.Types.ObjectId, required: true },
    timeOfAcceptance: { type: Date, require: true },
  },
  { timestamps: true }
);

export const MatchUps = mongoose.model("MatchUps", matchSchema);
