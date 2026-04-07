import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserConfig from "@/lib/models/UserConfig";
import { DEFAULT_DASHBOARD_CONFIG } from "@/lib/types/dashboard";
import { getSheetData } from "@/lib/google";
import { processData } from "@/lib/dataProcessor";

import type { UserRole, DashboardConfig } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth check ─────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in." },
        { status: 401 }
      );
    }

    const userEmail = session.user?.email?.toLowerCase() ?? "";
    let role: UserRole = (session.role as UserRole) ?? "AGENT";

    // ── 2. Configuration ───────────────────────────────────────────────────────
    await dbConnect();
    const configRecord = await UserConfig.findOne({ email: "__dashboard__" });
    const config: DashboardConfig = configRecord?.config ?? DEFAULT_DASHBOARD_CONFIG;

    if (!config.sheetUrl) {
      return NextResponse.json(
        { error: "Dashboard not configured." },
        { status: 503 }
      );
    }

    const match = config.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match?.[1];
    if (!sheetId) return NextResponse.json({ error: "Invalid Sheet URL." }, { status: 500 });

    const { searchParams } = req.nextUrl;
    const view = searchParams.get("view") || "dashboard"; // "dashboard" | "team" | "analytics"

    // ── 3. Fetch Data ──────────────────────────────────────────────────────────
    const [agentRaw, tlRaw, rawSalesRaw, teleSalesRaw, incentiveRaw, appraisalRaw, incentiveStructureRaw, employeeInfoRaw] =
      await Promise.all([
        getSheetData(session.accessToken, sheetId, config.tabs.agent),
        getSheetData(session.accessToken, sheetId, config.tabs.tl),
        getSheetData(session.accessToken, sheetId, config.tabs.rawSales),
        getSheetData(session.accessToken, sheetId, config.tabs.teleSales),
        getSheetData(session.accessToken, sheetId, config.tabs.incentive),
        getSheetData(session.accessToken, sheetId, config.tabs.appraisal),
        getSheetData(session.accessToken, sheetId, config.tabs.incentiveStructure),
        getSheetData(session.accessToken, sheetId, config.tabs.employeeInfo),
      ]);

    const rawData = {
      role,
      meta: { fetchedAt: new Date().toISOString() },
      data: {
        agentRaw, tlRaw, rawSalesRaw, teleSalesRaw, incentiveRaw, appraisalRaw, incentiveStructureRaw, employeeInfoRaw
      }
    };

    // ── 4. Process Data ────────────────────────────────────────────────────────
    const responsePayload = processData(rawData, view, userEmail);

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
