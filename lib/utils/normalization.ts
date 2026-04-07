import type { SalesRow, AgentRow } from '@/lib/types/dashboard';

export const THRESHOLDS = {
  TARGET_VALUE: 10000,
  HIGH_VALUE: 50000,
  LEVEL_1: 10000,     // Alias for 10K
  LEVEL_2: 50000,     // Alias for 50K
  TARGET_UNITS: 30,   // Default monthly target units
};

/**
 * Normalizes a raw data row from Google Sheets into a structured SalesRow.
 * Handles dynamic mapping and ensures type safety.
 */
export function normalizeSalesRow(row: Record<string, any>): SalesRow {
  return {
    phone: String(row.phone || row['Phone Number'] || row.phone_no || ''),
    salesCode: String(row.salesCode || row['Sales Code'] || row.txn_id || ''),
    planDate: String(row.planDate || row['Plan Date'] || row.date || ''),
    planCost: Number(row.planCost || row['Plan Cost'] || row.price || 0),
    planType: String(row.planType || row['Plan Type'] || ''),
    agentEmail: String(row.agentEmail || row['Agent Email'] || row.email || '').toLowerCase(),
    agentName: String(row.agentName || row['Agent Name'] || ''),
    tlName: String(row.tlName || row['TL Name'] || ''),
    location: String(row.location || row['Location'] || ''),
    month: String(row.month || row['Month'] || ''),
    channel: String(row.channel || row['Channel'] || ''),
    autoPayPoint: Number(row.autoPayPoint || 0),
    totalPoints: Number(row.totalPoints || row.points || 0),
    achievementPercent: Number(row.achievementPercent || 0),
    finalSalesPoints: Number(row.finalSalesPoints || 0),
    transactionType: String(row.transactionType || row.type || 'Sale'),
    txnBucket: String(row.txnBucket || row['Bucket'] || ''),
  };
}

/**
 * Standard utility for rounding metrics to integers to ensure a clean UI.
 */
export const roundMetric = (val: number | string | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? 0 : Math.round(n);
};

/**
 * Calculations for Target Breakdown with safety checks.
 */
export interface TargetStats {
  target: number;
  achieved: number;
  remaining: number;
  drr: number;
  percent: number;
}

export function calculateTargetStats(target: number, achieved: number, daysLeft: number): TargetStats {
  const remaining = Math.max(0, target - achieved);
  const drr = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;
  
  return {
    target: Math.round(target),
    achieved: Math.round(achieved),
    remaining: Math.round(remaining),
    drr: Math.round(drr),
    percent: target > 0 ? Math.round((achieved / target) * 100) : 0
  };
}

/**
 * PREPARE CHART DATA
 * Aggregates daily counts for a specific threshold.
 */
export interface ChartDataItem {
  date: string;
  count: number;
}

export function prepareThresholdChartData(sales: SalesRow[], threshold: number): ChartDataItem[] {
  const dailyMap: Record<string, number> = {};
  
  sales.forEach(s => {
    if (s.planCost >= threshold) {
      const date = s.planDate;
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    }
  });

  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: date.split('-').slice(1).reverse().join(' '), // simple format DD MM
      count
    }));
}
