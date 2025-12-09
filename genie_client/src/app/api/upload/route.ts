import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import connectDB from "@/lib/database/connect";
import DocumentModel from "@/lib/database/models/Document";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { extractTextFromFile } from "@/lib/file-processing";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // TODO: Require authentication in production
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // Mock user ID for now if no session
    const userId = (session?.user as any)?.id || "anonymous_user";

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Extract Text Content
    let fullTextContent = "";
    if (file.type.startsWith("image/")) {
      const base64String = buffer.toString("base64");
      fullTextContent = `data:${file.type};base64,${base64String}`;
    } else {
      // Use our new extraction utility
      fullTextContent = await extractTextFromFile(
        buffer,
        file.type,
        fileExtension,
      );
    }

    console.log("Full Text Content:", fullTextContent);

    // Save to Database
    await connectDB();
    const newDoc = await DocumentModel.create({
      name: file.name,
      type: file.type,
      size: file.size,
      user_id: userId,
      status: "ready", // Mark ready immediately for text/mock
      full_text_content: fullTextContent,
    });

    return NextResponse.json({
      documentId: newDoc._id,
      name: newDoc.name,
      size: newDoc.size,
      type: newDoc.type,
      // url: `/uploads/${fileName}` // If we serve statically
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
