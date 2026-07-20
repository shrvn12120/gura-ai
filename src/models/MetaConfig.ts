import mongoose, { Schema, Document } from "mongoose";

const MetaFieldSchema = new Schema(
  {
    key: { type: String, default: "" },
    label: { type: String, default: "" },
    type: {
      type: String,
      required: true,
      enum: ["boolean", "string", "number", "textarea", "select", "array"],
    },
    placeholder: String,
    defaultValue: Schema.Types.Mixed,
    options: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    itemSchema: [Schema.Types.Mixed],
  },
  { _id: false }
);

const SubCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    fields: {
      type: [MetaFieldSchema],
      default: [],
    },
  },
  { _id: false }
);

export interface IMetaField {
  key?: string;
  label?: string;
  type: "boolean" | "string" | "number" | "textarea" | "select" | "array";
  placeholder?: string;
  defaultValue?: any;
  options?: {
    label: string;
    value: string;
  }[];
  itemSchema:any
}

export interface ISubCategory {
  name: string;
  fields: IMetaField[];
}

export interface IMetaConfig extends Document {
  category: string;
  subCategories: ISubCategory[];
}

const MetaConfigSchema = new Schema<IMetaConfig>(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },

    subCategories: {
      type: [SubCategorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.MetaConfig ||
  mongoose.model<IMetaConfig>("MetaConfig", MetaConfigSchema);