import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    discord_id?: string;
    username?: string;
    avatar_url?: string | null;
    isAdmin?: boolean;
  }

  interface Session {
    user: {
      discord_id: string;
      username: string;
      avatar_url: string | null;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discord_id?: string;
    username?: string;
    avatar_url?: string | null;
    isAdmin?: boolean;
  }
}
