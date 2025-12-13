import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extended Session type that includes user ID
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT type
   */
  interface JWT {
    id?: string;
  }
}
