import mongoose, { Schema, Document, Model } from "mongoose";

export interface IThread extends Document {
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    agentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ThreadSchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },
        title: { type: String, required: true },
        agentId: { type: Schema.Types.ObjectId, ref: "Agent" },
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

const Thread: Model<IThread> =
    mongoose.models.Thread || mongoose.model<IThread>("Thread", ThreadSchema);

export default Thread;
