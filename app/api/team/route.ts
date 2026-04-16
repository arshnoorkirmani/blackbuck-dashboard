import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import UserConfig from "@/lib/models/UserConfig";
import { DEFAULT_DASHBOARD_CONFIG } from "@/lib/types/dashboard";
import { getSheetData } from "@/lib/google";

import { parseAgentSheet } from "@/lib/parsers/parseAgentSheet";
import { parseTLSheet } from "@/lib/parsers/parseTLSheet";
import { parseSalesSheet } from "@/lib/parsers/parseSalesSheet";
import { parseIncentiveSheet } from "@/lib/parsers/parseIncentiveSheet";
import { parseAppraisalSheet, resolveTLNames } from "@/lib/parsers/parseAppraisalSheet";
import { buildDashboardData } from "@/lib/aggregators/buildDashboardData";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";

import type { UserRole, DashboardConfig, AgentRow, DashboardMainData } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/team
 * Returns data for the TEAM the logged-in user belongs to.
 * - AGENT:  Returns all agents in the same TL's team
 * - TL:     Returns all agents in their own team
 * - ADMIN:  Returns all agents (full data)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized — please sign in." }, { status: 401 });
    }

    const userEmail = session.user?.email?.toLowerCase() ?? "";
    const sessionRole: UserRole = (session.role as UserRole) ?? "AGENT";

    await dbConnect();
    const configRecord = await UserConfig.findOne({ email: "__dashboard__" });
    const config: DashboardConfig = configRecord?.config ?? DEFAULT_DASHBOARD_CONFIG;

    if (!config.sheetUrl) {
      return NextResponse.json(
        { error: "Dashboard not configured. An admin must add the Google Sheet URL in Settings." },
        { status: 503 }
      );
    }

    const match = config.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match?.[1];
    if (!sheetId) {
      return NextResponse.json({ error: "Invalid Sheet URL stored in config." }, { status: 500 });
    }

    // Fetch all needed tabs in parallel
    const [agentRaw, tlRaw, rawSalesRaw, teleSalesRaw, incentiveRaw, appraisalRaw] =
      await Promise.all([
        getSheetData(session.accessToken, sheetId, config.tabs.agent),
        getSheetData(session.accessToken, sheetId, config.tabs.tl),
        getSheetData(session.accessToken, sheetId, config.tabs.rawSales),
        getSheetData(session.accessToken, sheetId, config.tabs.teleSales),
        getSheetData(session.accessToken, sheetId, config.tabs.incentive),
        getSheetData(session.accessToken, sheetId, config.tabs.appraisal),
      ]);

    const role = resolveUserRole(sessionRole, userEmail, agentRaw, appraisalRaw);

    const agents       = parseAgentSheet(agentRaw);
    const tlSummary    = parseTLSheet(tlRaw);
    const rawSales     = parseSalesSheet(rawSalesRaw);
    const teleSales    = parseSalesSheet(teleSalesRaw);
    const incentiveRules = parseIncentiveSheet(incentiveRaw);
    const appraisal    = parseAppraisalSheet(appraisalRaw);

    const fullData: DashboardMainData = buildDashboardData(agents, tlSummary, rawSales, teleSales, incentiveRules);

    // Determine which TL team to show
    let teamAgents: AgentRow[] = [];
    let myTLName = "";

    if (role === "ADMIN") {
      // Admin sees everyone
      teamAgents = fullData.agents;
    } else if (role === "TL") {
      // TL sees their own team
      const uniqueTLNames = [...new Set(agents.map(a => a.tlName).filter(Boolean))];
      const tlNamesResolved = resolveTLNames(userEmail, appraisal, uniqueTLNames);
      const tlNamesLower = (tlNamesResolved ?? []).map(n => n.toLowerCase());
      teamAgents = fullData.agents.filter(a => tlNamesLower.includes(a.tlName.toLowerCase()));
      myTLName = tlNamesResolved?.[0] ?? "";
    } else {
      // AGENT — find their TL from the agent sheet, then get their full team
      const myRow = fullData.agents.find(a => a.emailId.toLowerCase() === userEmail);
      myTLName = myRow?.tlName ?? "";
      if (myTLName) {
        teamAgents = fullData.agents.filter(
          a => a.tlName.toLowerCase() === myTLName.toLowerCase()
        );
      } else {
        // Can't find team — return just their own row
        teamAgents = fullData.agents.filter(a => a.emailId.toLowerCase() === userEmail);
      }
    }

    // Build KPIs for this team subset
    const teamKPIs = {
      totalSales: teamAgents.reduce((s, a) => s + a.totalSold, 0),
      totalPoints: teamAgents.reduce((s, a) => s + a.salePoints, 0),
      avgAchievement: teamAgents.length > 0
        ? parseFloat((teamAgents.reduce((s, a) => s + a.percentAchieved, 0) / teamAgents.length).toFixed(2))
        : 0,
      totalIncentives: teamAgents.reduce((s, a) => s + a.finalPayout, 0),
    };

    return NextResponse.json({
      data: {
        ...fullData,
        agents: teamAgents,
        kpis: teamKPIs,
        agentPerformance: [...teamAgents]
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 10)
          .map(a => ({
            name: a.emailId.split("@")[0] || a.empId,
            achieved: a.totalSold,
            target: a.planTarget || Math.max(a.totalSold, 1),
          })),
      },
      role,
      myTLName,
      meta: { fetchedAt: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[/api/team] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
