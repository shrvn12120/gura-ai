import { Schema, model, models } from "mongoose";

/* ---------------- SOCIAL ---------------- */

const SocialSchema = new Schema(
  {
    name: { type: String, default: "" },
    link: { type: String, default: "" },
  },
  { _id: false }
);

/* ---------------- IMAGE ---------------- */

const ImageSchema = new Schema(
  {
    id: { type: String, default: "" },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

/* ---------------- CONTACT INFO ---------------- */

const ContactInfoSchema = new Schema(
  {
    address: String,
    phone: String,
    email: String,
    whatsapp: String,

    socials: {
      type: [SocialSchema],
      default: [],
    },

    coordinates: {
      lat: { type: String },
      lng: { type: String},
    },
  },
  { _id: false }
);

/* ---------------- LISTING ---------------- */

const ListingSchema = new Schema(
  {
    title: { type: String, required: true },

    slug: { type: String, required: true, unique: true },

    category: { type: String, required: true },

    subCategory: { type: String, default: "default" },

    description: { type: String, default: "" },

    contact_info: {
      type: ContactInfoSchema,
      default: () => ({}),
    },

    images: {
      type: [ImageSchema],
      default: [],
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /* Optional AI / search */
    searchableText: {
      type: String,
      default: "",
    },

    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default models.Listing || model("Listing", ListingSchema);