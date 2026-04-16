import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { processData } from "@/lib/dataProcessor";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import type { UserRole } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = String(req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
    const email = session.user.email.toLowerCase();
    const sessionRole = (session.role as UserRole) ?? "AGENT";
    const rawPayload = await loadDashboardRawData(session);
    const role = resolveUserRole(sessionRole, email, rawPayload.agentRaw as string[][], rawPayload.appraisalRaw as string[][]);

    const dashboardPayload = processData(
      { role, meta: { fetchedAt: new Date().toISOString() }, data: rawPayload },
      "dashboard",
      email
    ) as {
      agent?: {
        empId: string;
        email: string;
        tlName: string;
        appraisal?: { name?: string } | null;
        location?: string;
        performance?: { totalSold?: number; achPercent?: string };
      };
      team?: { agents?: Array<{ empId: string; email: string; tlName: string; appraisal?: { name?: string } | null; location?: string; performance?: { totalSold?: number; achPercent?: string } }> };
      allTeams?: Array<{ agents?: Array<{ empId: string; email: string; tlName: string; appraisal?: { name?: string } | null; location?: string; performance?: { totalSold?: number; achPercent?: string } }> }>;
    };

    const agents =
      dashboardPayload.allTeams?.flatMap((team) => team.agents ?? []) ??
      dashboardPayload.team?.agents ??
      (dashboardPayload.agent ? [dashboardPayload.agent] : []);

    const suggestions = agents
      .filter((agent) => {
        if (!query) {
          return true;
        }
        return (
          matchesQuery(agent.empId ?? "", query) ||
          matchesQuery(agent.email ?? "", query) ||
          matchesQuery(agent.tlName ?? "", query) ||
          matchesQuery(agent.appraisal?.name ?? "", query)
        );
      })
      .slice(0, 8)
      .map((agent) => ({
        empId: agent.empId,
        email: agent.email,
        tlName: agent.tlName,
        name: agent.appraisal?.name ?? agent.email.split("@")[0],
        location: agent.location ?? "",
        totalSold: Number(agent.performance?.totalSold ?? 0),
        achPercent: String(agent.performance?.achPercent ?? "0%"),
      }));

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
