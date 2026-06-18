// src/models/listing.model.ts

import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema(
  {
    islandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Island",
      index: true,
      required: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

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

    category: {
      type: String,
      index: true,
      required: true,
    },

    subCategory: {
      type: String,
      index: true,
    },

    description: String,

    photos: [String],

    location: {
      lat: Number,
      lng: Number,
    },

    address: String,

    contact: {
      phone: String,
      whatsapp: String,
      email: String,
      website: String,
    },

    pricing: {
      type: Object,
      default: {},
    },

    attributes: {
      type: Object,
      default: {},
    },

    aiTags: {
      type: [String],
      default: [],
      index: true,
    },

    featured: {
      type: Boolean,
      default: false,
      index: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 👇 ADD THIS
ListingSchema.index({
  name: "text",
  description: "text",
  subCategory: "text",
});

export default mongoose.models.Listing ||
  mongoose.model("Listing", ListingSchema);