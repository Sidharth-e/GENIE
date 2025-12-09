export interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  modelName: string;
  provider: string;
  tools?: string[];
  subAgentIds?: string[]; // IDs of sub-agents this agent can delegate to
  recursionLimit?: number; // Max iterations for multi-agent interactions (default: 25)
  createdAt: string;
  updatedAt: string;
}
