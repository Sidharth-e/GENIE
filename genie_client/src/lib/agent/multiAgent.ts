import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { checkpointer } from "./memory";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { AgentConfigOptions, createChatModel } from "./util";
import { getMCPTools } from "./mcp";
import { config } from "../../constants/config";
import AgentModel from "../database/models/Agent";
import connectDB from "../database/connect";

export interface SubAgentConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  modelName: string;
  provider: string;
  tools?: string[];
}

/**
 * Sanitize agent name to match OpenAI's pattern: ^[^\s<|\\/>]+$
 * Replaces spaces with underscores and removes invalid characters
 */
function sanitizeAgentName(name: string): string {
  return name
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[<|\\/>]/g, "") // Remove invalid characters
    .replace(/^_+|_+$/g, ""); // Trim leading/trailing underscores
}

/**
 * Load sub-agent configurations from database
 */
export async function loadSubAgentConfigs(
  subAgentIds: string[],
): Promise<SubAgentConfig[]> {
  await connectDB();
  const agents = await AgentModel.find({ _id: { $in: subAgentIds } });
  return agents.map((agent) => ({
    id: agent._id.toString(),
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
    modelName: agent.modelName,
    provider: agent.provider,
    tools: agent.tools,
  }));
}

/**
 * Create a sub-agent as a compiled graph for use by the supervisor
 */
async function createSubAgent(subAgentCfg: SubAgentConfig) {
  const model = createChatModel({
    provider: subAgentCfg.provider,
    model: subAgentCfg.modelName,
    temperature: 0.1,
  });

  // Load MCP tools and filter by allowed tools
  let mcpTools = await getMCPTools();
  if (subAgentCfg.tools && subAgentCfg.tools.length > 0) {
    mcpTools = mcpTools.filter((t) => subAgentCfg.tools?.includes(t.name));
  }

  const allTools = [...mcpTools] as StructuredToolInterface[];

  // Create a ReAct agent for this sub-agent
  const sanitizedName = sanitizeAgentName(subAgentCfg.name);
  const agent = createReactAgent({
    llm: model,
    tools: allTools,
    prompt: subAgentCfg.systemPrompt,
    name: sanitizedName,
  });

  return {
    agent,
    name: subAgentCfg.name,
    description: subAgentCfg.description || `Agent: ${subAgentCfg.name}`,
  };
}

/**
 * Create a supervisor agent that orchestrates multiple sub-agents.
 * The supervisor delegates tasks to specialized sub-agents based on the query.
 */
export async function createSupervisorAgent(cfg: AgentConfigOptions) {
  if (!cfg?.subAgentIds || cfg.subAgentIds.length === 0) {
    throw new Error("Supervisor requires at least one sub-agent");
  }

  // Create the supervisor's model
  const supervisorModel = createChatModel({
    provider: cfg.provider || config.DEFAULT_MODEL_PROVIDER,
    model: cfg.model || config.DEFAULT_MODEL_NAME,
    temperature: 0.1,
  });

  // Load and create sub-agents
  const subAgentConfigs = await loadSubAgentConfigs(cfg.subAgentIds);
  const subAgents = await Promise.all(
    subAgentConfigs.map((subCfg) => createSubAgent(subCfg)),
  );

  // Build the supervisor with sub-agents as compiled graphs
  const supervisorPrompt =
    cfg.systemPrompt ||
    `You are a supervisor agent coordinating a team of specialized agents.
      
Your sub-agents are:
${subAgents.map((sa) => `- ${sa.name}: ${sa.description}`).join("\n")}

When you receive a request:
1. Analyze what type of expertise is needed
2. Delegate to the most appropriate sub-agent
3. Coordinate responses from multiple agents if needed
4. Synthesize final answers for the user

Always aim to provide the best possible response by leveraging your team's expertise.`;

  // Create the supervisor using langgraph-supervisor
  const supervisorGraph = createSupervisor({
    agents: subAgents.map((sa) => sa.agent),
    llm: supervisorModel,
    prompt: supervisorPrompt,
  });

  // Compile with checkpointer for state persistence
  const compiledSupervisor = supervisorGraph.compile({
    checkpointer,
  });

  return compiledSupervisor;
}

/**
 * Check if an agent configuration requires multi-agent mode
 */
export function isMultiAgentMode(cfg?: AgentConfigOptions): boolean {
  return !!(cfg?.subAgentIds && cfg.subAgentIds.length > 0);
}
