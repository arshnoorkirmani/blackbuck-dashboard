// ─── Role ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "TL" | "AGENT";

// ─── Dashboard Configuration (stored in MongoDB) ──────────────────────────────

export interface DashboardTabConfig {
  agent: string;      // e.g. "Agent level - Plan Sale"
  tl: string;         // e.g. "Team lead level"
  rawSales: string;   // e.g. "Dump- Plan Sale"
  teleSales: string;  // e.g. "Tele - Plan Sold(10k)"
  incentive: string;  // e.g. "Calculation"
  appraisal: string;  // e.g. "New EMP ID"
  incentiveStructure: string;
  employeeInfo: string;
}

export interface DashboardConfig {
  sheetUrl: string;
  tabs: DashboardTabConfig;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  sheetUrl: "",
  tabs: {
    agent: "Agent level - Plan Sale",
    tl: "Team lead level",
    rawSales: "Dump- Plan Sale",
    teleSales: "Tele - Plan Sold(10k)",
    incentive: "Calculation",
    appraisal: "Appraisal Tracker",
    incentiveStructure: "Incentive Structure",
    employeeInfo: "Overall HC Dec'25",
  },
};

// ─── Per-Tab Row Types ────────────────────────────────────────────────────────

export interface AgentRow {
  empId: string;
  emailId: string;
  tlName: string;
  tenure: string;
  grade: string;
  location: string;
  presentDays: number;
  talktime: number;
  completedCalls: number;
  planTarget: number;
  bonus: number;
  superBonus: number;
  totalSold: number;
  salePoints: number;
  percentAchieved: number;
  slab: string;
  incentivesEarned: number;
  payoutFactor: number;
  finalPayout: number;
}

export interface TLSummaryRow {
  tlName: string;
  totalTarget: number;
  totalSold: number;
  totalPoints: number;
  percentAchieved: number;
  converted10k: number;
  required: number;
  drr: number;
}

export interface SalesRow {
  phone: string;
  salesCode: string;
  planDate: string;       // ISO date string "YYYY-MM-DD"
  planCost: number;
  planType: string;
  agentEmail: string;
  agentName: string;
  tlName: string;
  location: string;
  month: string;
  channel: string;
  autoPayPoint: number;
  totalPoints: number;
  achievementPercent: number;
  finalSalesPoints: number;
  transactionType: string; // Transaction / Recharge
  txnBucket: string;      // Txn Bucket
}

export interface AgentRecord extends AgentRow {
  achievementPercent: number;
  finalSalesPoints: number;
  txnBucket: string;
}

export interface IncentiveRule {
  slab: string;
  incentivePerSale: number;
  payoutFactor: number;
  minSales: number;
}

export interface AppraisalRow {
  empId: string;
  name: string;
  email: string;
  role: string;
  tlName: string;
  grade: string;
  location: string;
}

// ─── Aggregated Output Types ──────────────────────────────────────────────────

export interface DashboardKPIs {
  totalSales: number;
  totalPoints: number;
  avgAchievement: number;    // percentage, e.g. 87.3
  totalIncentives: number;   // sum of finalPayout across all agents
}

export interface SalesTrendPoint {
  date: string;   // "DD MMM" for display
  sales: number;
  points: number;
}

export interface ZoneDistributionItem {
  zone: string;
  count: number;
  percentage: number;
}

export interface AgentPerformance {
  name: string;
  achieved: number;
  target: number;
}

export interface DashboardMainData {
  kpis: DashboardKPIs;
  agents: AgentRow[];
  tlSummary: TLSummaryRow[];
  salesTrend: SalesTrendPoint[];
  zoneDistribution: ZoneDistributionItem[];
  agentPerformance: AgentPerformance[];
  rawSales: SalesRow[];
}
