// src/models/island.model.ts

import mongoose from "mongoose";

const IslandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: String,

    heroImage: String,

    location: {
      lat: Number,
      lng: Number,
    },

    country: {
      type: String,
      default: "Maldives",
    },

    timezone: {
      type: String,
      default: "Indian/Maldives",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Island ||
  mongoose.model("Island", IslandSchema);