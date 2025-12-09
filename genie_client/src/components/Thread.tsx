"use client";
import { config } from "@/constants/config";
import { MessageInput } from "./MessageInput";
import MessageList from "./MessageList";
import { useChatThread } from "@/hooks/useChatThread";
import { useAgents } from "@/hooks/useAgents";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageOptions } from "@/types/message";

interface ThreadProps {
  threadId: string;
  onFirstMessageSent?: (threadId: string) => void;
}

export const Thread = ({ threadId, onFirstMessageSent }: ThreadProps) => {
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
  const firstMessageInitiatedRef = useRef(false);
  const [awaitingFirstResponse, setAwaitingFirstResponse] = useState(false);

  const handleSendMessage = async (message: string, opts?: MessageOptions) => {
    const wasEmpty = messages.length === 0;
    await sendMessage(message, opts);
    if (wasEmpty) {
      firstMessageInitiatedRef.current = true;
      setAwaitingFirstResponse(true);
    }
  };

  // Detect first AI/tool/error message arrival after initial user message to trigger redirect
  useEffect(() => {
    if (awaitingFirstResponse && !isSending) {
      const hasNonHuman = messages.some((m) => m.type !== "human");
      if (hasNonHuman) {
        setAwaitingFirstResponse(false);
        if (onFirstMessageSent) onFirstMessageSent(threadId);
      }
    }
  }, [
    awaitingFirstResponse,
    isSending,
    messages,
    onFirstMessageSent,
    threadId,
  ]);

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

  // Show skeleton or empty state
  const showLoading = isLoadingHistory;
  const showEmpty = !isLoadingHistory && messages.length === 0;

  return (
    <div className="absolute inset-0 flex flex-col">
      {!showEmpty ? (
        <>
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
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-3xl px-4">
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Chat with your Agent
              </h1>
              <p className="text-muted-foreground mt-2">
                Start a new conversation by sending a message
              </p>
            </div>
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isSending}
              provider={provider}
              setProvider={setProvider}
              model={model}
              setModel={setModel}
              selectedAgentId={selectedAgentId}
              setSelectedAgentId={setSelectedAgentId}
            />
          </div>
        </div>
      )}
    </div>
  );
};
