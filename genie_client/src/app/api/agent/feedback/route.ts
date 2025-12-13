import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import MessageFeedback from "@/lib/database/models/MessageFeedback";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Get all feedback for a thread
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const threadId = req.nextUrl.searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400 },
      );
    }

    const feedbacks = await MessageFeedback.find({ threadId, userId });

    // Return as a map of messageId -> feedback type
    const feedbackMap: Record<string, "like" | "dislike"> = {};
    for (const fb of feedbacks) {
      feedbackMap[fb.messageId] = fb.feedback;
    }

    return NextResponse.json(feedbackMap, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch feedback";
    console.error("GET feedback error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create or update feedback
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const body = await req.json();
    const { messageId, threadId, feedback } = body;

    if (!messageId || !threadId || !feedback) {
      return NextResponse.json(
        { error: "messageId, threadId, and feedback are required" },
        { status: 400 },
      );
    }

    if (!["like", "dislike"].includes(feedback)) {
      return NextResponse.json(
        { error: "feedback must be 'like' or 'dislike'" },
        { status: 400 },
      );
    }

    // Upsert: update if exists, create if not
    const result = await MessageFeedback.findOneAndUpdate(
      { messageId, userId },
      { messageId, threadId, userId, feedback },
      { upsert: true, new: true },
    );

    return NextResponse.json(
      {
        id: result._id.toString(),
        messageId: result.messageId,
        threadId: result.threadId,
        feedback: result.feedback,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to save feedback";
    console.error("POST feedback error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete feedback
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 },
      );
    }

    await MessageFeedback.findOneAndDelete({ messageId, userId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to delete feedback";
    console.error("DELETE feedback error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
