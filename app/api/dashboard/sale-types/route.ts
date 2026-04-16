import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { processData } from "@/lib/dataProcessor";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import type { UserRole } from "@/lib/types/dashboard";

type CustomerTxn = {
  date: string;
  planType: string;
  planCost: number;
  totalTransaction: number;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function withinRange(date: string, period: string) {
  const today = new Date();
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) {
    return false;
  }

  if (period === "today") {
    return target.toDateString() === today.toDateString();
  }

  if (period === "thisWeek") {
    const start = new Date(today);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return target >= start && target <= today;
  }

  return target.getMonth() === today.getMonth() && target.getFullYear() === today.getFullYear();
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetAgent = String(req.nextUrl.searchParams.get("agent") ?? "").trim().toLowerCase();
    const period = String(req.nextUrl.searchParams.get("period") ?? "thisMonth");
    const email = session.user.email.toLowerCase();
    const sessionRole = (session.role as UserRole) ?? "AGENT";
    const rawPayload = await loadDashboardRawData(session);
    const role = resolveUserRole(sessionRole, email, rawPayload.agentRaw as string[][], rawPayload.appraisalRaw as string[][]);

    const dashboardPayload = processData(
      { role, meta: { fetchedAt: new Date().toISOString() }, data: rawPayload },
      "dashboard",
      email
    ) as {
      agent?: { empId: string; email: string; customers?: { all?: CustomerTxn[] } };
      team?: { agents?: Array<{ empId: string; email: string; customers?: { all?: CustomerTxn[] } }> };
      allTeams?: Array<{ agents?: Array<{ empId: string; email: string; customers?: { all?: CustomerTxn[] } }> }>;
    };

    const agents =
      dashboardPayload.allTeams?.flatMap((team) => team.agents ?? []) ??
      dashboardPayload.team?.agents ??
      (dashboardPayload.agent ? [dashboardPayload.agent] : []);

    const selectedAgent =
      agents.find((agent) => agent.email.toLowerCase() === targetAgent || agent.empId.toLowerCase() === targetAgent) ??
      agents.find((agent) => agent.email.toLowerCase() === email) ??
      agents[0];

    const transactions = (selectedAgent?.customers?.all ?? []).filter((txn) => withinRange(txn.date, period));
    const byPlan = new Map<string, { count: number; amount: number }>();
    const byDay = new Map<string, { bonus: number; superBonus: number; superBonusPlus: number; revenue: number }>();

    for (const txn of transactions) {
      const key = txn.planType || "UNKNOWN";
      const current = byPlan.get(key) ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(txn.planCost ?? 0);
      byPlan.set(key, current);

      const dayEntry = byDay.get(txn.date) ?? { bonus: 0, superBonus: 0, superBonusPlus: 0, revenue: 0 };
      if (key === "BONUS") dayEntry.bonus += 1;
      if (key === "SUPER_BONUS") dayEntry.superBonus += 1;
      if (key === "SUPER_BONUS_PLUS") dayEntry.superBonusPlus += 1;
      dayEntry.revenue += Number(txn.planCost ?? 0);
      byDay.set(txn.date, dayEntry);
    }

    return NextResponse.json({
      agent: selectedAgent ? { empId: selectedAgent.empId, email: selectedAgent.email } : null,
      period,
      totals: {
        sales: transactions.length,
        revenue: transactions.reduce((sum, txn) => sum + Number(txn.planCost ?? 0), 0),
      },
      planTypes: [...byPlan.entries()].map(([planType, value]) => ({ planType, ...value })),
      byDay: [...byDay.entries()]
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([date, value]) => ({ date, ...value })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
