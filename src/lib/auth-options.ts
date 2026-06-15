import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export function getAllowedEmails(): string[] {
  return (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAuthEnabled(): boolean {
  return process.env.AUTH_DISABLED !== "true";
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/connexion",
  },
  callbacks: {
    async signIn({ user }) {
      if (!isAuthEnabled()) return true;

      const allowed = getAllowedEmails();
      if (allowed.length === 0) return false;

      const email = user.email?.toLowerCase() ?? "";
      return allowed.includes(email);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
