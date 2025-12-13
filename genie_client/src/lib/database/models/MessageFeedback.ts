import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageFeedback extends Document {
  messageId: string;
  threadId: string;
  userId: string;
  feedback: "like" | "dislike";
  createdAt: Date;
  updatedAt: Date;
}

const MessageFeedbackSchema: Schema = new Schema(
  {
    messageId: { type: String, required: true },
    threadId: { type: String, required: true },
    userId: { type: String, required: true },
    feedback: { type: String, enum: ["like", "dislike"], required: true },
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
  },
);

// Create compound index for unique feedback per user per message
MessageFeedbackSchema.index({ messageId: 1, userId: 1 }, { unique: true });

const MessageFeedback: Model<IMessageFeedback> =
  mongoose.models.MessageFeedback ||
  mongoose.model<IMessageFeedback>("MessageFeedback", MessageFeedbackSchema);

export default MessageFeedback;
