import mongoose, { Schema, Document as MongooseDocument, Model } from "mongoose";

export interface IDocument extends MongooseDocument {
  document_id: string; // specialized ID if needed, or just use _id
  name: string;
  type: string;
  size: number;
  user_id: string;
  status: "uploading" | "processing" | "ready" | "failed";
  content_preview?: string;
  full_text_content?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    user_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "failed"],
      default: "uploading",
    },
    content_preview: { type: String },
    full_text_content: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// Prevent overwrite compile errors
delete mongoose.models.Document;

const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
