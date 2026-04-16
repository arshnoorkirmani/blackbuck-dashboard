import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processData } from "@/lib/dataProcessor";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { readTestModeState, readTestSnapshot } from "@/lib/server/test-mode";
import type { UserRole } from "@/lib/types/dashboard";

const VALID_VIEWS = new Set(["dashboard", "team", "analytics"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - please sign in." }, { status: 401 });
    }

    const requestedView = req.nextUrl.searchParams.get("view") || "dashboard";
    const view = VALID_VIEWS.has(requestedView)
      ? (requestedView as "dashboard" | "team" | "analytics")
      : "dashboard";

    const userEmail = session.user.email.toLowerCase();
    const sessionRole: UserRole = (session.role as UserRole) ?? "AGENT";
    const testState = await readTestModeState();
    const testSnapshot = testState.enabled ? await readTestSnapshot() : null;
    const rawPayload = testSnapshot ?? (await loadDashboardRawData(session));
    const role = resolveUserRole(sessionRole, userEmail, rawPayload.agentRaw as string[][], rawPayload.appraisalRaw as string[][]);

    const rawData = {
      role,
      meta: { fetchedAt: new Date().toISOString() },
      data: rawPayload,
    };

    const responsePayload = processData(rawData, view, userEmail);
    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
