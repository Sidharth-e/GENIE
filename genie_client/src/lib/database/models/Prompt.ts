import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrompt extends Document {
    userId: string;
    name: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const PromptSchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        content: { type: String, required: true },
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

PromptSchema.index({ userId: 1, name: 1 });

const Prompt: Model<IPrompt> =
    mongoose.models.Prompt || mongoose.model<IPrompt>("Prompt", PromptSchema);

export default Prompt;
