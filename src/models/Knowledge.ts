import { Schema, model, models } from "mongoose";

const KnowledgeSchema = new Schema(
  {
    title: String,

    content: String,

    searchableText: String,

    embedding: {
      type: [Number],
      default: [],
    },

    tags: [String],
  },
  {
    timestamps: true,
  }
);

export default models.Knowledge || model("Knowledge", KnowledgeSchema);