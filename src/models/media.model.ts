// src/models/media.model.ts

import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Media ||
  mongoose.model("Media", MediaSchema);