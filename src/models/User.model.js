import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      retuired: true,
    },

    email: {
      type: String,
      toLowerCase: true,
      unique: true,
      required: true,
    },

    profileAvatar: {
      type: String,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    location: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const hashedPasswod = await bcrypt.hash(this.password, 10);
      this.password = hashedPasswod;
    }
    next();
  } catch (error) {
    throw error;
  }
});

userSchema.methods.checkPassword = async function (planeTextPass) {
  try {
    const isCorrect = await bcrypt.compare(planeTextPass, this.password);
    return isCorrect;
  } catch (error) {
    throw error;
  }
};

userSchema.methods.generateToken = function () {
  try {
    const payload = {
      userId: this._id,
    };
    const signature = process.env.SIGNATURE_TOKEN;

    if (!signature) {
      throw new Error(
        "No signature found. Ensure SIGNATURE_TOKEN is set in environment variables."
      );
    }

    const token = jwt.sign(payload, signature, {
      expiresIn: String(process.env.EXP_TOKEN),
    });
    console.log(String(process.env.EXP_TOKEN));
    return token;
  } catch (error) {
    throw error;
  }
};

export const Users = mongoose.model("Users", userSchema);
