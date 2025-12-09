import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import Agent from "@/lib/database/models/Agent";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = (session.user as any).id || session.user.email;
        const agents = await Agent.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(agents);
    } catch (error) {
        console.error("Error fetching agents:", error);
        return NextResponse.json(
            { error: "Failed to fetch agents" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const userId = (session.user as any).id || session.user.email;

        console.log("Creating agent with body:", JSON.stringify(body, null, 2));
        const agent = await Agent.create({
            ...body,
            userId: userId as string,
            userName: session.user.name || "Unknown",
            userEmail: session.user.email || "Unknown",
        });
        return NextResponse.json(agent, { status: 201 });
    } catch (error) {
        console.error("Error creating agent:", error);
        return NextResponse.json(
            { error: "Failed to create agent", details: (error as Error).message },
            { status: 400 }
        );
    }
}
