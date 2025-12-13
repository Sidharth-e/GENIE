import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import Agent from "@/lib/database/models/Agent";
import { getRequiredSession, getUserMetadata } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const { session, response } = await getRequiredSession();
  if (response) return response;

  try {
    const userId = session.user.id || session.user.email;
    const agents = await Agent.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
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
    const { userId, userName, userEmail } = getUserMetadata(session);

    console.log("Creating agent with body:", JSON.stringify(body, null, 2));
    const agent = await Agent.create({
      ...body,
      userId,
      userName,
      userEmail,
    });
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent", details: (error as Error).message },
      { status: 400 },
    );
  }
}
