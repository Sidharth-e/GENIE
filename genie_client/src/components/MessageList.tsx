import type { MessageResponse, ToolApprovalCallbacks } from "@/types/message";
import { HumanMessage } from "./HumanMessage";
import { AIMessage } from "./AIMessage";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingMessage } from "./LoadingMessage";
import { useEffect, useRef, useMemo, useState } from "react";
import { getMessageId } from "@/services/messageUtils";
import { fetchFeedback } from "@/services/chatService";
import dynamic from "next/dynamic";
import { useUISettings } from "@/contexts/UISettingsContext";
import { parseChartData } from "./ChartRenderer";

const ToolMessage = dynamic(
  () => import("./ToolMessage").then((m) => m.ToolMessage),
  {
    ssr: false,
    loading: () => (
      <div className="rounded bg-gray-50 p-4 text-sm text-gray-500">
        Loading tool output…
      </div>
    ),
  },
);

interface MessageListProps {
  messages: MessageResponse[];
  threadId: string;
  approveToolExecution?: (
    toolCallId: string,
    action: "allow" | "deny",
  ) => Promise<void>;
  isLoading?: boolean;
}

// Helper function to check if tool message contains chart data
const isChartToolMessage = (message: MessageResponse): boolean => {
  if (message.type !== "tool") return false;
  const content = message.data?.content;
  if (!content) return false;
  const contentStr =
    typeof content === "string" ? content : JSON.stringify(content);
  const chartData = parseChartData(contentStr);
  return chartData !== null;
};

// Group tool messages with the NEXT AI message that follows them
// This way the chart appears in the summary message, not the tool-calling message
const groupToolMessagesWithNextAI = (messages: MessageResponse[]) => {
  const groups: Map<string, MessageResponse[]> = new Map();

  // Collect all chart tool messages
  const chartToolMessages: MessageResponse[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.type === "tool" && isChartToolMessage(msg)) {
      chartToolMessages.push(msg);
    }

    // When we find an AI message, assign any pending chart tool messages to it
    if (msg.type === "ai" && chartToolMessages.length > 0) {
      const aiMessageId = getMessageId(msg);
      groups.set(aiMessageId, [...chartToolMessages]);
      chartToolMessages.length = 0; // Clear the array
    }
  }

  return groups;
};

const MessageList = ({
  messages,
  threadId,
  approveToolExecution,
  isLoading,
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const { hideToolMessages } = useUISettings();
  const [feedbackMap, setFeedbackMap] = useState<
    Record<string, "like" | "dislike">
  >({});

  // Fetch existing feedback when thread loads
  useEffect(() => {
    if (threadId) {
      fetchFeedback(threadId)
        .then(setFeedbackMap)
        .catch((err) => console.error("Failed to load feedback:", err));
    }
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Create approval callbacks for tool execution
  const approvalCallbacks: ToolApprovalCallbacks | undefined =
    approveToolExecution
      ? {
          onApprove: (toolCallId: string) =>
            approveToolExecution(toolCallId, "allow"),
          onDeny: (toolCallId: string) =>
            approveToolExecution(toolCallId, "deny"),
        }
      : undefined;

  // Deduplicate messages by ID
  const uniqueMessages = messages.reduce((acc: MessageResponse[], message) => {
    const isDuplicate = acc.some((m) => m.data?.id === message.data?.id);
    if (!isDuplicate) {
      acc.push(message);
    }
    return acc;
  }, []);

  // Group chart tool messages with the NEXT AI message that follows them
  const toolMessageGroups = useMemo(
    () => groupToolMessagesWithNextAI(uniqueMessages),
    [uniqueMessages],
  );

  const shouldShowLoading =
    isLoading &&
    (uniqueMessages.length === 0 ||
      uniqueMessages[uniqueMessages.length - 1].type !== "ai");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {uniqueMessages.map((message) => {
        if (message.type === "human") {
          return <HumanMessage key={getMessageId(message)} message={message} />;
        } else if (message.type === "ai") {
          // Get tool messages for this AI message
          const aiMessageId = getMessageId(message);
          const toolMessages = toolMessageGroups.get(aiMessageId) || [];
          return (
            <AIMessage
              key={aiMessageId}
              message={message}
              threadId={threadId}
              initialFeedback={feedbackMap[aiMessageId] || null}
              showApprovalButtons={
                message === uniqueMessages[uniqueMessages.length - 1]
              }
              approvalCallbacks={approvalCallbacks}
              toolMessages={toolMessages}
            />
          );
        } else if (message.type === "tool" && !hideToolMessages) {
          // Skip rendering chart tool messages separately (they're rendered inline with AI)
          if (isChartToolMessage(message)) {
            return null;
          }
          return <ToolMessage key={getMessageId(message)} message={message} />;
        } else if (message.type === "error") {
          return <ErrorMessage key={getMessageId(message)} message={message} />;
        }
        return null;
      })}
      {shouldShowLoading && <LoadingMessage />}
      <div ref={bottomRef} className="h-px" />
    </div>
  );
};

export default MessageList;
