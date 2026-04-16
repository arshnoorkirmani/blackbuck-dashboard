import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessProfile, upsertAccessProfile } from "@/lib/services/access.service";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import type { UserRole } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    let access = await getAccessProfile(email);

    if (!access) {
      access = await upsertAccessProfile({
        email,
        name: session.user.name ?? "",
        role: (session.role as UserRole) ?? "AGENT",
        authProvider: session.authProvider === "credentials" ? "credentials" : "google",
      });
    }

    if (!access) {
      return NextResponse.json({ error: "Unable to resolve access profile" }, { status: 500 });
    }

    let resolvedRole = access.role;
    try {
      const rawPayload = await loadDashboardRawData(session);
      resolvedRole = resolveUserRole(access.role, email, rawPayload.agentRaw as string[][], rawPayload.appraisalRaw as string[][]);
    } catch {
      resolvedRole = access.role;
    }

    return NextResponse.json({
      user: {
        name: session.user.name ?? access.name,
        email,
        image: session.user.image ?? null,
      },
      authProvider: session.authProvider ?? "google",
      role: resolvedRole,
      access,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
