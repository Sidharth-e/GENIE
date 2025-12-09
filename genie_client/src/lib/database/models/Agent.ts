import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgent extends Document {
  userId: string;
  userName: string;
  userEmail: string;
  name: string;
  description?: string;
  systemPrompt: string;
  modelName: string;
  provider: string; // 'google', 'openai', etc.
  tools?: string[]; // Array of tool names from MCP or internal
  subAgentIds?: string[]; // IDs of sub-agents this agent can delegate to
  recursionLimit?: number; // Max iterations for multi-agent interactions (default: 25)
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    systemPrompt: { type: String, required: true },
    modelName: { type: String, required: true },
    provider: { type: String, required: true },
    tools: [{ type: String }],
    subAgentIds: [{ type: String }], // IDs of sub-agents for multi-agent mode
    recursionLimit: { type: Number, default: 25 }, // Max iterations for multi-agent
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

AgentSchema.index({ userId: 1, name: 1 }, { unique: true });

const Agent: Model<IAgent> =
  mongoose.models.Agent || mongoose.model<IAgent>("Agent", AgentSchema);

export default Agent;
