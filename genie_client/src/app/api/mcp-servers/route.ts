import { NextResponse } from "next/server";
import connectDB from "@/lib/database/connect";
import MCPServer, { MCPServerType } from "@/lib/database/models/MCPServer";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const servers = await MCPServer.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(servers);
  } catch (error) {
    console.error("Error fetching MCP servers:", error);
    return NextResponse.json({ error: "Failed to fetch MCP servers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const body = await request.json();
    const { name, type, command, args, env, url, headers } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    if (type === "stdio" && !command) {
      return NextResponse.json({ error: "Command is required for stdio servers" }, { status: 400 });
    }

    if (type === "http" && !url) {
      return NextResponse.json({ error: "URL is required for http servers" }, { status: 400 });
    }

    const server = await MCPServer.create({
      name,
      type: type as MCPServerType,
      command: type === "stdio" ? command : undefined,
      args: type === "stdio" ? args : undefined,
      env: type === "stdio" ? env : undefined,
      url: type === "http" ? url : undefined,
      headers: type === "http" ? headers : undefined,
      userId: userId as string,
      userName: session.user.name || "Unknown",
      userEmail: session.user.email || "Unknown",
    });

    return NextResponse.json(server, { status: 201 });
  } catch (error: any) {
    console.error("Error creating MCP server:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Server name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create MCP server" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const body = await request.json();
    const { id, name, type, command, args, env, url, headers, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (enabled !== undefined) updateData.enabled = enabled;

    if (type === "stdio") {
      if (command !== undefined) updateData.command = command;
      if (args !== undefined) updateData.args = args;
      if (env !== undefined) updateData.env = env;
      updateData.url = null;
      updateData.headers = null;
    } else if (type === "http") {
      if (url !== undefined) updateData.url = url;
      if (headers !== undefined) updateData.headers = headers;
      updateData.command = null;
      updateData.args = null;
      updateData.env = null;
    }

    const server = await MCPServer.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json(server);
  } catch (error: any) {
    console.error("Error updating MCP server:", error);
    // Cast check
    if (error.name === "CastError") {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update MCP server" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id || session.user.email;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const server = await MCPServer.findOneAndDelete({ _id: id, userId });

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting MCP server:", error);
    if (error.name === "CastError") {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete MCP server" }, { status: 500 });
  }
}
