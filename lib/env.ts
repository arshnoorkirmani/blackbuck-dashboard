/**
 * Production-ready environment variable validation.
 * Ensures the application doesn't start with missing or malformed configuration.
 */

const requiredEnvVars = [
    "MONGODB_URI",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "AUTH_SECRET",
] as const;

export function validateEnv() {
    const missing = requiredEnvVars.filter((name) => !process.env[name]);

    if (missing.length > 0) {
        const error = `❌ MISSION CRITICAL: Missing environment variables: ${missing.join(", ")}`;
        // Only throw at actual server runtime, not during `next build` page collection
        const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
        if (process.env.NODE_ENV === "production" && !isBuildPhase) {
            throw new Error(error);
        } else {
            console.warn(error);
        }
    }

    // Role-based access control (RBAC) config defaults
    return {
        mongodbUri: process.env.MONGODB_URI!,
        authGoogleId: process.env.AUTH_GOOGLE_ID!,
        authGoogleSecret: process.env.AUTH_GOOGLE_SECRET!,
        authSecret: process.env.AUTH_SECRET!,
        nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
        allowedDomain: process.env.ALLOWED_DOMAIN || "@blackbuck.com",
        adminEmails: (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()),
    };
}

export const env = validateEnv();
