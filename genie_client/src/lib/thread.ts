import connectDB from "@/lib/database/connect";
import Thread from "@/lib/database/models/Thread";

/**
 * Ensure a thread exists; create if missing. Title derived from seed (first 100 chars) or fallback.
 * Returns the Mongoose thread document.
 */
export async function ensureThread(
  threadId: string,
  titleSeed?: string,
  userInfo?: { userId: string; userName: string; userEmail: string },
  agentId?: string
) {
  if (!threadId) throw new Error("threadId is required");

  await connectDB();

  const existing = await Thread.findById(threadId);
  if (existing) {
    if (userInfo && existing.userId && existing.userId !== userInfo.userId) {
      throw new Error("Unauthorized: Thread belongs to another user");
    }
    // Update agentId if provided and not set? Or always update?
    // Let's update if provided.
    if (agentId && existing.agentId !== agentId) {
      existing.agentId = agentId as any; // Cast to any to avoid ObjectId type issues if using string
      await existing.save();
    }
    return existing;
  }

  const title = (titleSeed?.trim() || "New thread").substring(0, 100);

  return Thread.create({
    _id: threadId,
    title,
    userId: userInfo?.userId,
    userName: userInfo?.userName,
    userEmail: userInfo?.userEmail,
    agentId,
  });
}
