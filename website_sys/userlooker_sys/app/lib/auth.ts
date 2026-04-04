import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { USERLOOKER_BASE_PATH } from "./userlookerBasePath";

const adminIds = (process.env.ADMIN_DISCORD_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  basePath: `${USERLOOKER_BASE_PATH}/api/auth`,
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: { scope: "identify" },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account && profile) {
        token.discord_id = profile.id as string;
        token.username = profile.username as string;
        const avatarHash = (profile as Record<string, unknown>).avatar as
          | string
          | null;
        token.avatar_url = avatarHash
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${avatarHash}.png`
          : null;
        token.isAdmin = adminIds.includes(profile.id as string);
      }
      return token;
    },
    session({ session, token }) {
      session.user.discord_id = token.discord_id as string;
      session.user.username = token.username as string;
      session.user.avatar_url = token.avatar_url as string | null;
      session.user.isAdmin = token.isAdmin as boolean;
      return session;
    },
  },
  session: { strategy: "jwt" },
});
