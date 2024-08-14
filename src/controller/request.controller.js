import mongoose, { MongooseError } from "mongoose";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { SuccessResponse } from "../utils/SuccessResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Accepters } from "../models/Accepter.model.js";

//create a request - Done
const makeDocRequest = asyncHandler(async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    throw new ErrorResponse(false, { message: "user not found!" }, 404);
  }

  const { bloodGroup, location, country } = req.body;

  if (!bloodGroup) {
    throw new ErrorResponse(false, { message: "BloodGroup is Required" }, 401);
  }

  const newDoc = {
    userId,
    bloodGroup,
    country,
    location,
  };
  try {
    const createDoc = await Accepters.create(newDoc);
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
          error: error.message,
          path: error?.fieldId,
        },
        401
      );
    }
    throw new ErrorResponse(false, { message: error.message }, 500);
  }
});

//Get all the documetns that rase the request for blood
const getAllAcceptorDocuments = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);

  if (!userId) {
    throw new ErrorResponse(false, "User not found", 404);
  }

  try {
    const listOfAllDoc = await Accepters.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accepters: { $push: "$$ROOT" },
        },
      },
      {
        $addFields: {
          accepters: {
            $sortArray: {
              input: "$accepters",
              sortBy: { createdAt: -1 },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          accepters: 1,
        },
      },
    ]);
    return res
      .status(200)
      .send(
        new SuccessResponse(
          true,
          200,
          listOfAllDoc[0] || { total: 0, accepters: [] }
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

//Get a document : ID
const getDocById = asyncHandler(async (req, res) => {
  const _id = req.query;
  console.log(_id);
  const doc = await Accepters.findById(_id);
  if (!doc) {
    throw new ErrorResponse(false, { message: "doc not found" }, 404);
  }
  return res.status(200).send(new SuccessResponse(true, 200, doc));
});

//delete request
const removeRequst = asyncHandler(async (req, res) => {
  const _id = req.body._id;
  console.log("deleted: ", _id);
  await Accepters.findByIdAndDelete(_id);
  res.status(200).send(new SuccessResponse(true, 200, "deleted Successfully"));
});

//update donation doc
const params = ["bloodGroup", "country", "location"];
const updateDetails = asyncHandler(async (req, res) => {
  const _id = req.body._id;
  const doc = {};

  if (!_id) {
    throw new ErrorResponse(false, "doc id is not present!", 404);
  }

  params.forEach((item) => {
    if (req.body[item]) {
      doc[item] = req.body[item];
    }
  });

  try {
    const updateDoc = await Accepters.findByIdAndUpdate(_id, doc, {
      runValidators: true,
      new: true,
    });
    res.status(200).send(new SuccessResponse(true, 200, updateDoc));
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new ErrorResponse(
        false,
        { error: error.message, path: error.path },
        401
      );
    }
    throw error;
  }
});

//Search for Acceptors
const types = ["bloodGroup", "country", "location"];
const searchAcceptor = asyncHandler(async (req, res) => {
  const { search, type } = req.query;

  let { isValidReq } = req.query;
  if (isValidReq === "undefined") isValidReq = undefined;
  else if (isValidReq === "true") isValidReq = true;
  else if (isValidReq === "false") isValidReq = false;

  if (!types.includes(type)) {
    throw new ErrorResponse(
      false,
      "type :" + type + " invalid search type",
      401
    );
  }

  const filterPipline = {
    $and: [
      { [type]: search === "+" ? "+" : { $regex: search, $options: "i" } },
    ],
  };

  if (isValidReq != undefined) {
    filterPipline.$and.push({ requestValid: isValidReq });
  }

  const searchResult = await Accepters.aggregate([
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
            valid: "$requestValid",
            type: "request",
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
  res
    .status(200)
    .send(
      new SuccessResponse(
        true,
        200,
        searchResult[0] || { total: 0, search: [] }
      )
    );
});

export {
  makeDocRequest,
  getAllAcceptorDocuments,
  getDocById,
  removeRequst,
  updateDetails,
  searchAcceptor,
};
