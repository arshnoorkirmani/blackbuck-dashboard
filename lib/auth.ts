import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { UserRole } from "@/lib/types/dashboard";
import { env } from "@/lib/env";
import {
  ensureSuperAdminAccess,
  getAccessProfile,
  getBaseRoleForEmail,
  touchLastLogin,
  upsertAccessProfile,
} from "@/lib/services/access.service";

async function refreshAccessToken(token: Record<string, unknown>) {
  if (token.authProvider !== "google" || !token.refreshToken) {
    return token;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.authGoogleId,
        client_secret: env.authGoogleSecret,
        grant_type: "refresh_token",
        refresh_token: String(token.refreshToken),
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) {
      throw refreshed;
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

async function resolveStoredRole(email: string) {
  const access = await getAccessProfile(email);
  return getBaseRoleForEmail(email, access?.role ?? null);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: env.authGoogleId,
      clientSecret: env.authGoogleSecret,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    CredentialsProvider({
      name: "Super Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await ensureSuperAdminAccess();
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (email !== env.superAdminEmail.toLowerCase() || password !== env.superAdminPassword) {
          return null;
        }

        await touchLastLogin(email);

        return {
          id: email,
          email,
          name: env.superAdminName,
          role: "SUPER_ADMIN",
          authProvider: "credentials",
        };
      },
    }),
  ],

  pages: {
    signIn: "/",
  },

  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "credentials") {
        return true;
      }

      const email = String(profile?.email ?? user.email ?? "").trim().toLowerCase();
      if (!email) {
        return false;
      }

      const allowedDomain = env.allowedDomain;
      if (allowedDomain && !email.endsWith(allowedDomain)) {
        return false;
      }

      const storedRole = await resolveStoredRole(email);
      await upsertAccessProfile({
        email,
        name: user.name ?? String(profile?.name ?? ""),
        role: storedRole,
        authProvider: "google",
      });
      await touchLastLogin(email);
      return true;
    },

    async jwt({ token, account, user }) {
      if (account) {
        const email = String(user?.email ?? token.email ?? "").trim().toLowerCase();
        const authProvider = account.provider === "credentials" ? "credentials" : "google";
        const role =
          account.provider === "credentials"
            ? "SUPER_ADMIN"
            : await resolveStoredRole(email);

        return {
          ...token,
          accessToken: account.provider === "google" ? account.access_token : "credentials",
          refreshToken: account.provider === "google" ? account.refresh_token : undefined,
          expiresAt:
            account.provider === "google"
              ? (account.expires_at ?? Math.floor(Date.now() / 1000) + 3600) * 1000
              : Date.now() + 1000 * 60 * 60 * 24 * 7,
          role,
          authProvider,
        };
      }

      if ((token.authProvider as string | undefined) === "credentials") {
        return token;
      }

      if (Date.now() < ((token.expiresAt as number) ?? 0)) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token.accessToken) session.accessToken = token.accessToken as string;
      if (token.expiresAt) session.expiresAt = token.expiresAt as number;
      if (token.error) session.error = token.error as string;
      if (token.role) session.role = token.role as UserRole;
      if (token.authProvider) session.authProvider = token.authProvider as "google" | "credentials";
      return session;
    },
  },

  secret: env.authSecret,
});
