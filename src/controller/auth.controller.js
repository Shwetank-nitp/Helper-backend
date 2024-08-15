import { asyncHandler } from "../utils/asyncHandler.js";
import { Users } from "../models/User.model.js";
import uploadToCloud from "../utils/cloudUpload.js";
import { ErrorResponse } from "../utils/ErrorResponse.js";
import { SuccessResponse } from "../utils/SuccessResponse.js";
import mongoose from "mongoose";
import fs from "fs/promises";
import jwt from "jsonwebtoken";

const tokenName = "health_auth_token";
const { JsonWebTokenError } = jwt;

//cookie-options
const options = {
  httpOnly: true,
  secure: process.env.MODE != "DEV",
  expires: Number(process.env.EXP_TOKEN),
};

//toclear the disk after uploading of file;
async function clearDisk(filepath) {
  await fs.unlink(filepath);
  console.log("file deleted");
}

const createAccount = asyncHandler(async (req, res) => {
  const { fullname, password, email, gender, country, location } = req.body;

  //profilePicture
  if (!req?.filepath) {
    throw new ErrorResponse(false, "no file uploaded in assets!", 500);
  }
  let url = undefined;

  try {
    url = await uploadToCloud(req.filepath);
  } catch (error) {
    throw new ErrorResponse(false, "file uploading error in cloudneary", 500);
  } finally {
    await clearDisk(req.filepath);
  }

  if (!url) {
    throw new ErrorResponse(false, "no avatar file found!", 500);
  }

  const doc = {
    fullname,
    email,
    password,
    profileAvatar: url,
    gender,
    country,
    location,
  };

  try {
    const genDoc = await Users.create(doc);
    const { password, ...others } = doc;
    const token = genDoc.generateToken();
    res.cookie(tokenName, token, options);
    return res.json(new SuccessResponse(true, 201, others));
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      console.log("validation error");
      throw new ErrorResponse(false, error.message, 401);
    }
    if (error.name === "MongoServerError") {
      console.log("server_error");
      throw new ErrorResponse(
        false,
        {
          name: error.name,
          info: error.message,
          path: error.fieldId,
        },
        401
      );
    }
    throw error;
  }
});

const getAccountInfo = asyncHandler(async (req, res) => {
  const userId = req.userId;
  console.log(userId);
  const clientDoc = await Users.findById(userId).select("-password");
  if (!clientDoc) {
    throw new ErrorResponse(false, "No user found with the provided ID", 404);
  }
  return res.send(new SuccessResponse(true, 200, clientDoc));
});

//update trivial details other the password
const updateOptions = ["email", "country", "gender", "location", "fullname"];
const updateAccountInfo = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const data = {};

  updateOptions.forEach((item) => {
    if (req.body[item]) {
      data[item] = req.body[item];
    }
  });
  try {
    const updateDoc = await Users.findByIdAndUpdate(userId, data, {
      new: true,
      runValidators: true,
    }).select("-password");
    return res.send(new SuccessResponse(true, 200, updateDoc));
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      throw new ErrorResponse(false, error.message, 401);
    }
    throw error;
  }
});

const updateAvatar = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const filepath = req.filepath;

  if (!filepath) {
    throw new ErrorResponse(false, "No avatar file found!", 400); // Use 400 Bad Request for client errors
  }

  let url = undefined;

  try {
    url = await uploadToCloud(filepath);
  } catch (error) {
    throw error;
  } finally {
    await clearDisk(filepath);
  }

  try {
    await Users.findByIdAndUpdate(userId, { profileAvatar: url });
    return res.send(
      new SuccessResponse(true, 200, "Avatar updated successfully")
    );
  } catch (error) {
    throw new ErrorResponse(
      false,
      { message: "Error updating the database" },
      500
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { password, conformPassword } = req.body;

  if (password != conformPassword) {
    throw new ErrorResponse(
      false,
      { message: `${password} dose not match` },
      401
    );
  }
  const { token } = req.query;
  if (!token) {
    throw new ErrorResponse(false, "fail to get token from query parms", 400);
  }
  const signature = process.env.SIGNATURE_TOKEN;
  if (!signature) {
    throw new ErrorResponse(
      "No signature found, check environment variables",
      500
    );
  }
  try {
    const response = jwt.verify(token, signature, { complete: true });
    const userId = response.payload.userId;

    if (!userId) {
      throw new ErrorResponse(false, "user id is not present in token", 401);
    }
    const user = await Users.findById(userId);
    if (!user) {
      throw new ErrorResponse(false, "no user found", 404);
    }
    user.password = password;
    await user.save();
    return res
      .status(201)
      .send(new SuccessResponse(true, 201, "password changed successfully"));
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorResponse(false, { message: error.message }, 400);
    }
    throw error;
  }
});

const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.userId;
  await Users.findOneAndDelete({ _id: userId });
  res.status(200).send(new SuccessResponse(true, 200, "Successfully deleted"));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ErrorResponse(false, "missing email", 404);
  }
  if (!password) {
    throw new ErrorResponse(false, "missing password", 404);
  }
  const user = await Users.findOne({ email });
  if (!user) {
    throw new ErrorResponse(false, "No user found!", 404);
  }
  const isCorrect = await user.checkPassword(password);
  if (!isCorrect) {
    throw new ErrorResponse(
      false,
      "Username and password dose not match!",
      401
    );
  }
  const { password: pass, ...others } = user.toObject();
  const token = user.generateToken();
  console.log(process.env.EXP_TOKEN);
  res.cookie(tokenName, token, options);
  return res.status(200).send(new SuccessResponse(true, 200, others));
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(tokenName, options);
  return res
    .status(200)
    .send(new SuccessResponse(true, 200, "user logout successfull"));
});

//All exports
export {
  createAccount,
  getAccountInfo,
  updateAccountInfo,
  updateAvatar,
  changePassword,
  deleteAccount,
  login,
  logout,
};
