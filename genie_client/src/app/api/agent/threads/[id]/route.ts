import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/database/connect";
import ThreadModel from "@/lib/database/models/Thread";
import { Thread } from "@/types/message";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Thread ID required" }, { status: 400 });
    }

    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const thread = await ThreadModel.findOne({ _id: id, userId });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const responseThread: Thread = {
      id: thread._id.toString(),
      title: thread.title,
      agentId: thread.agentId ? thread.agentId.toString() : undefined,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };

    return NextResponse.json(responseThread, { status: 200 });
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
