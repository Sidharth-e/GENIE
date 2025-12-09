import mongoose, { Schema, Document, Model } from "mongoose";

export enum MCPServerType {
    stdio = "stdio",
    http = "http",
}

export interface IMCPServer extends Document {
    userId: string;
    userName: string;
    userEmail: string;
    name: string;
    type: MCPServerType;
    enabled: boolean;
    command?: string;
    args?: any;
    env?: any;
    url?: string;
    headers?: any;
    createdAt: Date;
    updatedAt: Date;
}

const MCPServerSchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },
        name: { type: String, required: true },
        type: {
            type: String,
            enum: Object.values(MCPServerType),
            required: true,
        },
        enabled: { type: Boolean, default: true },
        // For stdio servers
        command: { type: String },
        args: { type: Schema.Types.Mixed },
        env: { type: Schema.Types.Mixed },
        // For http servers
        url: { type: String },
        headers: { type: Schema.Types.Mixed },
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

MCPServerSchema.index({ userId: 1, name: 1 }, { unique: true });

const MCPServer: Model<IMCPServer> =
    mongoose.models.MCPServer ||
    mongoose.model<IMCPServer>("MCPServer", MCPServerSchema);

export default MCPServer;
