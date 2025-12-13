import { getServerSession, Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Result type for getRequiredSession
 */
type RequiredSessionResult =
  | { session: Session; response: null }
  | { session: null; response: NextResponse };

/**
 * Get an authenticated session or return an unauthorized response.
 * Use this for routes that require authentication.
 *
 * @example
 * ```typescript
 * const { session, response } = await getRequiredSession();
 * if (response) return response; // Early return if unauthorized
 * const userId = session.user.id; // Type-safe access
 * ```
 */
export async function getRequiredSession(): Promise<RequiredSessionResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

/**
 * Get a session if available, without requiring authentication.
 * Use this for routes that support both authenticated and anonymous access.
 *
 * @example
 * ```typescript
 * const session = await getOptionalSession();
 * const userId = getUserId(session); // Returns ID or 'anonymous_user'
 * ```
 */
export async function getOptionalSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Get user ID from session with fallback to default.
 * Uses typed session.user.id if available, falls back to email, then default.
 *
 * @param session - The session object (can be null)
 * @param defaultId - Fallback ID if session is not available (default: 'anonymous_user')
 * @returns User ID string
 */
export function getUserId(
  session: Session | null,
  defaultId: string = "anonymous_user",
): string {
  if (!session?.user) {
    return defaultId;
  }
  return session.user.id || session.user.email || defaultId;
}

/**
 * Get user metadata from session for audit/logging purposes.
 *
 * @param session - The session object
 * @returns Object with userId, userName, and userEmail
 */
export function getUserMetadata(session: Session) {
  return {
    userId: session.user.id || session.user.email || "unknown",
    userName: session.user.name || "Unknown",
    userEmail: session.user.email || "Unknown",
  };
}

// Re-export authOptions for convenience
export { authOptions };
