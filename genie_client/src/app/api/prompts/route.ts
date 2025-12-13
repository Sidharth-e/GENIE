import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import Prompt from "@/lib/database/models/Prompt";
import { getRequiredSession } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const { session, response } = await getRequiredSession();
  if (response) return response;

  try {
    const userId = session.user.id || session.user.email;
    const prompts = await Prompt.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await connectDB();
  const { session, response } = await getRequiredSession();
  if (response) return response;

  try {
    const body = await request.json();
    const userId = session.user.id || session.user.email;

    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 },
      );
    }

    const prompt = await Prompt.create({
      ...body,
      userId: userId as string,
    });
    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt", details: (error as Error).message },
      { status: 400 },
    );
  }
}
