import type { AgentRow } from "@/lib/types/dashboard";

function findCol(headers: string[], candidates: string[]): number {
  const normalised = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = normalised.findIndex((h) => h.includes(c.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function num(val: string | undefined): number {
  const n = parseFloat((val ?? "").replace(/[,%₹]/g, "").trim());
  return isNaN(n) ? 0 : n;
}

function str(val: string | undefined): string {
  return (val ?? "").trim();
}

/**
 * Parse the "Agent level - Plan Sale" tab.
 *
 * IMPORTANT: Row 0 in this sheet is a summary/totals row with numbers, NOT headers.
 * Actual column headers are in Row 1. Data rows start at Row 2.
 *
 * Actual headers (from debug):
 * EMP_ID | EMP_Email ID | Tl Name | DOJ | Oct'25 Tenurity | Grade | Status |
 * Present Days | WFH- Attendance | Att% | Talktime | Quality | Completed Calls |
 * Plan Sale Target | BONUS | SUPER_BONUS | SUPER_BONUS_PLUS | Monthly Plan Sold |
 * Total Sold | Sale Point Ach | Monthly Plan Sold | Total Sale Point | % Ach | Slab |
 * Incentives Earned | >5k Funnel | >10k Converted | >10k % Ach | Payout Factor | Final Payout
 */
export function parseAgentSheet(raw: string[][]): AgentRow[] {
  if (!raw || raw.length < 3) return [];

  // Find the actual header row by scanning the first 5 rows for the row containing "EMP_ID" or "EMP ID"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const rowStr = raw[i].join(" ").toLowerCase();
    if (rowStr.includes("emp_id") || rowStr.includes("emp id") || rowStr.includes("emp  id")) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return []; // couldn't find headers

  const headers = raw[headerRowIdx];

  const COL = {
    empId:            findCol(headers, ["emp_id", "emp id", "empid", "employee id"]),
    emailId:          findCol(headers, ["emp_email", "email id", "emailid", "email"]),
    tlName:           findCol(headers, ["tl name", "tlname", "team lead"]),
    tenure:           findCol(headers, ["tenurity", "tenure"]),
    grade:            findCol(headers, ["grade"]),
    location:         findCol(headers, ["location", "zone", "city"]),
    presentDays:      findCol(headers, ["present days", "present day", "attendance"]),
    talktime:         findCol(headers, ["talktime", "talk time"]),
    completedCalls:   findCol(headers, ["completed calls", "completed call", "total call"]),
    planTarget:       findCol(headers, ["plan sale target", "plan target", "target", "monthly target"]),
    bonus:            findCol(headers, ["bonus"]),
    superBonus:       findCol(headers, ["super_bonus", "super bonus"]),
    totalSold:        findCol(headers, ["total sold"]),
    salePoints:       findCol(headers, ["total sale point", "sale point ach", "sale point", "points"]),
    percentAchieved:  findCol(headers, ["% ach", "% achieve", "percent achieve", "achievement"]),
    slab:             findCol(headers, ["slab"]),
    incentivesEarned: findCol(headers, ["incentives earned", "incentive earn"]),
    payoutFactor:     findCol(headers, ["payout factor"]),
    finalPayout:      findCol(headers, ["final payout"]),
  };

  const rows: AgentRow[] = [];

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i];

    const empId = str(row[COL.empId]);
    // Skip blank/summary rows
    if (!empId || empId.toLowerCase().includes("total") || empId.toLowerCase().includes("grand")) {
      continue;
    }

    const totalSold = num(row[COL.totalSold]);
    const planTarget = num(row[COL.planTarget]);

    let percentAchieved = COL.percentAchieved !== -1 ? num(row[COL.percentAchieved]) : 0;
    if (percentAchieved === 0 && planTarget > 0) {
      percentAchieved = parseFloat(((totalSold / planTarget) * 100).toFixed(2));
    }

    rows.push({
      empId,
      emailId:          str(row[COL.emailId]),
      tlName:           str(row[COL.tlName]),
      tenure:           str(row[COL.tenure]),
      grade:            str(row[COL.grade]),
      location:         str(row[COL.location]),
      presentDays:      num(row[COL.presentDays]),
      talktime:         num(row[COL.talktime]),
      completedCalls:   num(row[COL.completedCalls]),
      planTarget,
      bonus:            num(row[COL.bonus]),
      superBonus:       num(row[COL.superBonus]),
      totalSold,
      salePoints:       num(row[COL.salePoints]),
      percentAchieved,
      slab:             str(row[COL.slab]),
      incentivesEarned: num(row[COL.incentivesEarned]),
      payoutFactor:     num(row[COL.payoutFactor]),
      finalPayout:      num(row[COL.finalPayout]),
    });
  }

  return rows;
}
