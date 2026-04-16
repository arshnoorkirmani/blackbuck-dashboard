import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { processData } from "@/lib/dataProcessor";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import type { UserRole } from "@/lib/types/dashboard";

const VALID_VIEWS = new Set(["dashboard", "team", "analytics"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sampleRows(rows: Array<Array<string | number | null | undefined>> | undefined, count = 3) {
  if (!rows || rows.length === 0) return [];
  return rows.slice(0, count);
}

export async function GET(req: NextRequest) {
  try {
    if (process.env.DEBUG_DATA_INSPECTOR !== "true") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

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

    const rawData = {
      role,
      meta: { fetchedAt: new Date().toISOString() },
      data: rawPayload,
    };

    const processed = processData(rawData, view, userEmail) as Record<string, unknown>;
    const agentPreview = processed.agent as
      | { empId?: string; email?: string; tlName?: string; performance?: unknown; targetGap?: unknown }
      | null
      | undefined;
    const teamPreview = processed.team as
      | { tlName?: string; rank?: number; totals?: unknown }
      | null
      | undefined;
    const analyticsPreview = processed.analytics as
      | { overall?: unknown }
      | null
      | undefined;

    const responsePayload = {
      view,
      role,
      meta: rawData.meta,
      rawCounts: {
        agentRaw: rawPayload.agentRaw?.length ?? 0,
        tlRaw: rawPayload.tlRaw?.length ?? 0,
        rawSalesRaw: rawPayload.rawSalesRaw?.length ?? 0,
        teleSalesRaw: rawPayload.teleSalesRaw?.length ?? 0,
        incentiveRaw: rawPayload.incentiveRaw?.length ?? 0,
        appraisalRaw: rawPayload.appraisalRaw?.length ?? 0,
        incentiveStructureRaw: rawPayload.incentiveStructureRaw?.length ?? 0,
        employeeInfoRaw: rawPayload.employeeInfoRaw?.length ?? 0,
      },
      rawSample: {
        agentRaw: sampleRows(rawPayload.agentRaw),
        tlRaw: sampleRows(rawPayload.tlRaw),
        teleSalesRaw: sampleRows(rawPayload.teleSalesRaw),
        incentiveRaw: sampleRows(rawPayload.incentiveRaw),
        appraisalRaw: sampleRows(rawPayload.appraisalRaw),
      },
      processedKeys: Object.keys(processed ?? {}),
      processedPreview: {
        page: processed?.page,
        role: processed?.role,
        agent: agentPreview
          ? {
              empId: agentPreview.empId,
              email: agentPreview.email,
              tlName: agentPreview.tlName,
              performance: agentPreview.performance,
              targetGap: agentPreview.targetGap,
            }
          : null,
        team: teamPreview
          ? {
              tlName: teamPreview.tlName,
              rank: teamPreview.rank,
              totals: teamPreview.totals,
            }
          : null,
        analytics: analyticsPreview ? { overall: analyticsPreview.overall } : null,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
