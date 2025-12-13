import { ensureAgentInstance } from "@/lib/agent";
import { ensureThread } from "@/lib/thread";
import type {
  MessageOptions,
  MessageResponse,
  ToolCall,
} from "@/types/message";
import connectDB from "@/lib/database/connect";
import Thread from "@/lib/database/models/Thread";
import { getHistory } from "@/lib/agent/memory";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import AgentModel from "@/lib/database/models/Agent";
import DocumentModel from "@/lib/database/models/Document";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * Returns an async iterable producing incremental AI text chunks for a user text input.
 * Thread is ensured before streaming. The consumer (route) can package into SSE or any protocol.
 */
export async function streamResponse(params: {
  threadId: string;
  userText: string;
  opts?: MessageOptions;
  userInfo?: { userId: string; userName: string; userEmail: string };
}) {
  const { threadId, userText, opts, userInfo } = params;

  // Resolve agentId from options
  const thread = await ensureThread(
    threadId,
    userText,
    userInfo,
    opts?.agentId,
  );

  // Handle Document Injection
  let finalContent: any = userText;
  let hasImages = false;

  if (opts?.documentIds && opts.documentIds.length > 0) {
    try {
      await connectDB();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documents = await (DocumentModel as any).find({
        _id: { $in: opts.documentIds },
      });

      if (documents.length > 0) {
        const textDocs = documents.filter(
          (doc: any) => !doc.type.startsWith("image/"),
        );
        const imageDocs = documents.filter((doc: any) =>
          doc.type.startsWith("image/"),
        );

        // 1. Combine all text docs into the user text
        if (textDocs.length > 0) {
          const docContext = textDocs
            .map(
              (doc: any) =>
                `\n---\n[Document: ${doc.name}]\n${doc.full_text_content || "(No text content)"}\n---`,
            )
            .join("\n");
          finalContent = `${userText}\n\nAttached Documents:${docContext}`;
        }

        // 2. If we have images, switch to Multimodal Message format (array)
        if (imageDocs.length > 0) {
          hasImages = true;
          const contentArray: any[] = [{ type: "text", text: finalContent }];

          for (const imgDoc of imageDocs) {
            if (
              imgDoc.full_text_content &&
              imgDoc.full_text_content.startsWith("data:image")
            ) {
              contentArray.push({
                type: "image_url",
                image_url: { url: imgDoc.full_text_content },
              });
            }
          }
          finalContent = contentArray;
        }
      }
    } catch (error) {
      console.error("Error fetching attached documents", error);
    }
  }

  // If allowTool is present, use Command with resume action instead of regular inputs
  const inputs = opts?.allowTool
    ? new Command({
        resume: {
          action: opts.allowTool === "allow" ? "continue" : "update",
          data: {},
        },
      })
    : {
        messages: [
          new HumanMessage({
            content: finalContent,
            additional_kwargs: opts?.documentIds
              ? { document_ids: opts.documentIds }
              : {},
          }),
        ],
      };

  let agentConfig: {
    model: string | undefined;
    provider: string | undefined;
    allowedTools: string[] | undefined;
    systemPrompt: string | undefined;
    subAgentIds?: string[];
    recursionLimit?: number;
  } = {
    model: opts?.model,
    provider: opts?.provider,
    // tools: opts?.tools, // opts.tools are strings, so we map to allowedTools
    allowedTools: opts?.tools,
    systemPrompt: undefined as string | undefined,
  };

  // Resolve agentId from options or fallback to thread's agentId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const effectiveAgentId = opts?.agentId || (thread as any).agentId;

  if (effectiveAgentId) {
    try {
      await connectDB();
      const agentDoc = await AgentModel.findById(effectiveAgentId);
      if (agentDoc) {
        agentConfig.model = agentDoc.modelName;
        agentConfig.provider = agentDoc.provider;

        if (agentDoc.tools) {
          agentConfig.allowedTools = agentDoc.tools;
        }
        if (agentDoc.systemPrompt) {
          agentConfig.systemPrompt = agentDoc.systemPrompt;
        }
        // Load sub-agent IDs for multi-agent mode
        if (agentDoc.subAgentIds && agentDoc.subAgentIds.length > 0) {
          agentConfig.subAgentIds = agentDoc.subAgentIds;
        }
        // Load recursion limit for multi-agent mode
        if (agentDoc.recursionLimit) {
          agentConfig.recursionLimit = agentDoc.recursionLimit;
        }
      }
    } catch (e) {
      console.error("Error loading agent", e);
    }
  }

  const agent = await ensureAgentInstance(agentConfig);

  // Type assertion needed for Command union with state update in v1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iterable = await agent.stream(inputs as any, {
    streamMode: ["updates"],
    configurable: { thread_id: threadId },
    // recursionLimit controls max iterations for multi-agent supervisor
    recursionLimit: agentConfig.recursionLimit || 25,
  });

  async function* generator(): AsyncGenerator<MessageResponse, void, unknown> {
    for await (const chunk of iterable) {
      if (!chunk) continue;

      // Handle tuple format: [type, data]
      if (Array.isArray(chunk) && chunk.length === 2) {
        const [chunkType, chunkData] = chunk;

        if (
          chunkType === "updates" &&
          chunkData &&
          typeof chunkData === "object" &&
          !Array.isArray(chunkData)
        ) {
          // Handle model_request node updates: ['updates', { model_request: { messages: [Array] } }]
          // Note: createAgent from langchain uses 'model_request' not 'agent'
          if (
            "model_request" in chunkData &&
            chunkData.model_request &&
            typeof chunkData.model_request === "object" &&
            !Array.isArray(chunkData.model_request) &&
            "messages" in chunkData.model_request
          ) {
            const messages = Array.isArray(chunkData.model_request.messages)
              ? chunkData.model_request.messages
              : [chunkData.model_request.messages];
            for (const message of messages) {
              if (!message) continue;

              // Check for AIMessage - the serialized form has lc/type/id/kwargs structure
              const isAIMessage =
                message?.constructor?.name === "AIMessageChunk" ||
                message?.constructor?.name === "AIMessage" ||
                (message?.type === "constructor" &&
                  message?.id?.includes("AIMessage"));

              if (!isAIMessage) continue;

              // Handle both direct message and serialized format
              const msgAny = message as any;
              const messageData = msgAny.kwargs || message;
              const messageWithTools = messageData as unknown as Record<
                string,
                unknown
              >;
              const processedMessage = processAIMessage(messageWithTools);
              if (processedMessage) {
                yield processedMessage;
              }
            }
          }

          // Handle tools node updates: ['updates', { tools: { messages: [Array] } }]
          // This is needed for resumed tool executions to show their results
          if (
            "tools" in chunkData &&
            chunkData.tools &&
            typeof chunkData.tools === "object" &&
            !Array.isArray(chunkData.tools) &&
            "messages" in chunkData.tools
          ) {
            const toolMessages = Array.isArray(chunkData.tools.messages)
              ? chunkData.tools.messages
              : [chunkData.tools.messages];
            for (const toolMsg of toolMessages) {
              if (!toolMsg) continue;

              const isToolMessage =
                toolMsg?.constructor?.name === "ToolMessage" ||
                toolMsg?.constructor?.name === "ToolMessageChunk";

              if (isToolMessage) {
                // Yield tool result as a tool type message
                // Cast to access ToolMessage-specific properties
                const toolMsgData = toolMsg as unknown as Record<
                  string,
                  unknown
                >;
                yield {
                  type: "tool",
                  data: {
                    id: (toolMsgData.id as string) || `tool-${Date.now()}`,
                    content:
                      typeof toolMsgData.content === "string"
                        ? toolMsgData.content
                        : JSON.stringify(toolMsgData.content),
                    tool_call_id: toolMsgData.tool_call_id as string,
                    name: toolMsgData.name as string,
                  },
                };
              }
            }
          }

          // Handle multi-agent (supervisor) updates
          // Supervisor chunks come as: ['updates', { <agent_name>: { messages: [...] } }]
          // Iterate over all keys in chunkData to catch dynamically named agent nodes
          const knownNodes = ["model_request", "tools", "__interrupt__"];
          for (const nodeKey of Object.keys(chunkData)) {
            if (knownNodes.includes(nodeKey)) continue;

            const nodeData = (chunkData as Record<string, any>)[nodeKey];
            if (
              nodeData &&
              typeof nodeData === "object" &&
              !Array.isArray(nodeData) &&
              "messages" in nodeData
            ) {
              const messages = Array.isArray(nodeData.messages)
                ? nodeData.messages
                : [nodeData.messages];

              for (const message of messages) {
                if (!message) continue;

                // Check for AIMessage types
                const isAIMessage =
                  message?.constructor?.name === "AIMessageChunk" ||
                  message?.constructor?.name === "AIMessage" ||
                  message?._getType?.() === "ai" ||
                  (message?.type === "constructor" &&
                    message?.id?.includes("AIMessage"));

                if (isAIMessage) {
                  const msgAny = message as any;
                  const messageData = msgAny.kwargs || message;
                  const processedMessage = processAIMessage(
                    messageData as Record<string, unknown>,
                  );
                  if (processedMessage) {
                    yield processedMessage;
                  }
                  continue;
                }

                // Check for ToolMessage
                const isToolMessage =
                  message?.constructor?.name === "ToolMessage" ||
                  message?.constructor?.name === "ToolMessageChunk" ||
                  message?._getType?.() === "tool";

                if (isToolMessage) {
                  const toolMsgData = message as unknown as Record<
                    string,
                    unknown
                  >;
                  yield {
                    type: "tool",
                    data: {
                      id: (toolMsgData.id as string) || `tool-${Date.now()}`,
                      content:
                        typeof toolMsgData.content === "string"
                          ? toolMsgData.content
                          : JSON.stringify(toolMsgData.content),
                      tool_call_id: toolMsgData.tool_call_id as string,
                      name: toolMsgData.name as string,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
  }
  return generator();
}

// Helper function to process any AI message and return the appropriate MessageResponse
// Helper function to process any AI message and return the appropriate MessageResponse
function processAIMessage(
  message: Record<string, unknown>,
): MessageResponse | null {
  // Check if this is a tool call (modern tool_calls or legacy content array)
  const hasToolCallsData =
    (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) ||
    (Array.isArray(message.tool_call_chunks) &&
      message.tool_call_chunks.length > 0);

  const hasLegacyToolCall =
    Array.isArray(message.content) &&
    message.content.some(
      (item: unknown) =>
        item && typeof item === "object" && "functionCall" in item,
    );

  // Handle text content extraction
  let text = "";
  if (typeof message.content === "string") {
    text = message.content;
  } else if (Array.isArray(message.content)) {
    text = message.content
      .map((c: string | { text?: string }) =>
        typeof c === "string" ? c : c?.text || "",
      )
      .join("");
  } else {
    text = String(message.content ?? "");
  }

  // If we have tools or text, return the message
  if (hasToolCallsData || hasLegacyToolCall || text.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls = (message.tool_calls as any[]) || undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCallChunks = (message.tool_call_chunks as any[]) || undefined;

    return {
      type: "ai",
      data: {
        id: (message.id as string) || Date.now().toString(),
        content: text, // Always include text (can be empty)
        tool_calls: toolCalls,
        tool_call_chunks: toolCallChunks,
        additional_kwargs:
          (message.additional_kwargs as Record<string, unknown>) || undefined,
        response_metadata:
          (message.response_metadata as Record<string, unknown>) || undefined,
      },
    };
  }

  return null;
}

/** Fetch prior messages for a thread from the LangGraph checkpoint/memory system. */
export async function fetchThreadHistory(
  threadId: string,
  userId?: string,
): Promise<MessageResponse[]> {
  await connectDB();
  const thread = await Thread.findById(threadId);

  if (!thread) return [];
  if (userId && thread.userId && thread.userId !== userId) {
    throw new Error("Unauthorized: Thread belongs to another user");
  }

  try {
    const history = await getHistory(threadId);
    return history.map((msg: BaseMessage) => msg.toDict() as MessageResponse);
  } catch (e) {
    console.error("fetchThreadHistory error", e);
    return [];
  }
}
