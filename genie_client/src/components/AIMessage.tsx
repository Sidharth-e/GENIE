import type {
  MessageResponse,
  ToolApprovalCallbacks,
  ContentItem,
} from "@/types/message";
import { Bot, Copy, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import {
  getMessageContent,
  hasToolCalls,
  getToolCalls,
} from "@/services/messageUtils";
import { submitFeedback, deleteFeedback } from "@/services/chatService";
import { ToolCallDisplay } from "./ToolCallDisplay";
import MDEditor from "@uiw/react-md-editor";
import { ChartRenderer, parseChartData, type ChartData } from "./ChartRenderer";
import {
  QRCodeRenderer,
  parseQRCodeData,
  type QRCodeData,
} from "./QRCodeRenderer";
import {
  MermaidRenderer,
  parseMermaidData,
  type MermaidData,
} from "./MermaidRenderer";
import { StatsRenderer, parseStatsData, type StatsData } from "./StatsRenderer";
import { CodeBlock } from "./markdown/CodeBlock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./markdown/Table";

interface AIMessageProps {
  message: MessageResponse;
  threadId: string;
  initialFeedback?: "like" | "dislike" | null;
  approvalCallbacks?: ToolApprovalCallbacks;
  showApprovalButtons?: boolean;
  toolMessages?: MessageResponse[]; // Tool responses for this AI message
}

// Helper function to convert content to string (same as in ToolMessage)
const getContentAsString = (
  content: string | ContentItem[] | undefined,
): string => {
  if (!content) return "";
  if (typeof content === "string") return content;
  // For ContentItem arrays, extract text content or stringify
  return JSON.stringify(content, null, 2);
};

// Extract charts from tool messages
const extractChartsFromToolMessages = (
  toolMessages?: MessageResponse[],
): ChartData[] => {
  if (!toolMessages) return [];

  const charts: ChartData[] = [];
  for (const msg of toolMessages) {
    const content = getContentAsString(msg.data?.content);
    const chartData = parseChartData(content);
    if (chartData) {
      charts.push(chartData);
    }
  }
  return charts;
};

// Extract QR codes from tool messages
const extractQRCodesFromToolMessages = (
  toolMessages?: MessageResponse[],
): QRCodeData[] => {
  if (!toolMessages) return [];

  const qrCodes: QRCodeData[] = [];
  for (const msg of toolMessages) {
    const content = getContentAsString(msg.data?.content);
    const qrData = parseQRCodeData(content);
    if (qrData) {
      qrCodes.push(qrData);
    }
  }
  return qrCodes;
};

// Extract Mermaid diagrams from tool messages
const extractMermaidDataFromToolMessages = (
  toolMessages?: MessageResponse[],
): MermaidData[] => {
  if (!toolMessages) return [];

  const diagrams: MermaidData[] = [];
  for (const msg of toolMessages) {
    const content = getContentAsString(msg.data?.content);
    const mermaidData = parseMermaidData(content);
    if (mermaidData) {
      diagrams.push(mermaidData);
    }
  }
  return diagrams;
};

// Extract Stats data from tool messages
const extractStatsDataFromToolMessages = (
  toolMessages?: MessageResponse[],
): StatsData[] => {
  if (!toolMessages) return [];

  const stats: StatsData[] = [];
  for (const msg of toolMessages) {
    const content = getContentAsString(msg.data?.content);
    const statsData = parseStatsData(content);
    if (statsData) {
      stats.push(statsData);
    }
  }
  return stats;
};

export const AIMessage = ({
  message,
  threadId,
  initialFeedback,
  approvalCallbacks,
  showApprovalButtons = false,
  toolMessages,
}: AIMessageProps) => {
  const messageContent = getMessageContent(message);
  const hasTools = hasToolCalls(message);
  const toolCalls = getToolCalls(message);
  // State for action buttons
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(
    initialFeedback ?? null,
  );

  // Sync feedback state when initialFeedback prop changes (e.g., when loaded from DB)
  useEffect(() => {
    setFeedback(initialFeedback ?? null);
  }, [initialFeedback]);

  // Extract charts from tool messages to render inline
  const charts = extractChartsFromToolMessages(toolMessages);

  const hasCharts = charts.length > 0;
  const qrCodes = extractQRCodesFromToolMessages(toolMessages);
  const hasQRCodes = qrCodes.length > 0;
  const mermaidDiagrams = extractMermaidDataFromToolMessages(toolMessages);
  const hasMermaid = mermaidDiagrams.length > 0;
  const statsData = extractStatsDataFromToolMessages(toolMessages);
  const hasStats = statsData.length > 0;

  // If tool messages are hidden and there's no text content, don't render anything
  const shouldShowTools = hasTools;
  const hasVisibleContent =
    messageContent ||
    shouldShowTools ||
    hasCharts ||
    hasQRCodes ||
    hasMermaid ||
    hasStats;

  // Copy message content to clipboard
  const handleCopy = async () => {
    if (messageContent) {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle like/dislike feedback
  const handleFeedback = async (type: "like" | "dislike") => {
    const messageId = message.data?.id;
    if (!messageId || !threadId) return;

    try {
      if (feedback === type) {
        // Toggle off - delete feedback
        await deleteFeedback(messageId);
        setFeedback(null);
      } else {
        // Set new feedback
        await submitFeedback(messageId, threadId, type);
        setFeedback(type);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  if (!hasVisibleContent) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
        <Bot className="text-primary h-5 w-5" />
      </div>
      <div className="max-w-[80%] space-y-3">
        {(messageContent ||
          hasCharts ||
          hasQRCodes ||
          hasMermaid ||
          hasStats) && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2",
              "bg-gray-200/30 text-gray-800",
              "backdrop-blur-sm supports-[backdrop-filter]:bg-gray-200/30",
            )}
          >
            {/* Render text content */}
            {messageContent && (
              <div
                data-color-mode="light"
                className="[&_hr]:!my-1 [&_hr]:h-px [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-300 [&_li]:my-1 [&_ol]:ml-6 [&_ol]:list-decimal [&_ul]:ml-6 [&_ul]:list-disc"
              >
                <MDEditor.Markdown
                  source={messageContent}
                  style={{
                    backgroundColor: "transparent",
                    color: "inherit",
                    padding: 0,
                    fontSize: "1rem",
                  }}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    pre: ({ node, ...props }) => <>{props.children}</>,
                    code: ({ node, ...props }) => <CodeBlock {...props} />,
                    table: ({ node, ...props }) => <Table {...props} />,
                    thead: ({ node, ...props }) => <TableHeader {...props} />,
                    tbody: ({ node, ...props }) => <TableBody {...props} />,
                    tr: ({ node, ...props }) => <TableRow {...props} />,
                    th: ({ node, ...props }) => <TableHead {...props} />,
                    td: ({ node, ...props }) => <TableCell {...props} />,
                  }}
                />
              </div>
            )}

            {/* Render charts INSIDE the message bubble */}
            {hasCharts && (
              <div className={cn("space-y-3", messageContent && "mt-4")}>
                {charts.map((chart, index) => (
                  <ChartRenderer key={index} data={chart} />
                ))}
              </div>
            )}

            {/* Render QR codes INSIDE the message bubble */}
            {hasQRCodes && (
              <div
                className={cn(
                  "space-y-3",
                  (messageContent || hasCharts) && "mt-4",
                )}
              >
                {qrCodes.map((qr, index) => (
                  <QRCodeRenderer key={index} data={qr} />
                ))}
              </div>
            )}

            {/* Render Mermaid diagrams INSIDE the message bubble */}
            {hasMermaid && (
              <div
                className={cn(
                  "space-y-3",
                  (messageContent || hasCharts || hasQRCodes) && "mt-4",
                )}
              >
                {mermaidDiagrams.map((diagram, index) => (
                  <MermaidRenderer key={index} data={diagram} />
                ))}
              </div>
            )}

            {/* Render Stats dashboards INSIDE the message bubble */}
            {hasStats && (
              <div
                className={cn(
                  "space-y-3",
                  (messageContent || hasCharts || hasQRCodes || hasMermaid) &&
                    "mt-4",
                )}
              >
                {statsData.map((stats, index) => (
                  <StatsRenderer key={index} data={stats} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons: Copy, Like, Dislike */}
        {messageContent && (
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={handleCopy}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200",
                "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                copied && "text-green-500 hover:text-green-500",
              )}
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => handleFeedback("like")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200",
                "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                feedback === "like" &&
                  "bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-500",
              )}
              title="Like this response"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleFeedback("dislike")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200",
                "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                feedback === "dislike" &&
                  "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-500",
              )}
              title="Dislike this response"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        )}

        {shouldShowTools && (
          <div className="space-y-2">
            <ToolCallDisplay
              toolCalls={toolCalls}
              approvalCallbacks={approvalCallbacks}
              showApprovalButtons={showApprovalButtons}
            />
          </div>
        )}
      </div>
    </div>
  );
};
