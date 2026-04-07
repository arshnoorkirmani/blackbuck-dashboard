import type {
  AgentRow,
  TLSummaryRow,
  SalesRow,
  DashboardMainData,
  DashboardKPIs,
  SalesTrendPoint,
  ZoneDistributionItem,
  AgentPerformance,
} from "@/lib/types/dashboard";
import { format, parseISO, isValid } from "date-fns";

/**
 * Build the full DashboardMainData from parsed tab arrays.
 * All calculations here are for the ADMIN (unfiltered) view.
 * filterByRole() is applied after this.
 */
export function buildDashboardData(
  agents: AgentRow[],
  tlSummary: TLSummaryRow[],
  rawSales: SalesRow[],
  teleSales: SalesRow[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _incentiveRules: unknown[],       // reserved for future incentive validation
): DashboardMainData {
  const allSales = [...rawSales, ...teleSales];

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalSales = agents.reduce((s, a) => s + a.totalSold, 0);
  const totalPoints = agents.reduce((s, a) => s + a.salePoints, 0);
  const avgAchievement =
    agents.length > 0
      ? parseFloat(
          (agents.reduce((s, a) => s + a.percentAchieved, 0) / agents.length).toFixed(2)
        )
      : 0;
  const totalIncentives = agents.reduce((s, a) => s + a.finalPayout, 0);

  const kpis: DashboardKPIs = { totalSales, totalPoints, avgAchievement, totalIncentives };

  // ── Sales Trend ─────────────────────────────────────────────────────────────
  // Group allSales by planDate → daily counts + points
  const trendMap = new Map<
    string,
    { sales: number; points: number; agentEmails: Set<string> }
  >();

  for (const sale of allSales) {
    if (!sale.planDate) continue;

    // Validate and format date
    let label: string;
    try {
      const d = parseISO(sale.planDate);
      label = isValid(d) ? format(d, "dd MMM") : sale.planDate;
    } catch {
      label = sale.planDate;
    }

    const existing = trendMap.get(label) ?? { sales: 0, points: 0, agentEmails: new Set() };
    existing.sales += 1;
    existing.points += sale.totalPoints;
    if (sale.agentEmail) existing.agentEmails.add(sale.agentEmail.toLowerCase());
    trendMap.set(label, existing);
  }

  // Sort by date ascending (best-effort — format "dd MMM" sorts lexicographically well enough)
  const salesTrend: SalesTrendPoint[] = Array.from(trendMap.entries())
    .map(([date, v]) => ({
      date,
      sales: v.sales,
      points: v.points,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Zone Distribution ────────────────────────────────────────────────────────
  const zoneMap = new Map<string, number>();
  for (const sale of allSales) {
    const zone = sale.location || "Unknown";
    zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);
  }

  const totalSalesCount = allSales.length;
  const zoneDistribution: ZoneDistributionItem[] = Array.from(zoneMap.entries())
    .map(([zone, count]) => ({
      zone,
      count,
      percentage: totalSalesCount > 0
        ? parseFloat(((count / totalSalesCount) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Agent Performance (top 10 by totalSold) ─────────────────────────────────
  const agentPerformance: AgentPerformance[] = [...agents]
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10)
    .map((a) => ({
      name: a.emailId.split("@")[0] || a.empId,
      achieved: a.totalSold,
      target: a.planTarget || Math.max(a.totalSold, 1),
    }));

  return {
    kpis,
    agents,
    tlSummary,
    salesTrend,
    zoneDistribution,
    agentPerformance,
    rawSales: allSales,
  };
}
