"use client";
import { config } from "@/constants/config";
import { MessageInput } from "./MessageInput";
import MessageList from "./MessageList";
import { useChatThread } from "@/hooks/useChatThread";
import { useAgents } from "@/hooks/useAgents";
import { ScrollArea } from "./ui/scroll-area";
import { PENDING_MESSAGE_KEY, PendingMessage } from "./NewChatView";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageOptions } from "@/types/message";

interface ThreadProps {
  threadId: string;
}

export const Thread = ({ threadId }: ThreadProps) => {
  const router = useRouter();
  const chatThreadData = useChatThread({ threadId });
  const {
    messages,
    isLoadingHistory,
    historyError,
    isSending,
    sendMessage,
    approveToolExecution,
  } = chatThreadData;

  // Hoisted state for MessageInput to persist across unmount/remount
  const [provider, setProvider] = useState<string>(
    config.DEFAULT_MODEL_PROVIDER,
  );
  const [model, setModel] = useState<string>(config.DEFAULT_MODEL_NAME);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    undefined,
  );
  // Track initial tools from pending message (for Scenario 3/4)
  const [initialTools, setInitialTools] = useState<string[] | undefined>(
    undefined,
  );
  const pendingMessageProcessedRef = useRef(false);

  // Handle pending message from NewChatView
  useEffect(() => {
    if (pendingMessageProcessedRef.current) return;
    if (!threadId || isLoadingHistory) return;

    const pendingMessageStr = sessionStorage.getItem(PENDING_MESSAGE_KEY);
    if (pendingMessageStr) {
      try {
        const pendingMessage: PendingMessage = JSON.parse(pendingMessageStr);
        sessionStorage.removeItem(PENDING_MESSAGE_KEY);
        pendingMessageProcessedRef.current = true;

        // Extract tools from the pending message to persist in UI
        if (pendingMessage.options?.tools) {
          setInitialTools(pendingMessage.options.tools);
        }

        // Extract agent/provider/model from the pending message
        if (pendingMessage.options?.agentId) {
          setSelectedAgentId(pendingMessage.options.agentId);
        }
        if (pendingMessage.options?.provider) {
          setProvider(pendingMessage.options.provider);
        }
        if (pendingMessage.options?.model) {
          setModel(pendingMessage.options.model);
        }

        // Send the pending message
        sendMessage(pendingMessage.text, pendingMessage.options);
      } catch (error) {
        console.error("Failed to parse pending message:", error);
        sessionStorage.removeItem(PENDING_MESSAGE_KEY);
      }
    }
  }, [threadId, isLoadingHistory, sendMessage]);

  const handleSendMessage = async (message: string, opts?: MessageOptions) => {
    await sendMessage(message, opts);
  };

  // Fetch agents to resolve thread.agentId to model/provider
  const { data: agents = [] } = useAgents();

  // Restore agent/provider/model from thread details
  const { thread } = chatThreadData;
  const agentRestoredRef = useRef(false);

  useEffect(() => {
    if (thread?.agentId && agents.length > 0 && !agentRestoredRef.current) {
      const agent = agents.find((a) => a.id === thread.agentId);
      if (agent) {
        setSelectedAgentId(agent.id);
        setProvider(agent.provider);
        setModel(agent.modelName);
        // Set initial tools from agent configuration
        setInitialTools(agent.tools || []);
        agentRestoredRef.current = true;
      }
    }
  }, [thread, agents]);

  if (historyError?.message?.includes("Unauthorized")) {
    router.replace("/");
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-muted-foreground">
          Unauthorized access. Redirecting to home...
        </p>
      </div>
    );
  }

  // Show skeleton while loading
  const showLoading = isLoadingHistory;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-4 px-4 py-4">
            {showLoading ? (
              <div className="mx-auto w-full max-w-4xl space-y-6">
                {/* User Message Skeleton */}
                <div className="flex justify-end gap-3">
                  <div className="flex items-end justify-end max-w-[80%] w-full">
                    <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-muted" />
                  </div>
                  <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
                </div>

                {/* AI Message Skeleton */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="max-w-[80%] w-full">
                    <div className="h-24 w-3/4 animate-pulse rounded-2xl bg-muted" />
                  </div>
                </div>

                {/* User Message Skeleton (Short) */}
                <div className="flex justify-end gap-3">
                  <div className="flex items-end justify-end max-w-[80%] w-full">
                    <div className="h-10 w-1/3 animate-pulse rounded-2xl bg-muted" />
                  </div>
                  <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ) : (
              <MessageList
                messages={messages}
                threadId={threadId}
                approveToolExecution={approveToolExecution}
                isLoading={isSending}
              />
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex-shrink-0">
        <div className="w-full p-4 pb-6">
          <div className="mx-auto max-w-3xl">
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isSending || isLoadingHistory}
              provider={provider}
              setProvider={setProvider}
              model={model}
              setModel={setModel}
              selectedAgentId={selectedAgentId}
              setSelectedAgentId={setSelectedAgentId}
              disableAgentSelection={messages.length > 0}
              initialTools={initialTools}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
