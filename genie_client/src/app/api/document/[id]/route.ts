import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import DocumentModel from "@/lib/database/models/Document";
import { getOptionalSession, getUserId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();
    const doc = await DocumentModel.findById(id);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      status: doc.status,
      full_text_content: doc.full_text_content,
      createdAt: doc.createdAt,
    });
  } catch (error) {
    console.error("Get document error", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getOptionalSession();
  const userId = getUserId(session);

  try {
    await connectDB();
    const doc = await DocumentModel.findById(id);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // TODO: Enforce ownership check when auth is required
    // if (doc.user_id !== userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    // Delete from DB
    await DocumentModel.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
