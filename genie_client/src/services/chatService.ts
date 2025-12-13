import type { MessageOptions, MessageResponse, Thread } from "@/types/message";

export interface ChatServiceConfig {
  baseUrl?: string;
  endpoints?: {
    history?: string;
    chat?: string;
    stream?: string;
    threads?: string;
    feedback?: string;
  };
  headers?: Record<string, string>;
}

const config: ChatServiceConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  endpoints: {
    history: "/agent/history",
    chat: "/agent/chat",
    stream: "/agent/stream",
    threads: "/agent/threads",
    feedback: "/agent/feedback",
  },
};

function getUrl(
  endpoint: keyof Required<ChatServiceConfig>["endpoints"],
): string {
  return `${config.baseUrl}${config.endpoints?.[endpoint] || ""}`;
}

export async function fetchMessageHistory(
  threadId: string,
): Promise<MessageResponse[]> {
  const response = await fetch(`${getUrl("history")}/${threadId}`, {
    headers: config.headers,
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to load history");
  }
  const data = await response.json();
  return data as MessageResponse[];
}

export function createMessageStream(
  threadId: string,
  message: string,
  opts?: MessageOptions,
): EventSource {
  const params = new URLSearchParams({ content: message, threadId });
  if (opts?.model) params.set("model", opts.model);
  if (opts?.provider) params.set("provider", opts.provider);
  if (opts?.tools?.length) params.set("tools", opts.tools.join(","));
  if (opts?.allowTool) params.set("allowTool", opts.allowTool);
  if (opts?.approveAllTools !== undefined)
    params.set("approveAllTools", opts.approveAllTools ? "true" : "false");
  if (opts?.agentId) params.set("agentId", opts.agentId);
  if (opts?.documentIds?.length)
    params.set("documentIds", opts.documentIds.join(","));
  return new EventSource(`${getUrl("stream")}?${params}`);
}

export async function fetchThreads(): Promise<Thread[]> {
  const response = await fetch(getUrl("threads"), {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Failed to load threads");
  }
  return await response.json();
}

export async function fetchThread(threadId: string): Promise<Thread> {
  const response = await fetch(`${getUrl("threads")}/${threadId}`, {
    headers: config.headers,
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("Thread not found");
    throw new Error("Failed to load thread details");
  }
  return await response.json();
}

export async function createNewThread(): Promise<Thread> {
  const response = await fetch(getUrl("threads"), {
    method: "POST",
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Failed to create thread");
  }
  return await response.json();
}

export async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(getUrl("threads"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify({ id: threadId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete thread");
  }
}

// Message feedback functions
export async function submitFeedback(
  messageId: string,
  threadId: string,
  feedback: "like" | "dislike",
): Promise<void> {
  const response = await fetch(getUrl("feedback"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify({ messageId, threadId, feedback }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to submit feedback");
  }
}

export async function deleteFeedback(messageId: string): Promise<void> {
  const response = await fetch(getUrl("feedback"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
    },
    body: JSON.stringify({ messageId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete feedback");
  }
}

export async function fetchFeedback(
  threadId: string,
): Promise<Record<string, "like" | "dislike">> {
  const response = await fetch(`${getUrl("feedback")}?threadId=${threadId}`, {
    headers: config.headers,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch feedback");
  }
  return await response.json();
}
