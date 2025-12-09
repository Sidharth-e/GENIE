import { NextRequest } from "next/server";
import { streamResponse } from "@/services/agentService";
import type { MessageResponse } from "@/types/message";
import { generateAndSaveTitle } from "@/services/titleService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE endpoint that streams incremental AI response chunks produced by the LangGraph React agent.
 * Query params:
 *  - content: user message text
 *  - threadId: (currently unused for history; placeholder for future multi-turn support)
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { searchParams } = new URL(req.url);
  const userContent = searchParams.get("content") || "";
  const threadId = searchParams.get("threadId") || "unknown";
  const model = searchParams.get("model") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const allowTool = searchParams.get("allowTool") as "allow" | "deny" | null;
  const toolsParam = searchParams.get("tools") || "";
  const approveAllTools = searchParams.get("approveAllTools") === "true";
  const agentId = searchParams.get("agentId") || undefined;
  const tools = toolsParam
    ? toolsParam
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    : undefined;

  const documentIdsParam = searchParams.get("documentIds") || "";
  const documentIds = documentIdsParam
    ? documentIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
    : undefined;

  const userInfo = {
    userId: (session.user as any).id || session.user.email,
    userName: session.user.name || "Unknown",
    userEmail: session.user.email || "Unknown",
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: MessageResponse) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial comment to establish stream
      controller.enqueue(encoder.encode(": connected\n\n"));

      (async () => {
        let fullAiResponse = "";
        try {
          const iterable = await streamResponse({
            threadId,
            userText: userContent,
            opts: { model, provider, tools, allowTool: allowTool || undefined, approveAllTools, agentId, documentIds },
            userInfo,
          });
          for await (const chunk of iterable) {
            // Only forward AI/tool chunks; ignore human/system
            if (chunk.type === "ai" || chunk.type === "tool") {
              send(chunk);
              if (chunk.type === "ai" && chunk.data?.content) {
                fullAiResponse += chunk.data.content;
              }
            }
          }

          if (fullAiResponse && threadId && threadId !== "unknown") {
            try {
              console.log("Attempting to generate title for thread:", threadId);
              const newTitle = await generateAndSaveTitle(threadId, userContent, fullAiResponse);
              if (newTitle) {
                console.log("Title generated:", newTitle);
                controller.enqueue(encoder.encode(`event: title_generated\ndata: ${JSON.stringify({ title: newTitle })}\n\n`));
              } else {
                console.log("No title generated (returned null/empty)");
              }
            } catch (e) {
              console.error("Title generation failed:", e);
            }
          } else {
             console.log("Skipping title generation:", { hasResponse: !!fullAiResponse, threadId });
          }

          // Signal completion
          controller.enqueue(encoder.encode("event: done\n"));
          controller.enqueue(encoder.encode("data: {}\n\n"));
        } catch (err: unknown) {
          console.error("Stream error:", err);
          // Emit an error event (client onerror will capture general network; providing data for diagnostics)
          try {
            controller.enqueue(encoder.encode("event: error\n"));
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ message: (err as Error)?.message || "Stream error", threadId })}\n\n`,
              ),
            );
          } catch (e) {
            // Ignore enqueue errors if stream is closed
          }
        } finally {
          try {
            controller.close();
          } catch (e) {
            // Ignore if already closed
          }
        }
      })();
    },
    cancel() {
      // If client disconnects, nothing special yet (LangGraph stream will stop as iteration halts)
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
