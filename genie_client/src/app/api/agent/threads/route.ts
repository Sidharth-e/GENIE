import { NextRequest, NextResponse } from "next/server";
import type { Thread } from "@/types/message";
import connectDB from "@/lib/database/connect";
import ThreadModel from "@/lib/database/models/Thread";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;
  const dbThreads = await ThreadModel.find({ userId }).sort({ updatedAt: -1 }).limit(50);

  const threads: Thread[] = dbThreads.map((t: any) => ({
    id: t.id,
    title: t.title,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
  return NextResponse.json(threads, { status: 200 });
}

export async function POST() {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;

  const created = await ThreadModel.create({
    title: "New thread",
    userId: userId as string,
    userName: session.user.name || "Unknown",
    userEmail: session.user.email || "Unknown",
  });

  const thread: Thread = {
    id: created._id.toString(),
    title: created.title,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
  return NextResponse.json(thread, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;

    const body = await req.json();
    const { id, title } = body || {};
    if (!id || typeof title !== "string") {
      return NextResponse.json({ error: "id and title required" }, { status: 400 });
    }

    const updated = await ThreadModel.findOneAndUpdate(
      { _id: id, userId },
      { title },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Thread not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: updated._id.toString(),
        title: updated.title,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Update failed";
    console.error("PATCH thread error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;

    const body = await req.json();
    const { id } = body || {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Thread id required" }, { status: 400 });
    }

    // Delete the thread from Mongoose
    const deleted = await ThreadModel.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return NextResponse.json({ error: "Thread not found or unauthorized" }, { status: 404 });
    }

    // Note: LangGraph checkpoint data will become orphaned but won't affect functionality
    // The checkpointer will simply not find any thread metadata for this thread_id
    // Future versions could implement direct checkpoint deletion via SQL if needed

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Delete failed";
    console.error("DELETE thread error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
