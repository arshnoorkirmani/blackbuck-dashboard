import "next-auth";
import type { UserRole } from "@/lib/types/dashboard";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    expiresAt: number;
    error?: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    role?: UserRole;
  }
}