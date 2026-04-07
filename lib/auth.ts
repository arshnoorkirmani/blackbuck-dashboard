import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { UserRole } from "@/lib/types/dashboard";
import { env } from "@/lib/env";

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.authGoogleId,
        client_secret: env.authGoogleSecret,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: env.authGoogleId,
      clientSecret: env.authGoogleSecret,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      const allowedDomain = env.allowedDomain;
      if (allowedDomain && profile?.email) {
        return profile.email.endsWith(allowedDomain);
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        // ── Determine role on first sign-in ──────────────────────────────────
        const adminEmails = env.adminEmails;

        const userEmail = (token.email as string | undefined)?.toLowerCase() ?? "";
        // ADMIN from env; TL is resolved dynamically at API time from sheet data.
        const role: UserRole = adminEmails.includes(userEmail) ? "ADMIN" : "AGENT";

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at! * 1000,
          role,
        };
      }

      if (Date.now() < ((token.expiresAt as number) ?? 0)) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      // token fields are `unknown` in v5's internal types; cast explicitly
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.expiresAt)  session.expiresAt  = token.expiresAt as number;
      if (token.error)      session.error       = token.error as string;
      if (token.role)       session.role        = token.role as UserRole;
      return session;
    },
  },

  secret: env.authSecret,
});