"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/constants/config";
import { MessageInput } from "./MessageInput";
import { useThreads } from "@/hooks/useThreads";
import { MessageOptions } from "@/types/message";

// Session storage key for pending message
export const PENDING_MESSAGE_KEY = "genie_pending_message";

export interface PendingMessage {
  text: string;
  options?: MessageOptions;
}

export const NewChatView = () => {
  const router = useRouter();
  const { createThread } = useThreads();

  // State for MessageInput
  const [provider, setProvider] = useState<string>(
    config.DEFAULT_MODEL_PROVIDER,
  );
  const [model, setModel] = useState<string>(config.DEFAULT_MODEL_NAME);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    undefined,
  );
  const [isCreating, setIsCreating] = useState(false);
  const isNavigatingRef = useRef(false);

  const handleSendMessage = async (message: string, opts?: MessageOptions) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsCreating(true);

    try {
      // Create the thread first
      const thread = await createThread();

      // Store the pending message in session storage
      const pendingMessage: PendingMessage = {
        text: message,
        options: opts,
      };
      sessionStorage.setItem(
        PENDING_MESSAGE_KEY,
        JSON.stringify(pendingMessage),
      );

      // Navigate to the thread page - it will pick up the pending message
      router.push(`/thread/${thread.id}`);
    } catch (error) {
      console.error("Failed to create thread:", error);
      setIsCreating(false);
      isNavigatingRef.current = false;
    }
  };

  return (
    <div className="flex h-full flex-1 items-center justify-center">
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
          isLoading={isCreating}
          provider={provider}
          setProvider={setProvider}
          model={model}
          setModel={setModel}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
        />
      </div>
    </div>
  );
};
