import { createChatModel} from "@/lib/agent/util";
import ThreadModel from "@/lib/database/models/Thread";
import connectDB from "@/lib/database/connect";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "@/constants/config";

export async function generateAndSaveTitle(threadId: string, userMessage: string, aiMessage: string) {
    try {
        if (!userMessage || !aiMessage) return;

        await connectDB();
        const thread = await ThreadModel.findById(threadId);

        // Only update if the title is still the default
        if (!thread || (thread.title !== "New thread" && thread.title !== "Untitled thread")) {
            return;
        }

        const llm = createChatModel({
            provider: config.DEFAULT_MODEL_PROVIDER,
            model: config.DEFAULT_MODEL_NAME,
            temperature: 0.5
        });

        const messages = [
            new SystemMessage("You are a helpful assistant that generates short, concise titles for conversations based on the first interaction. The title should be 3-6 words long. Capture the main topic. Do not use quotes."),
            new HumanMessage(`User: ${userMessage}\nAssistant: ${aiMessage.substring(0, 1000)}\n\nGenerate a title for this conversation.`)
        ];

        const response = await llm.invoke(messages);
        const content = response.content;
        let title = "";

        if (typeof content === "string") {
            title = content;
        } else if (Array.isArray(content)) {
            // Handle complex content blocks
            title = content
                .map(c => typeof c === "string" ? c : ("text" in c ? c.text : ""))
                .join("");
        }

        title = title.trim().replace(/^["']|["']$/g, '');

        if (title) {
            await ThreadModel.findByIdAndUpdate(threadId, { title });
            return title;
        }
        return null;
    } catch (error) {
        console.warn("Failed to generate thread title:", error);
        return null;
    }
}
