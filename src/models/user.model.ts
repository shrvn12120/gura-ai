// src/models/user.model.ts

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "user", "business"],
      default: "user",
      index: true,
    },

    phone: String,

    avatar: String,

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);