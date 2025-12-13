import type {
  MessageResponse,
  ToolApprovalCallbacks,
  ContentItem,
} from "@/types/message";
import { Bot } from "lucide-react";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import {
  getMessageContent,
  hasToolCalls,
  getToolCalls,
} from "@/services/messageUtils";
import { ToolCallDisplay } from "./ToolCallDisplay";
import { useUISettings } from "@/contexts/UISettingsContext";
import MDEditor from "@uiw/react-md-editor";
import { ChartRenderer, parseChartData, type ChartData } from "./ChartRenderer";

interface AIMessageProps {
  message: MessageResponse;
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

export const AIMessage = ({
  message,
  approvalCallbacks,
  showApprovalButtons = false,
  toolMessages,
}: AIMessageProps) => {
  const messageContent = getMessageContent(message);
  const hasTools = hasToolCalls(message);
  const toolCalls = getToolCalls(message);
  const { hideToolMessages } = useUISettings();

  // Extract charts from tool messages to render inline
  const charts = extractChartsFromToolMessages(toolMessages);
  const hasCharts = charts.length > 0;

  // If tool messages are hidden and there's no text content, don't render anything
  const shouldShowTools = hasTools && !hideToolMessages;
  const hasVisibleContent = messageContent || shouldShowTools || hasCharts;

  if (!hasVisibleContent) {
    return null;
  }

  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
        <Bot className="text-primary h-5 w-5" />
      </div>
      <div className="max-w-[80%] space-y-3">
        {(messageContent || hasCharts) && (
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
