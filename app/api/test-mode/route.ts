import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import { readTestModeState, readTestSnapshot, writeTestModeState, writeTestSnapshot } from "@/lib/server/test-mode";
import type { UserRole } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const state = await readTestModeState();
  const snapshot = await readTestSnapshot();
  return NextResponse.json({
    enabled: state.enabled ?? false,
    snapshotAt: state.snapshotAt ?? null,
    snapshotReady: Boolean(snapshot),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - please sign in." }, { status: 401 });
    }

    const body = (await req.json()) as { enabled?: boolean; snapshot?: boolean };
    const userEmail = session.user.email.toLowerCase();
    const sessionRole: UserRole = (session.role as UserRole) ?? "AGENT";
    const rawPayload = await loadDashboardRawData(session);
    const role = resolveUserRole(
      sessionRole,
      userEmail,
      rawPayload.agentRaw as string[][],
      rawPayload.appraisalRaw as string[][]
    );

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const enable = Boolean(body.enabled);
    let snapshotAt: string | null = null;
    if (enable && body.snapshot) {
      const snapshot = await writeTestSnapshot(rawPayload);
      snapshotAt = snapshot.snapshotAt;
    }

    await writeTestModeState({
      enabled: enable,
      snapshotAt: snapshotAt ?? (await readTestModeState()).snapshotAt,
      snapshotPath: "/trash/test-raw-snapshot.json",
    });

    const snapshot = await readTestSnapshot();
    return NextResponse.json({
      enabled: enable,
      snapshotAt: snapshotAt ?? null,
      snapshotReady: Boolean(snapshot),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
