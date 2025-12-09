import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import DocumentModel from "@/lib/database/models/Document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
  const session = await getServerSession(authOptions);

  // TODO: Auth check (ensure user owns the document)
  const userId = (session?.user as any)?.id || "anonymous_user";

  try {
    await connectDB();
    const doc = await DocumentModel.findById(id);

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (doc.user_id !== userId) {
      // return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      // Allow for now since anonymous
    }

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
