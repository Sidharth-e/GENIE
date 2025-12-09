import { ChatOpenAI } from "@langchain/openai";
import { AzureChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface CreateChatModelOptions {
  provider?: string; // 'openai' | 'google' | others later
  model: string;
  temperature?: number;
}

/**
 * Central factory for creating a chat model based on provider + model name.
 */
export function createChatModel({
  provider = "google",
  model,
  temperature = 1,
}: CreateChatModelOptions): BaseChatModel {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({ model, temperature });
    case "azure-openai":
      return new AzureChatOpenAI({ model, temperature });
    case "google":
    default:
      return new ChatGoogleGenerativeAI({ model, temperature });
  }
}
export interface AgentConfigOptions {
  model?: string;
  provider?: string; // 'google' | 'openai' etc.
  systemPrompt?: string; // system prompt override
  tools?: unknown[]; // tools from registry or direct tool objects
  allowedTools?: string[]; // names of tools to allow from MCP
  approveAllTools?: boolean; // if true, skip tool approval prompts
  subAgentIds?: string[]; // IDs of sub-agents for multi-agent mode
  recursionLimit?: number; // Max iterations for multi-agent supervisor (default: 25)
}
