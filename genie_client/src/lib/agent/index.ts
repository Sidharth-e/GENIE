import { DEFAULT_SYSTEM_PROMPT as SYSTEM_PROMPT } from "../../constants/prompt";
import { checkpointer } from "./memory";
import type {
  DynamicTool,
  StructuredToolInterface,
} from "@langchain/core/tools";
import { createAgent } from "langchain";
import { AgentConfigOptions, createChatModel } from "./util";
import { getMCPTools } from "./mcp";
import { config } from "../../constants/config";
import { isMultiAgentMode, createSupervisorAgent } from "./multiAgent";

/**
 * Create a new agent instance with the given configuration.
 * Uses LangGraph's createReactAgent for a standardized ReAct agent pattern.
 * Supports multi-agent mode when subAgentIds are provided.
 * @param cfg Configuration options for the agent
 * @returns Compiled agent graph
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createAgentInstance(cfg?: AgentConfigOptions): Promise<any> {
  // Check if multi-agent mode is requested
  if (isMultiAgentMode(cfg)) {
    return createSupervisorAgent(cfg!);
  }

  // Single agent mode (default)
  // Resolve model/provider from cfg or defaults.
  const provider = cfg?.provider || config.DEFAULT_MODEL_PROVIDER;
  const modelName = cfg?.model || config.DEFAULT_MODEL_NAME;
  const model = createChatModel({
    provider,
    model: modelName,
    temperature: 0.1,
  });

  // Load MCP tools
  let mcpTools = await getMCPTools();
  if (cfg?.allowedTools) {
    mcpTools = mcpTools.filter((t) => cfg.allowedTools?.includes(t.name));
  }

  const configTools = (cfg?.tools || []) as StructuredToolInterface[];
  const allTools = [...configTools, ...mcpTools] as DynamicTool[];

  // Create ReAct agent using LangGraph's prebuilt function
  const agent = createAgent({
    model,
    tools: allTools,
    systemPrompt: cfg?.systemPrompt || SYSTEM_PROMPT,
    checkpointer,
  });

  return agent;
}

// Public helper if explicit readiness is ever needed elsewhere.
export async function ensureAgentInstance(cfg?: AgentConfigOptions) {
  return createAgentInstance(cfg);
}

// Named export to explicitly fetch a configured agent.
export async function getAgentInstance(cfg?: AgentConfigOptions) {
  return ensureAgentInstance(cfg);
}

// Eagerly create a default agent at module load using env defaults.
export const defaultAgent = await ensureAgentInstance();
