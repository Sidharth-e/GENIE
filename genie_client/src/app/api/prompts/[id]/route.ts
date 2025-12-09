import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import Prompt from "@/lib/database/models/Prompt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = (session.user as any).id || session.user.email;
        const { id } = await params;
        const prompt = await Prompt.findOneAndDelete({ _id: id, userId });

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Prompt deleted successfully" });
    } catch (error) {
        console.error("Error deleting prompt:", error);
        return NextResponse.json(
            { error: "Failed to delete prompt" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = (session.user as any).id || session.user.email;
        const { id } = await params;
        const body = await request.json();

        const prompt = await Prompt.findOneAndUpdate(
            { _id: id, userId },
            { $set: body },
            { new: true }
        );

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json(prompt);
    } catch (error) {
        console.error("Error updating prompt:", error);
        return NextResponse.json(
            { error: "Failed to update prompt" },
            { status: 500 }
        );
    }
}
