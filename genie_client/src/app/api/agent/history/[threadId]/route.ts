import { NextResponse } from "next/server";
import { fetchThreadHistory } from "@/services/agentService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  // In Next.js 15 dynamic route handlers, params is now async.
  const { threadId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email;

  try {
    const messages = await fetchThreadHistory(threadId, userId);
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
