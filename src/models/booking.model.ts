// src/models/booking.model.ts

import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    islandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Island",
    },

    type: {
      type: String,
      enum: ["accommodation", "rental", "activity"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    startDate: Date,
    endDate: Date,

    guests: {
      adults: Number,
      children: Number,
    },

    totalPrice: Number,

    notes: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);