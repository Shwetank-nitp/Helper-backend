import mongoose, { MongooseError } from "mongoose";
import { Doners } from "../models/Doner.mode.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { SuccessResponse } from "../utils/SuccessResponse.js";

//create a donation
const makeDonation = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    throw new ErrorResponse(false, { message: "user not found!" }, 404);
  }
  console.log(req.body);
  const { bloodGroup, location, country } = req.body;

  if (!bloodGroup) {
    throw new ErrorResponse(false, "BloodGroup is Required", 400);
  }

  const newDoc = {
    userId,
    bloodGroup,
    country,
    location,
  };
  try {
    const createDoc = await Doners.create(newDoc);
    if (!createDoc) {
      throw new ErrorResponse(
        false,
        {
          message: "doc not found",
        },
        404
      );
    }
    return res.send(new SuccessResponse(true, 200, createDoc));
  } catch (error) {
    if (error instanceof MongooseError) {
      throw new ErrorResponse(
        false,
        {
          message: error.message,
          path: error?.fieldId,
        },
        401
      );
    }
    throw new ErrorResponse(false, { message: error.message }, 500);
  }
});

//Get all donerRequests
const getAllDonerRequests = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);

  if (!userId) {
    throw new ErrorResponse(false, "User not found", 404);
  }

  try {
    const listOfAllDoc = await Doners.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          doners: { $push: "$$ROOT" },
        },
      },
      {
        $addFields: {
          doners: {
            $sortArray: {
              input: "$doners",
              sortBy: { createdAt: -1 },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          doners: 1,
        },
      },
    ]);
    return res
      .status(200)
      .send(
        new SuccessResponse(
          true,
          200,
          listOfAllDoc[0] || { total: 0, doners: [] }
        )
      );
  } catch (error) {
    if (error instanceof MongooseError) {
      throw new ErrorResponse(
        false,
        {
          message: error.message,
          path: error?.fieldId,
        },
        401
      );
    }
  }
});

//Get a document
const getDocById = asyncHandler(async (req, res) => {
  const { _id } = req.query;

  const doc = await Doners.findById(_id);
  if (!doc) {
    throw new ErrorResponse(false, { message: "doc not found" }, 404);
  }
  return res.status(200).send(new SuccessResponse(true, 200, doc));
});

//delete request
const removeDonation = asyncHandler(async (req, res) => {
  const _id = req.body._id;
  await Doners.findByIdAndDelete(_id);
  res.status(200).send(new SuccessResponse(true, 200, "deleted Successfully"));
});

//update donation doc
const updateDetails = asyncHandler(async (req, res) => {
  const _id = req.body._id;
  const doc = {};

  ["bloodGroup", "country", "location"].forEach((item) => {
    if (req.body[item]) {
      doc[item] = req.body[item];
    }
  });
  try {
    const updateDoc = await Doners.findByIdAndUpdate(_id, doc, {
      runValidators: true,
      new: true,
    });
    return res.status(200).send(new SuccessResponse(true, 200, updateDoc));
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new ErrorResponse(
        false,
        { error: error.message, path: error?.path },
        400
      );
    }
    throw error;
  }
});

//search for doner
const types = ["bloodGroup", "country", "location"];
const searchDoner = asyncHandler(async (req, res) => {
  const { search, type } = req.query;

  let { isAvalable } = req.query;
  if (isAvalable === "undefined") isAvalable = undefined;
  else if (isAvalable === "true") isAvalable = true;
  else if (isAvalable === "false") isAvalable = false;

  if (!types.includes(type)) {
    throw new ErrorResponse(
      false,
      {
        message: "type :" + type + " invalid search type",
      },
      401
    );
  }

  const filterPipline = {
    $and: [
      { [type]: search === "+" ? "+" : { $regex: search, $options: "i" } },
    ],
  };
  if (isAvalable != undefined) {
    filterPipline.$and.push({ avalable: isAvalable });
  }

  const searchResult = await Doners.aggregate([
    {
      $match: {
        ...filterPipline,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        search: {
          $push: {
            user: "$user",
            bloodGroup: "$bloodGroup",
            location: "$location",
            country: "$country",
            valid: "$avalable",
            type: "donation",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        search: 1,
      },
    },
  ]);
  return res
    .status(200)
    .send(
      new SuccessResponse(
        true,
        200,
        searchResult[0] || { total: 0, search: [] }
      )
    );
});

//all exports
export {
  makeDonation,
  updateDetails,
  searchDoner,
  removeDonation,
  getAllDonerRequests,
  getDocById,
};
