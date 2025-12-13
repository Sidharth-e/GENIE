import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import connectDB from "@/lib/database/connect";
import DocumentModel from "@/lib/database/models/Document";
import { getOptionalSession, getUserId } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/file-processing";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession();
    const userId = getUserId(session);

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
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
