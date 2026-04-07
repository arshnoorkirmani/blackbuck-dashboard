import type {
  DashboardMainData,
  UserRole,
  AgentRow,
  TLSummaryRow,
  SalesTrendPoint,
} from "@/lib/types/dashboard";

/**
 * Server-side only — no DB calls.
 * Filters DashboardMainData to what the requesting user is allowed to see.
 *
 * @param data       Full aggregated dataset
 * @param role       Resolved role for this request
 * @param userEmail  Calling user's email (lowercase)
 * @param tlNames    TL names (from the TL sheet) that belong to this user — used for TL filtering
 */
export function filterByRole(
  data: DashboardMainData,
  role: UserRole,
  userEmail: string,
  tlNames: string[]
): DashboardMainData {
  if (role === "ADMIN") {
    return data;
  }

  if (role === "TL") {
    const tlNamesLower = tlNames.map((n) => n.toLowerCase());

    const filteredAgents: AgentRow[] = data.agents.filter((a) =>
      tlNamesLower.includes(a.tlName.toLowerCase())
    );

    const agentEmails = new Set(filteredAgents.map((a) => a.emailId.toLowerCase()));

    const filteredTL: TLSummaryRow[] = data.tlSummary.filter((t) =>
      tlNamesLower.includes(t.tlName.toLowerCase())
    );

    const filteredTrend: SalesTrendPoint[] = data.salesTrend.filter((point) => {
      // salesTrend items have agentEmail (from the SalesRow source).
      // We filter by checking if the point is attributed to one of this TL's agents.
      return (point as any).agentEmail
        ? agentEmails.has(((point as any).agentEmail as string).toLowerCase())
        : true; // if no agentEmail on the trend point, keep it (aggregated point)
    });

    return {
      ...data,
      agents: filteredAgents,
      tlSummary: filteredTL,
      salesTrend: filteredTrend,
    };
  }

  // AGENT — see only their own row
  const myAgent = data.agents.filter(
    (a) => a.emailId.toLowerCase() === userEmail.toLowerCase()
  );

  const myTrend: SalesTrendPoint[] = data.salesTrend.filter((point) =>
    (point as any).agentEmail
      ? ((point as any).agentEmail as string).toLowerCase() === userEmail.toLowerCase()
      : false
  );

  return {
    ...data,
    agents: myAgent,
    tlSummary: [],            // agents do not see the TL summary table
    salesTrend: myTrend,
    agentPerformance: [],     // agents do not see the leaderboard
    zoneDistribution: data.zoneDistribution, // zone overview is OK
  };
}
