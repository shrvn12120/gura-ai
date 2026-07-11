import mongoose, { Schema, Model } from "mongoose";


export type NoticeType =
  | "event"
  | "announcement"
  | "warning"
  | "info";


export type NoticePriority =
  | "low"
  | "medium"
  | "high";


export interface INotice {
    _id?:string;
  title: string;
  message: string;
  type: NoticeType;
  priority: NoticePriority;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}


const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "event",
        "announcement",
        "warning",
        "info",
      ],
      default: "info",
    },

    priority: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
      ],
      default: "medium",
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


const Notice: Model<INotice> =
  mongoose.models.Notice ||
  mongoose.model<INotice>(
    "Notice",
    NoticeSchema
  );


export default Notice;