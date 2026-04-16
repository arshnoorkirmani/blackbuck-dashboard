import type { UserRole } from "@/lib/types/dashboard";

type PageName = "dashboard" | "team" | "analytics";
type Cell = string | number | null | undefined;
type RawRow = Cell[];
type RawData = {
  role?: UserRole;
  meta?: { fetchedAt?: string };
  data?: {
    agentRaw?: RawRow[];
    tlRaw?: RawRow[];
    rawSalesRaw?: RawRow[];
    teleSalesRaw?: RawRow[];
    incentiveRaw?: RawRow[];
    appraisalRaw?: RawRow[];
    incentiveStructureRaw?: RawRow[];
    employeeInfoRaw?: RawRow[];
  };
};

type DateRange = { from: string; to: string };
type DateRanges = Record<"today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth", DateRange>;
type Txn = {
  phone: string;
  saleCode: string;
  date: string;
  planCost: number;
  planType: string;
  isAutoRenewal: boolean;
  location: string;
  prevTransaction: number;
  marTransaction: number;
  totalTransaction: number;
  txnBucket: string;
};
type PeriodSummary = { salesCount: number; totalAmount: number; customers10k: number; customers50k: number; transactions: Txn[] };
type SalesSummary = Record<"today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "allTime", PeriodSummary>;
type AlertItem = { type: string; message: string; severity: "info" | "warning" | "critical" };
type Agent = {
  empId: string;
  email: string;
  tlName: string;
  doj: string | null;
  tenure: string;
  grade: string;
  status: string;
  location: string;
  saleCode: string;
  performance: Record<string, string | number>;
  incentive: Record<string, string | number> | null;
  appraisal: Record<string, string> | null;
  customers: { all: Txn[]; above10k: Txn[]; above50k: Txn[]; summary: { total: number; above10kCount: number; above50kCount: number } };
  salesSummary: SalesSummary;
  drr: { target: number; totalSoldTillNow: number; remainingTarget: number; remainingDays: number; drr: number; isOnTrack: boolean };
  filterTags: Record<string, string | string[] | boolean>;
  searchIndex: string;
  performanceScore: { salesScore: number; payoutScore: number; overall: number };
  activeDates: { firstSaleDate: string | null; lastSaleDate: string | null; totalActiveDays: number; saleDates: string[] };
  targetGap: { target: number; achieved: number; remaining: number; percentDone: number; daysLeft: number; neededPerDay: number; isAchievable: boolean };
  alerts: AlertItem[];
  trend: { direction: "up" | "down" | "stable"; weeklyGrowth: string; isImproving: boolean };
};
type Team = {
  tlName: string;
  location: string;
  rank: number;
  performance: Record<string, string | number>;
  agents: Agent[];
  totals: Record<string, number>;
  salesSummary: Record<string, PeriodSummary>;
  planBreakdown: Record<string, { count: number; amount: number; percentage: string }>;
  statusBreakdown: Record<string, { count: number; percentage: string; agentIds: string[] }>;
  bestPerformingDay: DailyTrendPoint;
  topPerformers: Array<Record<string, string | number>>;
  leaderboard: Array<Record<string, string | number>>;
};
type DailyTrendPoint = { date: string | null; salesCount: number; totalAmount: number; customers10k: number; customers50k: number };

const PLAN_TYPES = ["BONUS", "SUPER_BONUS", "SUPER_BONUS_PLUS"] as const;

/**
 * Processes the full dashboard payload into page-ready data.
 */
export function processData(rawData: RawData, page: PageName, loggedInEmail: string) {
  try {
    const role = rawData.role ?? "AGENT";
    const email = normalizeEmail(loggedInEmail);
    const source = rawData.data ?? {};
    const parsed = {
      agents: parseAgentRaw(source.agentRaw ?? []),
      tls: parseTlRaw(source.tlRaw ?? []),
      tlTotals: parseTlTotals(source.tlRaw ?? []),
      transactions: parseTeleSalesRaw(source.teleSalesRaw ?? []),
      incentives: parseIncentiveRaw(source.incentiveRaw ?? []),
      appraisals: parseAppraisalRaw(source.appraisalRaw ?? []),
    };

    const agentByEmail = new Map<string, RawRow>();
    const incentiveByEmail = new Map<string, RawRow>();
    const appraisalByOldId = new Map<string, RawRow>();
    const tlByName = new Map<string, RawRow>();
    const agentsByTL = new Map<string, string[]>();
    const transactionsByAgent = new Map<string, RawRow[]>();

    for (const row of parsed.agents) {
      const agentEmail = normalizeEmail(row[1]);
      const tlName = cleanString(row[2]);
      if (!agentEmail) continue;
      agentByEmail.set(agentEmail, row);
      agentsByTL.set(tlName, [...(agentsByTL.get(tlName) ?? []), agentEmail]);
    }
    for (const row of parsed.incentives) {
      const rowEmail = normalizeEmail(row[2]);
      if (rowEmail) incentiveByEmail.set(rowEmail, row);
    }
    for (const row of parsed.appraisals) {
      const oldEmpId = cleanString(row[0]);
      if (oldEmpId) appraisalByOldId.set(oldEmpId, row);
    }
    for (const row of parsed.tls) {
      const tlName = cleanString(row[3]);
      if (tlName) tlByName.set(tlName, row);
    }
    for (const row of parsed.transactions) {
      const rowEmail = normalizeEmail(row[6]);
      if (!rowEmail) continue;
      transactionsByAgent.set(rowEmail, [...(transactionsByAgent.get(rowEmail) ?? []), row]);
    }

    const allAgents = new Map<string, Agent>();
    for (const [agentEmail, agentRow] of agentByEmail.entries()) {
      allAgents.set(
        agentEmail,
        buildAgentObject(
          agentEmail,
          agentRow,
          incentiveByEmail.get(agentEmail) ?? null,
          appraisalByOldId.get(cleanString(agentRow[0])) ?? null,
          transactionsByAgent.get(agentEmail) ?? []
        )
      );
    }

    const allTeams: Team[] = [...tlByName.entries()].map(([tlName, tlRow]) =>
      buildTeamObject(
        tlName,
        tlRow,
        (agentsByTL.get(tlName) ?? []).map((agentEmail) => allAgents.get(agentEmail)).filter((agent): agent is Agent => Boolean(agent))
      )
    ).sort((left, right) => left.rank - right.rank);

    const analytics = buildAnalytics([...allAgents.values()], allTeams, parsed.tlTotals);
    const loggedInAgent = allAgents.get(email) ?? null;
    const loggedInTeam = loggedInAgent
      ? allTeams.find((team) => team.tlName === loggedInAgent.tlName) ?? null
      : resolveTeamForTl(parsed.appraisals, email, allTeams);

    if (page === "dashboard") {
      if (role === "AGENT") return { page, role, agent: loggedInAgent, team: loggedInTeam, quickStats: buildQuickStats(loggedInTeam), meta: safeMeta(rawData.meta) };
      if (role === "TL") return { page, role, agent: loggedInAgent, team: loggedInTeam, quickStats: buildQuickStats(loggedInTeam), meta: safeMeta(rawData.meta) };
      return { page, role, agent: loggedInAgent, allTeams, analytics, meta: safeMeta(rawData.meta) };
    }

    if (page === "team") {
      if (role === "AGENT") return { page, role, team: loggedInTeam, meta: safeMeta(rawData.meta) };
      if (role === "TL") return { page, role, team: loggedInTeam, allTeams: allTeams.map(summarizeTeam), meta: safeMeta(rawData.meta) };
      return { page, role, allTeams, meta: safeMeta(rawData.meta) };
    }

    return {
      page: "analytics",
      role,
      analytics,
      agents: [...allAgents.values()].map(summarizeAgentForAnalytics),
      teams: allTeams.map(summarizeTeam),
      highlight: role === "AGENT" ? { agentEmail: email, agentEmpId: loggedInAgent?.empId ?? "", agentRank: Number(loggedInAgent?.performance.rank ?? 0), teamName: loggedInAgent?.tlName ?? "" } : null,
      meta: safeMeta(rawData.meta),
    };
  } catch {
    return { page, role: rawData.role ?? "AGENT", error: "Unable to process dashboard data", meta: safeMeta(rawData.meta) };
  }
}

/**
 * Normalizes mixed date formats into YYYY-MM-DD.
 */
function normalizeDate(value: Cell): string | null {
  const source = cleanString(value);
  if (!source || source === "-" || source === "#VALUE!") return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:\s.*)?$/.exec(source);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(source);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const dMonY = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(source);
  if (!dMonY) return null;
  const month = monthNumber(dMonY[2]);
  if (!month) return null;
  const year = Number(dMonY[3]) >= 50 ? `19${dMonY[3]}` : `20${dMonY[3]}`;
  return `${year}-${month}-${dMonY[1].padStart(2, "0")}`;
}

/**
 * Builds standard runtime date ranges.
 */
function getDateRanges(): DateRanges {
  const now = new Date();
  const today = toDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - (dayOfWeek - 1));
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  return {
    today: { from: today, to: today },
    yesterday: { from: toDateKey(yesterday), to: toDateKey(yesterday) },
    thisWeek: { from: toDateKey(thisWeekStart), to: today },
    lastWeek: { from: toDateKey(lastWeekStart), to: toDateKey(lastWeekEnd) },
    thisMonth: { from: toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)) },
    lastMonth: { from: toDateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: toDateKey(new Date(now.getFullYear(), now.getMonth(), 0)) },
  };
}

/**
 * Counts working days left in the current month, excluding Sundays.
 */
function getRemainingWorkingDays(): number {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let count = 0;
  for (let cursor = new Date(today); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (cursor.getDay() !== 0) count += 1;
  }
  return count;
}

/**
 * Safely parses numeric cells.
 */
function parseNum(value: Cell): number {
  const source = cleanString(value).replace(/,/g, "");
  if (!source || source === "-" || source === "#VALUE!") return 0;
  const parsed = Number.parseFloat(source);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Safely parses amount-like cells.
 */
function parseAmount(value: Cell): number {
  return parseNum(value);
}

/**
 * Returns a one-decimal percentage string.
 */
function pct(part: number, total: number): string {
  if (!total) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

/**
 * Resolves the dominant sale code by frequency.
 */
function resolveSaleCode(transactions: Array<RawRow | Txn>): string {
  const counts = new Map<string, number>();
  for (const transaction of transactions) {
    const saleCode = "saleCode" in transaction ? cleanString(transaction.saleCode) : cleanString(transaction[1]);
    if (!saleCode) continue;
    counts.set(saleCode, (counts.get(saleCode) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [saleCode, count] of counts.entries()) {
    if (count > bestCount || (count === bestCount && saleCode.length > best.length)) {
      best = saleCode;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Builds a filtered period summary.
 */
function buildPeriodSummary(transactions: Txn[], range: DateRange): PeriodSummary {
  const filtered = transactions.filter((transaction) => transaction.date >= range.from && transaction.date <= range.to);
  return {
    salesCount: filtered.length,
    totalAmount: filtered.reduce((sum, transaction) => sum + transaction.planCost, 0),
    customers10k: filtered.filter((transaction) => transaction.txnBucket === "Converted Above 10K").length,
    customers50k: filtered.filter((transaction) => transaction.totalTransaction >= 50000).length,
    transactions: filtered,
  };
}

/**
 * Builds all standard sales summaries.
 */
function buildSalesSummary(transactions: Txn[], ranges: DateRanges): SalesSummary {
  return {
    today: buildPeriodSummary(transactions, ranges.today),
    yesterday: buildPeriodSummary(transactions, ranges.yesterday),
    thisWeek: buildPeriodSummary(transactions, ranges.thisWeek),
    lastWeek: buildPeriodSummary(transactions, ranges.lastWeek),
    thisMonth: buildPeriodSummary(transactions, ranges.thisMonth),
    lastMonth: buildPeriodSummary(transactions, ranges.lastMonth),
    allTime: {
      salesCount: transactions.length,
      totalAmount: transactions.reduce((sum, transaction) => sum + transaction.planCost, 0),
      customers10k: transactions.filter((transaction) => transaction.txnBucket === "Converted Above 10K").length,
      customers50k: transactions.filter((transaction) => transaction.totalTransaction >= 50000).length,
      transactions,
    },
  };
}

/**
 * Summarizes plan mix from transactions.
 */
function buildPlanBreakdown(transactions: Txn[]) {
  return Object.fromEntries(
    PLAN_TYPES.map((planType) => {
      const filtered = transactions.filter((transaction) => transaction.planType === planType);
      const key = planType.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      return [key, { count: filtered.length, amount: filtered.reduce((sum, transaction) => sum + transaction.planCost, 0), percentage: pct(filtered.length, transactions.length) }];
    })
  ) as Record<string, { count: number; amount: number; percentage: string }>;
}

/**
 * Builds day-level trend points.
 */
function buildDailyTrend(transactions: Txn[]): DailyTrendPoint[] {
  const index = new Map<string, DailyTrendPoint>();
  for (const transaction of transactions) {
    const current = index.get(transaction.date) ?? { date: transaction.date, salesCount: 0, totalAmount: 0, customers10k: 0, customers50k: 0 };
    current.salesCount += 1;
    current.totalAmount += transaction.planCost;
    current.customers10k += transaction.txnBucket === "Converted Above 10K" ? 1 : 0;
    current.customers50k += transaction.totalTransaction >= 50000 ? 1 : 0;
    index.set(transaction.date, current);
  }
  return [...index.values()].sort((left, right) => cleanString(left.date).localeCompare(cleanString(right.date)));
}

/**
 * Builds grade counts and percentages.
 */
function buildGradeDistribution(agents: Agent[]) {
  const counts = new Map<string, number>();
  for (const agent of agents) {
    const grade = cleanString(agent.grade) || "UNKNOWN";
    counts.set(grade, (counts.get(grade) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].map(([grade, count]) => [grade, { count, percentage: pct(count, agents.length) }])) as Record<string, { count: number; percentage: string }>;
}

/**
 * Finds the best performing day in a transaction set.
 */
function getBestPerformingDay(transactions: Txn[]): DailyTrendPoint {
  const trend = buildDailyTrend(transactions);
  return trend[0] ? [...trend].sort((left, right) => right.salesCount - left.salesCount || right.totalAmount - left.totalAmount)[0] : { date: null, salesCount: 0, totalAmount: 0, customers10k: 0, customers50k: 0 };
}

/**
 * Builds org growth metrics.
 */
function buildTrends(transactions: Txn[], ranges: DateRanges) {
  const thisWeek = buildPeriodSummary(transactions, ranges.thisWeek);
  const lastWeek = buildPeriodSummary(transactions, ranges.lastWeek);
  const thisMonth = buildPeriodSummary(transactions, ranges.thisMonth);
  const lastMonth = buildPeriodSummary(transactions, ranges.lastMonth);
  return {
    salesGrowth: growthString(thisWeek.salesCount, lastWeek.salesCount),
    conversionGrowth: growthString(thisWeek.customers10k, lastWeek.customers10k),
    revenueGrowth: growthString(thisMonth.totalAmount, lastMonth.totalAmount),
  };
}

/**
 * Builds organization alerts from agent and total summaries.
 */
function buildOrgAlerts(agents: Agent[], totals: { total: RawRow }): AlertItem[] {
  const alerts: AlertItem[] = [];
  const below50 = agents.filter((agent) => parseNum(agent.performance.achPercent as Cell) < 50).length;
  const notEligible = agents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Not Eligible").length;
  const orgDrr = parseNum(totals.total[21]);
  if (below50) alerts.push({ type: "low_achievement_cluster", message: `${below50} agents are below 50% achievement.`, severity: below50 >= 5 ? "critical" : "warning" });
  if (notEligible) alerts.push({ type: "eligibility_gap", message: `${notEligible} agents are currently not eligible for payout.`, severity: "warning" });
  if (orgDrr > 5) alerts.push({ type: "high_org_drr", message: `Organization DRR is ${orgDrr} per day.`, severity: "info" });
  return alerts;
}

/**
 * Builds day, week, or month indexes.
 */
function buildDateIndex(transactions: Txn[], granularity: "day" | "week" | "month") {
  const index = new Map<string, DailyTrendPoint>();
  for (const transaction of transactions) {
    const key = granularity === "day" ? transaction.date : granularity === "week" ? weekKey(transaction.date) : transaction.date.slice(0, 7);
    const current = index.get(key) ?? { date: key, salesCount: 0, totalAmount: 0, customers10k: 0, customers50k: 0 };
    current.salesCount += 1;
    current.totalAmount += transaction.planCost;
    current.customers10k += transaction.txnBucket === "Converted Above 10K" ? 1 : 0;
    current.customers50k += transaction.totalTransaction >= 50000 ? 1 : 0;
    index.set(key, current);
  }
  return Object.fromEntries([...index.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

/**
 * Builds a lookup summary for a selected agent field.
 */
function buildLookupMap(agents: Agent[], field: "tlName" | "location" | "grade" | "eligibility") {
  const index = new Map<string, { agentIds: string[]; count: number; totalSold: number; achTotal: number }>();
  for (const agent of agents) {
    const key = field === "eligibility" ? cleanString(agent.performance.eligibility as Cell) || "UNKNOWN" : cleanString(agent[field]) || "UNKNOWN";
    const current = index.get(key) ?? { agentIds: [], count: 0, totalSold: 0, achTotal: 0 };
    current.agentIds.push(agent.empId);
    current.count += 1;
    current.totalSold += Number(agent.performance.totalSold ?? 0);
    current.achTotal += parseNum(agent.performance.achPercent as Cell);
    index.set(key, current);
  }
  return Object.fromEntries([...index.entries()].map(([key, value]) => [key, { agentIds: value.agentIds, count: value.count, totalSold: value.totalSold, achPercent: value.count ? `${(value.achTotal / value.count).toFixed(1)}%` : "0.0%" }]));
}

/**
 * Builds a lookup summary for plan types.
 */
function buildPlanTypeLookup(agents: Agent[]) {
  const index = new Map<string, { agentIds: Set<string>; count: number; totalSold: number; achTotal: number }>();
  for (const agent of agents) {
    for (const planType of agent.filterTags.planTypes as string[]) {
      const current = index.get(planType) ?? { agentIds: new Set<string>(), count: 0, totalSold: 0, achTotal: 0 };
      current.agentIds.add(agent.empId);
      current.count += 1;
      current.totalSold += Number(agent.performance.totalSold ?? 0);
      current.achTotal += parseNum(agent.performance.achPercent as Cell);
      index.set(planType, current);
    }
  }
  return Object.fromEntries([...index.entries()].map(([key, value]) => [key, { agentIds: [...value.agentIds], count: value.count, totalSold: value.totalSold, achPercent: value.count ? `${(value.achTotal / value.count).toFixed(1)}%` : "0.0%" }]));
}

/**
 * Extracts a location summary from TL totals rows.
 */
function buildLocationSummary(row: RawRow) {
  return { totalTarget: parseNum(row[7]), totalSold: parseNum(row[12]), totalSalePoints: parseNum(row[15]), achPercent: cleanString(row[16]), converted10k: parseNum(row[18]), required: parseNum(row[20]), drr: parseNum(row[21]) };
}

/**
 * Parses valid agent rows.
 */
function parseAgentRaw(raw: RawRow[]) {
  return raw.slice(2).filter((row) => /^[A-Za-z][A-Za-z0-9]+$/.test(cleanString(row[0])));
}

/**
 * Parses valid TL rows.
 */
function parseTlRaw(raw: RawRow[]) {
  return raw.slice(3, 21).filter((row) => parseNum(row[2]) > 0 && cleanString(row[3]).length > 0);
}

/**
 * Parses TL total rows.
 */
function parseTlTotals(raw: RawRow[]) {
  return { total: raw[21] ?? [], bangalore: raw[23] ?? [], jaipur: raw[24] ?? [], grandTotal: raw[25] ?? [] };
}

/**
 * Parses valid transaction rows.
 */
function parseTeleSalesRaw(raw: RawRow[]) {
  return raw.slice(1).filter((row) => normalizeEmail(row[6]).includes("@") && Boolean(normalizeDate(row[2])));
}

/**
 * Parses valid incentive rows.
 */
function parseIncentiveRaw(raw: RawRow[]) {
  return raw.slice(2).filter((row) => cleanString(row[1]).length > 0);
}

/**
 * Parses appraisal rows.
 */
function parseAppraisalRaw(raw: RawRow[]) {
  return raw.slice(1).filter((row) => cleanString(row[0]).length > 0 || normalizeEmail(row[3]).length > 0);
}

/**
 * Builds the complete agent object.
 */
function buildAgentObject(email: string, agentRow: RawRow, incentiveRow: RawRow | null, appraisalRow: RawRow | null, transactions: RawRow[]): Agent {
  const normalizedTransactions: Txn[] = transactions
    .map((transaction) => ({
      phone: cleanString(transaction[0]),
      saleCode: cleanString(transaction[1]),
      date: normalizeDate(transaction[2]) ?? "",
      planCost: parseNum(transaction[3]),
      planType: cleanString(transaction[4]).toUpperCase(),
      isAutoRenewal: cleanString(transaction[5]) === "AUTO_RENEWAL",
      location: cleanString(transaction[10]),
      prevTransaction: parseAmount(transaction[14]),
      marTransaction: parseAmount(transaction[15]),
      totalTransaction: parseAmount(transaction[16]),
      txnBucket: cleanString(transaction[17]),
    }))
    .filter((transaction) => transaction.date.length > 0);

  const performance = {
    presentDays: parseNum(agentRow[7]),
    wfhAttendance: parseNum(agentRow[8]),
    attPercent: cleanString(agentRow[9]),
    talktime: cleanString(agentRow[10]),
    quality: cleanString(agentRow[11]),
    completedCalls: cleanString(agentRow[12]),
    planSaleTarget: parseNum(agentRow[13]),
    bonus: parseNum(agentRow[14]),
    superBonus: parseNum(agentRow[15]),
    superBonusPlus: parseNum(agentRow[16]),
    monthlyPlanSold: parseNum(agentRow[17]),
    totalSold: parseNum(agentRow[18]),
    salePointAch: parseNum(agentRow[19]),
    totalSalePoint: parseNum(agentRow[21]),
    achPercent: cleanString(agentRow[22]),
    slab: parseNum(agentRow[23]),
    incentivesEarned: parseNum(agentRow[24]),
    funnel5k: cleanString(agentRow[25]),
    converted10k: parseNum(agentRow[26]),
    ach10kPercent: cleanString(agentRow[27]),
    payoutFactor: parseNum(agentRow[28]),
    finalPayout: parseNum(agentRow[29]),
    rank: parseNum(agentRow[30]),
    eligibility: cleanString(agentRow[31]),
  };
  const incentive = incentiveRow ? { location: cleanString(incentiveRow[0]), rank: parseNum(incentiveRow[31]), eligibility: cleanString(incentiveRow[32]), vintage: cleanString(incentiveRow[45]), target: parseNum(incentiveRow[46]), totalSold: parseNum(incentiveRow[19]), salesPoints: parseNum(incentiveRow[22]), achPercent: cleanString(incentiveRow[23]), slab: parseNum(incentiveRow[24]), incentiveAt50_59: parseNum(incentiveRow[38]), incentiveAt60_69: parseNum(incentiveRow[39]), incentiveAt70_85: parseNum(incentiveRow[40]), incentiveAtAbove85: parseNum(incentiveRow[41]), totalIncentive: parseNum(incentiveRow[37]), payoutFactor: parseNum(incentiveRow[29]), finalPayout: parseNum(incentiveRow[30]) } : null;
  const appraisal = appraisalRow ? { oldEmpId: cleanString(appraisalRow[0]), name: cleanString(appraisalRow[1]), personalPhone: cleanString(appraisalRow[2]), personalEmail: cleanString(appraisalRow[3]), newEmpId: cleanString(appraisalRow[4]) } : null;
  const above10k = normalizedTransactions.filter((transaction) => transaction.txnBucket === "Converted Above 10K");
  const above50k = normalizedTransactions.filter((transaction) => transaction.totalTransaction >= 50000);
  const salesSummary = buildSalesSummary(normalizedTransactions, getDateRanges());
  const target = Number(incentive?.target ?? 0) || Number(performance.planSaleTarget ?? 0);
  const totalSoldTillNow = Number(performance.totalSold ?? 0);
  const remainingTarget = Math.max(0, target - totalSoldTillNow);
  const remainingDays = getRemainingWorkingDays();
  const drrValue = remainingDays > 0 ? Math.ceil(remainingTarget / remainingDays) : 0;
  const achPercent = parseNum(performance.achPercent as Cell);
  const uniqueDates = [...new Set(normalizedTransactions.map((transaction) => transaction.date))].sort();
  return {
    empId: cleanString(agentRow[0]),
    email,
    tlName: cleanString(agentRow[2]),
    doj: normalizeDate(agentRow[3]),
    tenure: cleanString(agentRow[4]),
    grade: cleanString(agentRow[5]),
    status: cleanString(agentRow[6]),
    location: normalizedTransactions[0]?.location ?? "",
    saleCode: resolveSaleCode(transactions),
    performance,
    incentive,
    appraisal,
    customers: { all: normalizedTransactions, above10k, above50k, summary: { total: normalizedTransactions.length, above10kCount: above10k.length, above50kCount: above50k.length } },
    salesSummary,
    drr: { target, totalSoldTillNow, remainingTarget, remainingDays, drr: drrValue, isOnTrack: remainingTarget <= 0 || (remainingDays > 0 && drrValue <= 3) },
    filterTags: { status: cleanString(agentRow[6]), location: normalizedTransactions[0]?.location ?? "", grade: cleanString(agentRow[5]), tlName: cleanString(agentRow[2]), eligibility: cleanString(agentRow[31]), vintage: cleanString(incentiveRow?.[45] ?? agentRow[4]), achBucket: achPercent < 50 ? "Below 50%" : achPercent < 75 ? "50-75%" : achPercent < 100 ? "75-100%" : "Above 100%", payoutBucket: Number(performance.finalPayout ?? 0) === 0 ? "None" : Number(performance.finalPayout ?? 0) < 5000 ? "Low" : Number(performance.finalPayout ?? 0) < 10000 ? "Medium" : "High", converted10kBucket: Number(performance.converted10k ?? 0) === 0 ? "0" : Number(performance.converted10k ?? 0) <= 5 ? "1-5" : Number(performance.converted10k ?? 0) <= 10 ? "5-10" : "10+", planTypes: [...new Set(normalizedTransactions.map((transaction) => transaction.planType).filter(Boolean))], soldToday: salesSummary.today.salesCount > 0, soldYesterday: salesSummary.yesterday.salesCount > 0, soldThisWeek: salesSummary.thisWeek.salesCount > 0, soldThisMonth: salesSummary.thisMonth.salesCount > 0 },
    searchIndex: [cleanString(agentRow[0]), email, cleanString(agentRow[2]), normalizedTransactions[0]?.location ?? "", cleanString(agentRow[5]), resolveSaleCode(transactions), appraisal?.name ?? "", appraisal?.oldEmpId ?? ""].join(" ").toLowerCase(),
    performanceScore: { salesScore: Math.min(100, achPercent), payoutScore: Number(performance.finalPayout ?? 0) > 0 ? Math.min(100, (Number(performance.finalPayout ?? 0) / 20000) * 100) : 0, overall: Math.round(Math.min(100, achPercent) * 0.6 + (Number(performance.finalPayout ?? 0) > 0 ? 40 : 0)) },
    activeDates: { firstSaleDate: uniqueDates[0] ?? null, lastSaleDate: uniqueDates[uniqueDates.length - 1] ?? null, totalActiveDays: uniqueDates.length, saleDates: uniqueDates },
    targetGap: { target, achieved: totalSoldTillNow, remaining: remainingTarget, percentDone: target > 0 ? Math.round((totalSoldTillNow / target) * 1000) / 10 : 0, daysLeft: remainingDays, neededPerDay: drrValue, isAchievable: remainingTarget <= 0 || (remainingDays > 0 && drrValue <= 3) },
    alerts: buildAgentAlerts(achPercent, cleanString(agentRow[31]), salesSummary.thisWeek.salesCount, drrValue),
    trend: { direction: salesSummary.thisWeek.salesCount > salesSummary.lastWeek.salesCount ? "up" : salesSummary.thisWeek.salesCount < salesSummary.lastWeek.salesCount ? "down" : "stable", weeklyGrowth: growthString(salesSummary.thisWeek.salesCount, salesSummary.lastWeek.salesCount), isImproving: salesSummary.thisWeek.salesCount >= salesSummary.lastWeek.salesCount },
  };
}

/**
 * Builds the complete team object from a TL row and its agents.
 */
function buildTeamObject(tlName: string, tlRow: RawRow, agents: Agent[]): Team {
  const activeAgents = agents.filter((agent) => agent.status === "Active");
  const performance = { rank: parseNum(tlRow[2]), avgTalktime: cleanString(tlRow[4]), avgCompletedCalls: cleanString(tlRow[5]), avgQuality: cleanString(tlRow[6]), planSaleTarget: parseNum(tlRow[7]), bonus: parseNum(tlRow[8]), superBonus: parseNum(tlRow[9]), superBonusPlus: parseNum(tlRow[10]), monthlyPlanSold: parseNum(tlRow[11]), totalSold: parseNum(tlRow[12]), salePointAch: parseNum(tlRow[13]), totalSalePoint: parseNum(tlRow[15]), achPercent: cleanString(tlRow[16]), funnel5k: parseNum(tlRow[17]), converted10k: parseNum(tlRow[18]), ach10kPercent: cleanString(tlRow[19]), required: parseNum(tlRow[20]), drr: parseNum(tlRow[21]) };
  const allTransactions = activeAgents.flatMap((agent) => agent.customers.all);
  const periods = Object.keys(buildSalesSummary([], getDateRanges()));
  const salesSummary = Object.fromEntries(periods.map((period) => [period, activeAgents.reduce<PeriodSummary>((acc, agent) => {
    const source = agent.salesSummary[period as keyof SalesSummary];
    return { salesCount: acc.salesCount + source.salesCount, totalAmount: acc.totalAmount + source.totalAmount, customers10k: acc.customers10k + source.customers10k, customers50k: acc.customers50k + source.customers50k, transactions: [...acc.transactions, ...source.transactions] };
  }, { salesCount: 0, totalAmount: 0, customers10k: 0, customers50k: 0, transactions: [] })])) as Record<string, PeriodSummary>;
  const topPerformers = [...activeAgents].sort((left, right) => Number(right.performance.totalSold ?? 0) - Number(left.performance.totalSold ?? 0)).map((agent, index) => ({ rank: index + 1, empId: agent.empId, email: agent.email, saleCode: agent.saleCode, totalSold: Number(agent.performance.totalSold ?? 0), achPercent: cleanString(agent.performance.achPercent as Cell), converted10k: Number(agent.performance.converted10k ?? 0), finalPayout: Number(agent.performance.finalPayout ?? 0), eligibility: cleanString(agent.performance.eligibility as Cell) }));
  const eligible = activeAgents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Eligible");
  const notEligible = activeAgents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Not Eligible");
  return {
    tlName,
    location: agents[0]?.location ?? "",
    rank: Number(performance.rank),
    performance,
    agents,
    totals: { agentCount: agents.length, activeCount: activeAgents.length, inactiveCount: agents.length - activeAgents.length, totalTarget: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.planSaleTarget ?? 0), 0), totalSold: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.totalSold ?? 0), 0), totalSalePoints: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.totalSalePoint ?? 0), 0), totalIncentive: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.incentivesEarned ?? 0), 0), totalFinalPayout: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.finalPayout ?? 0), 0), totalConverted10k: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.converted10k ?? 0), 0), totalFunnel5k: activeAgents.reduce((sum, agent) => sum + parseNum(agent.performance.funnel5k as Cell), 0), totalAbove50k: activeAgents.reduce((sum, agent) => sum + agent.customers.summary.above50kCount, 0) },
    salesSummary,
    planBreakdown: buildPlanBreakdown(allTransactions),
    statusBreakdown: { eligible: { count: eligible.length, percentage: pct(eligible.length, agents.length), agentIds: eligible.map((agent) => agent.empId) }, notEligible: { count: notEligible.length, percentage: pct(notEligible.length, agents.length), agentIds: notEligible.map((agent) => agent.empId) } },
    bestPerformingDay: getBestPerformingDay(allTransactions),
    topPerformers,
    leaderboard: topPerformers,
  };
}

/**
 * Builds the analytics object used by the analytics page and admin dashboard.
 */
function buildAnalytics(agents: Agent[], teams: Team[], tlTotals: { total: RawRow; bangalore: RawRow; jaipur: RawRow }) {
  const activeAgents = agents.filter((agent) => agent.status === "Active");
  const transactions = activeAgents.flatMap((agent) => agent.customers.all);
  const ranges = getDateRanges();
  const achievementBuckets = { below50: { count: 0, percentage: "", agentIds: [] as string[] }, from50to75: { count: 0, percentage: "", agentIds: [] as string[] }, from75to100: { count: 0, percentage: "", agentIds: [] as string[] }, above100: { count: 0, percentage: "", agentIds: [] as string[] } };
  const payoutDistribution = { zero: { count: 0, totalAmount: 0, percentage: "" }, below5k: { count: 0, totalAmount: 0, percentage: "" }, from5kto10k: { count: 0, totalAmount: 0, percentage: "" }, above10k: { count: 0, totalAmount: 0, percentage: "" } };
  for (const agent of activeAgents) {
    const ach = parseNum(agent.performance.achPercent as Cell);
    const payout = Number(agent.performance.finalPayout ?? 0);
    const achBucket = ach < 50 ? achievementBuckets.below50 : ach < 75 ? achievementBuckets.from50to75 : ach < 100 ? achievementBuckets.from75to100 : achievementBuckets.above100;
    achBucket.count += 1;
    achBucket.agentIds.push(agent.empId);
    const payoutBucket = payout === 0 ? payoutDistribution.zero : payout < 5000 ? payoutDistribution.below5k : payout < 10000 ? payoutDistribution.from5kto10k : payoutDistribution.above10k;
    payoutBucket.count += 1;
    payoutBucket.totalAmount += payout;
  }
  for (const bucket of Object.values(achievementBuckets)) bucket.percentage = pct(bucket.count, activeAgents.length);
  for (const bucket of Object.values(payoutDistribution)) bucket.percentage = pct(bucket.count, activeAgents.length);
  return {
    overall: { totalAgents: agents.length, activeAgents: activeAgents.length, inactiveAgents: agents.length - activeAgents.length, totalTarget: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.planSaleTarget ?? 0), 0), totalSold: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.totalSold ?? 0), 0), totalSalePoints: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.totalSalePoint ?? 0), 0), achPercent: cleanString(tlTotals.total[16]), totalConverted10k: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.converted10k ?? 0), 0), ach10kPercent: cleanString(tlTotals.total[19]), required: parseNum(tlTotals.total[20]), drr: parseNum(tlTotals.total[21]), totalRevenue: transactions.reduce((sum, transaction) => sum + transaction.planCost, 0), totalAbove50k: transactions.filter((transaction) => transaction.totalTransaction >= 50000).length, totalPayoutAmount: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.finalPayout ?? 0), 0), totalIncentiveEarned: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.incentivesEarned ?? 0), 0) },
    locationWise: { bangalore: buildLocationSummary(tlTotals.bangalore), jaipur: buildLocationSummary(tlTotals.jaipur) },
    planBreakdown: buildPlanBreakdown(transactions),
    gradeDistribution: buildGradeDistribution(activeAgents),
    dailyTrend: buildDailyTrend(transactions),
    tlLeaderboard: teams.map((team) => ({ rank: team.rank, tlName: team.tlName, location: team.location, totalSold: Number(team.performance.totalSold ?? 0), achPercent: cleanString(team.performance.achPercent as Cell), converted10k: Number(team.performance.converted10k ?? 0), ach10kPercent: cleanString(team.performance.ach10kPercent as Cell), drr: Number(team.performance.drr ?? 0), required: Number(team.performance.required ?? 0), agentCount: Number(team.totals.agentCount ?? 0) })),
    topAgents: {
      bySales: [...activeAgents].sort((left, right) => Number(right.performance.totalSold ?? 0) - Number(left.performance.totalSold ?? 0)).slice(0, 10).map((agent, index) => ({ rank: index + 1, empId: agent.empId, email: agent.email, tlName: agent.tlName, totalSold: Number(agent.performance.totalSold ?? 0), achPercent: cleanString(agent.performance.achPercent as Cell), finalPayout: Number(agent.performance.finalPayout ?? 0) })),
      byPayout: [...activeAgents].sort((left, right) => Number(right.performance.finalPayout ?? 0) - Number(left.performance.finalPayout ?? 0)).slice(0, 10).map((agent, index) => ({ rank: index + 1, empId: agent.empId, email: agent.email, tlName: agent.tlName, finalPayout: Number(agent.performance.finalPayout ?? 0), eligibility: cleanString(agent.performance.eligibility as Cell) })),
      by10kConversion: [...activeAgents].sort((left, right) => Number(right.performance.converted10k ?? 0) - Number(left.performance.converted10k ?? 0)).slice(0, 10).map((agent, index) => ({ rank: index + 1, empId: agent.empId, email: agent.email, tlName: agent.tlName, converted10k: Number(agent.performance.converted10k ?? 0), ach10kPercent: cleanString(agent.performance.ach10kPercent as Cell) })),
    },
    bestPerformingDay: getBestPerformingDay(transactions),
    incentiveSummary: { totalEligible: { count: activeAgents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Eligible").length, percentage: pct(activeAgents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Eligible").length, activeAgents.length) }, totalNotEligible: { count: activeAgents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Not Eligible").length, percentage: pct(activeAgents.filter((agent) => cleanString(agent.performance.eligibility as Cell) === "Not Eligible").length, activeAgents.length) }, totalPayoutAmount: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.finalPayout ?? 0), 0), totalIncentiveEarned: activeAgents.reduce((sum, agent) => sum + Number(agent.performance.incentivesEarned ?? 0), 0) },
    periodComparison: { today: buildPeriodSummary(transactions, ranges.today), yesterday: buildPeriodSummary(transactions, ranges.yesterday), thisWeek: buildPeriodSummary(transactions, ranges.thisWeek), lastWeek: buildPeriodSummary(transactions, ranges.lastWeek), thisMonth: buildPeriodSummary(transactions, ranges.thisMonth), lastMonth: buildPeriodSummary(transactions, ranges.lastMonth) },
    trends: buildTrends(transactions, ranges),
    achievementBuckets,
    payoutDistribution,
    orgAlerts: buildOrgAlerts(activeAgents, tlTotals),
    dateIndex: { byDate: buildDateIndex(transactions, "day"), byWeek: buildDateIndex(transactions, "week"), byMonth: buildDateIndex(transactions, "month") },
    lookupMaps: { byTL: buildLookupMap(activeAgents, "tlName"), byLocation: buildLookupMap(activeAgents, "location"), byGrade: buildLookupMap(activeAgents, "grade"), byEligibility: buildLookupMap(activeAgents, "eligibility"), byPlanType: buildPlanTypeLookup(activeAgents) },
  };
}

/**
 * Builds per-agent alerts.
 */
function buildAgentAlerts(achPercent: number, eligibility: string, thisWeekSales: number, drrValue: number): AlertItem[] {
  const alerts: AlertItem[] = [];
  if (achPercent < 50) alerts.push({ type: "low_performance", message: "Achievement below 50%.", severity: "critical" });
  if (eligibility === "Not Eligible") alerts.push({ type: "not_eligible", message: "Not eligible for payout.", severity: "warning" });
  if (thisWeekSales === 0) alerts.push({ type: "no_sale_week", message: "No sale recorded this week.", severity: "warning" });
  if (drrValue > 5) alerts.push({ type: "high_drr", message: `Need ${drrValue} sales per day to recover.`, severity: "info" });
  return alerts;
}

/**
 * Builds dashboard quick stats for TLs.
 */
function buildQuickStats(team: Team | null) {
  if (!team) return null;
  return { teamRank: team.rank, totalSold: Number(team.totals.totalSold ?? 0), achPercent: cleanString(team.performance.achPercent as Cell), activeAgents: Number(team.totals.activeCount ?? 0), drr: Number(team.performance.drr ?? 0) };
}

/**
 * Builds the lightweight team summaries used on the TL team page.
 */
function summarizeTeam(team: Team) {
  return { tlName: team.tlName, rank: team.rank, location: team.location, performance: team.performance, totals: team.totals };
}

/**
 * Builds a lightweight agent directory entry for analytics filtering and drawers.
 */
function summarizeAgentForAnalytics(agent: Agent) {
  return {
    empId: agent.empId,
    email: agent.email,
    tlName: agent.tlName,
    location: agent.location,
    grade: agent.grade,
    status: agent.status,
    saleCode: agent.saleCode,
    performance: agent.performance,
    appraisal: agent.appraisal,
    customers: agent.customers,
    salesSummary: agent.salesSummary,
    alerts: agent.alerts,
    trend: agent.trend,
  };
}

/**
 * Resolves a TL team by appraisal name and team name match.
 */
function resolveTeamForTl(appraisals: RawRow[], email: string, teams: Team[]) {
  const appraisalName = cleanString(appraisals.find((row) => normalizeEmail(row[3]) === email)?.[1]).toLowerCase();
  return teams.find((team) => team.tlName.toLowerCase() === appraisalName) ?? null;
}

/**
 * Normalizes email-like values.
 */
function normalizeEmail(value: Cell) {
  return cleanString(value).toLowerCase();
}

/**
 * Converts a cell to a trimmed string.
 */
function cleanString(value: Cell) {
  return String(value ?? "").trim();
}

/**
 * Converts short month names into month numbers.
 */
function monthNumber(value: string) {
  return ({ jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" } as Record<string, string>)[value.toLowerCase()] ?? null;
}

/**
 * Formats a date as YYYY-MM-DD.
 */
function toDateKey(value: Date) {
  return `${value.getFullYear()}-${`${value.getMonth() + 1}`.padStart(2, "0")}-${`${value.getDate()}`.padStart(2, "0")}`;
}

/**
 * Builds an ISO-like week key.
 */
function weekKey(date: string) {
  const current = new Date(`${date}T00:00:00`);
  const day = current.getDay() === 0 ? 7 : current.getDay();
  current.setDate(current.getDate() + 4 - day);
  const yearStart = new Date(current.getFullYear(), 0, 1);
  const week = Math.ceil((((current.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${current.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/**
 * Builds a safe growth string.
 */
function growthString(current: number, previous: number) {
  if (!previous) return current ? "N/A" : "0%";
  return `${Math.round(((current - previous) / previous) * 100)}%`;
}

/**
 * Normalizes meta values.
 */
function safeMeta(meta: RawData["meta"]) {
  return { fetchedAt: meta?.fetchedAt ?? new Date().toISOString() };
}
