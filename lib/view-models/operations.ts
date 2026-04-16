export type SalesPeriod = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "allTime";

export type AgentLike = {
  empId: string;
  email: string;
  tlName: string;
  location?: string;
  appraisal?: { name?: string } | null;
  performance?: {
    totalSold?: number;
    achPercent?: string | number;
  };
  salesSummary?: Partial<Record<SalesPeriod, { salesCount: number; customers10k?: number; customers50k?: number }>>;
};

export const PLAN_COLORS = ["#f59e0b", "#60a5fa", "#c084fc", "#34d399"] as const;

/**
 * Formats a number as an INR string with a safe fallback.
 */
export function formatCurrencyValue(value?: number) {
  return `Rs ${Number(value ?? 0).toLocaleString("en-IN")}`;
}

/**
 * Formats a percentage value while preserving server-provided strings when present.
 */
export function formatPercentValue(value?: string | number) {
  if (typeof value === "number") {
    return `${value.toFixed(1)}%`;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "0%";
}

/**
 * Parses a string or number percentage into a safe number.
 */
export function parsePercentValue(value?: string | number) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number.parseFloat(String(value ?? "0").replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Resolves the active agent from a searchable directory with graceful fallbacks.
 */
export function resolveActiveAgent<T extends AgentLike>(
  directory: T[],
  selectedAgentKey: string,
  fallbackAgent?: T | null
) {
  const normalizedKey = selectedAgentKey.trim().toLowerCase();

  if (normalizedKey) {
    const matched = directory.find(
      (agent) =>
        agent.email.toLowerCase() === normalizedKey ||
        agent.empId.toLowerCase() === normalizedKey
    );

    if (matched) {
      return matched;
    }
  }

  return fallbackAgent ?? directory[0] ?? null;
}

/**
 * Builds period rows for chart/table sync from a sales summary map.
 */
export function buildPeriodRows(
  salesSummary: Partial<Record<SalesPeriod, { salesCount: number; customers10k?: number; customers50k?: number }>>,
  periods: Array<{ label: string; value: SalesPeriod }>
) {
  return periods.map((period) => ({
    label: period.label,
    salesCount: salesSummary[period.value]?.salesCount ?? 0,
    customers10k: salesSummary[period.value]?.customers10k ?? 0,
    customers50k: salesSummary[period.value]?.customers50k ?? 0,
  }));
}

/**
 * Creates a stable, sorted leaderboard by total sold with a configurable cap.
 */
export function rankAgentsBySales<T extends AgentLike>(agents: T[], limit = 6) {
  return [...agents]
    .sort(
      (left, right) =>
        Number(right.performance?.totalSold ?? 0) - Number(left.performance?.totalSold ?? 0)
    )
    .slice(0, limit);
}

/**
 * Filters an agent directory by search, location, and team without mutating source data.
 */
export function filterAgentDirectory<T extends AgentLike>(
  agents: T[],
  search: string,
  locationFilter = "all",
  teamFilter = "all"
) {
  const query = search.trim().toLowerCase();

  return agents.filter((agent) => {
    const matchesLocation = locationFilter === "all" || agent.location === locationFilter;
    const matchesTeam = teamFilter === "all" || agent.tlName === teamFilter;
    const matchesSearch =
      !query ||
      agent.empId.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query) ||
      String(agent.appraisal?.name ?? "").toLowerCase().includes(query) ||
      agent.tlName.toLowerCase().includes(query);

    return matchesLocation && matchesTeam && matchesSearch;
  });
}
