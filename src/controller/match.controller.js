import { dbConnectionInstance as connect } from "../../index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { SuccessResponse } from "../utils/SuccessResponse.js";
import { MatchUps } from "../models/Match.model.js";
import { Doners } from "../models/Doner.mode.js";
import mongoose, { MongooseError } from "mongoose";
import { Accepters } from "../models/Accepter.model.js";
import { Users } from "../models/User.model.js";

const acceptDonation = asyncHandler(async (req, res) => {
  const { donerDocId, acceptorDocId } = req.body;
  if (!acceptorDocId || !donerDocId)
    throw new ErrorResponse(false, "acceptor id is missing", 404);

  const donerDoc = await Doners.findById(donerDocId);
  const accepterDoc = await Accepters.findById(acceptorDocId);
  const donerId = donerDoc.userId;
  const acceptorId = accepterDoc.userId;
  if (!donerDoc.avalable) {
    throw new ErrorResponse(false, "donerDoc is not avalable", 401);
  }
  if (!accepterDoc.requestValid) {
    throw new ErrorResponse(false, "request is not valid", 401);
  }
  if (accepterDoc.bloodGroup !== donerDoc.bloodGroup) {
    throw new ErrorResponse(false, "bloodgroups must match", 401);
  }

  const doc = {
    donerId: donerId,
    donerDocId: donerDocId,
    acceptorDocId: acceptorDocId,
    acceptorId: acceptorId,
    timeOfAcceptance: Date.now(),
  };

  // start transection
  const session = await connect.startSession();
  await session.startTransaction();
  try {
    console.log(doc);
    const createDoc = await MatchUps.create([doc], { session });
    if (!createDoc) {
      throw new ErrorResponse(
        false,
        { message: "somthing went wrong, doc not saved" },
        500
      );
    }
    await Doners.findByIdAndUpdate(
      donerDocId,
      { avalable: false },
      { session }
    );
    await Accepters.findByIdAndUpdate(
      acceptorDocId,
      { requestValid: false },
      {
        session,
      }
    );
    await session.commitTransaction();
    res.status(200).send(new SuccessResponse(true, 200, createDoc));
  } catch (error) {
    console.log("transection Aborted!");
    await session.abortTransaction();
    if (error instanceof MongooseError) {
      throw new ErrorResponse(
        false,
        {
          message: error.message,
          path: error?.filedId,
        },
        500
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
});

const getAllByAcceptedDonations = asyncHandler(async (req, res) => {
  const donerUserId = new mongoose.Types.ObjectId(req.userId);
  const donerUserDoc = await Users.findById(donerUserId).select("-password");
  if (!donerUserDoc) throw new ErrorResponse(false, "user not found!", 404);
  try {
    const filterDoc = await MatchUps.aggregate([
      {
        $match: {
          donerId: donerUserId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "acceptorId",
          foreignField: "_id",
          as: "acceptor",
        },
      },
      {
        $lookup: {
          from: "doners",
          localField: "donerDocId",
          foreignField: "_id",
          as: "donerDoc",
        },
      },

      {
        $lookup: {
          from: "accepters",
          localField: "acceptorDocId",
          foreignField: "_id",
          as: "acceptorDoc",
        },
      },
      {
        $unwind: {
          path: "$donerDoc",
        },
      },
      {
        $unwind: {
          path: "$acceptor",
        },
      },
      {
        $unwind: {
          path: "$acceptorDoc",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          docs: {
            $push: {
              donerDoc: "$donerDoc",
              acceptor: "$acceptor",
              acceptorDoc: "$acceptorDoc",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          docs: 1,
        },
      },
    ]);
    const finalDoc = { doner: donerUserDoc, ...filterDoc[0] };
    return res.status(200).send(new SuccessResponse(true, 200, finalDoc));
  } catch (error) {
    if (error instanceof MongooseError) {
      throw new ErrorResponse(false, {
        message: error.message,
        path: error?.filedId,
      });
    }
    throw error;
  }
});

const getDocsByAcceptorMadeRequest = asyncHandler(async (req, res) => {
  const acceptorId = new mongoose.Types.ObjectId(req.userId);
  console.log("acc: ", acceptorId);
  const acceptor = await Users.findById(acceptorId).select("-password");
  if (!acceptor) {
    throw new ErrorResponse(false, "no user found", 404);
  }
  try {
    const filterDoc = await MatchUps.aggregate([
      {
        $match: {
          acceptorId: acceptorId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "donerId",
          foreignField: "_id",
          as: "doner",
        },
      },
      {
        $lookup: {
          from: "accepters",
          localField: "acceptorDocId",
          foreignField: "_id",
          as: "acceptorDoc",
        },
      },
      {
        $lookup: {
          from: "doners",
          localField: "donerDocId",
          foreignField: "_id",
          as: "donerDoc",
        },
      },
      {
        $unwind: {
          path: "$doner",
        },
      },
      {
        $unwind: {
          path: "$donerDoc",
        },
      },
      {
        $unwind: {
          path: "$acceptorDoc",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          docs: {
            $push: {
              donerDoc: "$donerDoc",
              acceptorDoc: "$acceptorDoc",
              doner: "$doner",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          docs: 1,
        },
      },
    ]);
    const finalDoc = { acceptor, ...filterDoc[0] };
    return res.status(200).send(new SuccessResponse(true, 200, finalDoc));
  } catch (error) {
    if (error instanceof MongooseError) {
      throw new ErrorResponse(false, {
        message: error.message,
        path: error?.fieldId,
      });
    }
    throw error;
  }
});

//all exports
export {
  acceptDonation,
  getAllByAcceptedDonations,
  getDocsByAcceptorMadeRequest,
};
