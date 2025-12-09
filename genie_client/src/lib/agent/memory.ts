import { BaseMessage } from "@langchain/core/messages";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

/**
 * Creates a MongoDBSaver instance using environment variables
 * @returns MongoDBSaver instance
 */
export function createMongoMemory(): MongoDBSaver {
  const client = new MongoClient(process.env.DATABASE_URL || "");
  return new MongoDBSaver({ client });
}

export const checkpointer = createMongoMemory();

/**
 * Retrieves the message history for a specific thread.
 * @param threadId - The ID of the thread to retrieve history for.
 * @returns An array of messages associated with the thread.
 */
export const getHistory = async (threadId: string): Promise<BaseMessage[]> => {
  const history = await checkpointer.get({
    configurable: { thread_id: threadId },
  });
  return Array.isArray(history?.channel_values?.messages) ? history.channel_values.messages : [];
};
