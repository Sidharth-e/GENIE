import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import Agent from "@/lib/database/models/Agent";

// Helper to handle dynamic route params in Next.js 15+
// See: https://nextjs.org/docs/messages/sync-dynamic-apis
type Props = {
    params: Promise<{ id: string }>;
};

export async function GET(
    request: NextRequest,
    { params }: Props
) {
    await connectDB();
    try {
        const { id } = await params;
        const agent = await Agent.findById(id);
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }
        return NextResponse.json(agent);
    } catch (error) {
        console.error("Error fetching agent:", error);
        return NextResponse.json(
            { error: "Failed to fetch agent" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: Props
) {
    await connectDB();
    try {
        const { id } = await params;
        const body = await request.json();
        const agent = await Agent.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }
        return NextResponse.json(agent);
    } catch (error) {
        console.error("Error updating agent:", error);
        return NextResponse.json(
            { error: "Failed to update agent" },
            { status: 400 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: Props
) {
    await connectDB();
    try {
        const { id } = await params;
        const agent = await Agent.findByIdAndDelete(id);
        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Agent deleted successfully" });
    } catch (error) {
        console.error("Error deleting agent:", error);
        return NextResponse.json(
            { error: "Failed to delete agent" },
            { status: 500 }
        );
    }
}
