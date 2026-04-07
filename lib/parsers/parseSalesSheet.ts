import type { SalesRow } from "@/lib/types/dashboard";
import { parse, isValid, format } from "date-fns";

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

function parseDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const formats = [
    "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd",
    "dd-MM-yyyy", "MM/dd/yyyy", "dd MMM yyyy",
    "d MMM yyyy", "d-MMMM-yy", "d-MMMM-yyyy",
    "dd-MMM-yy", "dd-MMM-yyyy",
  ];

  for (const fmt of formats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  }

  const d = new Date(trimmed);
  if (isValid(d)) return format(d, "yyyy-MM-dd");

  return trimmed;
}

/**
 * Parse a sales dump tab.
 * Works for both "Dump- Plan Sale" and "Tele - Plan Sold(10k)".
 *
 * Dump- Plan Sale actual headers (row 0):
 *   Status | Week | Headcount | Date | Location | EMP_ID | Email_ID | EMP_Name |
 *   Team Leader | Tenurity | Grade | ... | Total Sold | Sale Points | ...
 *
 * Tele - Plan Sold(10k) actual headers (row 0):
 *   phone_no | sales_code | plan_sold_date | fuel_plan_cost | fuel_plan_type |
 *   Sale Point | Agent Name | TL Name | Month | Channel | Auto Pay Point | Total Points
 */
export function parseSalesSheet(raw: string[][]): SalesRow[] {
  if (!raw || raw.length < 2) return [];

  const headers = raw[0];

  const COL = {
    phone:              findCol(headers, ["phone_no", "phone", "mobile", "number"]),
    salesCode:          findCol(headers, ["sales_code", "sales code", "code", "plan code"]),
    planDate:           findCol(headers, ["plan_sold_date", "plan date", "date", "sale date"]),
    planCost:           findCol(headers, ["fuel_plan_cost", "plan cost", "amount", "cost"]),
    planType:           findCol(headers, ["fuel_plan_type", "plan type", "type"]),
    agentEmail:         findCol(headers, ["email_id", "agent email", "agent mail", "email"]),
    agentName:          findCol(headers, ["agent_name", "agent name", "name"]),
    tlName:             findCol(headers, ["team leader", "tl name", "tl"]),
    location:           findCol(headers, ["location", "zone", "city", "auto pay point"]),
    month:              findCol(headers, ["month"]),
    channel:            findCol(headers, ["channel"]),
    autoPayPoint:       findCol(headers, ["auto pay point", "autopay", "auto pay"]),
    totalPoints:        findCol(headers, ["total points", "total sale point", "total point", "sale point"]),
    achievementPercent: findCol(headers, ["achievement %", "achievement", "percent achieved", "achieve"]),
    finalSalesPoints:   findCol(headers, ["final sales points", "final sale point", "final point"]),
    transactionType:    findCol(headers, ["transaction / recharge", "txn type", "transaction type", "recharge"]),
    txnBucket:          findCol(headers, ["txn bucket", "bucket", "range"]),
  };

  // For "Tele" sheet, location is "Auto Pay Point" column which has city names like "Bangalore"
  // But we want the actual location — for Tele sheet there's no location column; use empty string
  // Detect which sheet we're in based on presence of "location" in headers
  const hasLocationCol = headers.some(h => h.trim().toLowerCase() === "location");
  const locationCol = hasLocationCol ? findCol(headers, ["location"]) : -1;

  const rows: SalesRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];

    // Determine date column — try plan date candidates
    const dateStr =
      COL.planDate !== -1 ? str(row[COL.planDate]) : "";

    if (!dateStr) continue; // skip rows without a date

    // Get location: prefer explicit location col, then "auto pay point" col (which has city in tele sheet)
    let location = "";
    if (locationCol !== -1) {
      location = str(row[locationCol]);
    } else if (COL.autoPayPoint !== -1) {
      // In Tele sheet, auto pay point column often contains city name like "Bangalore"
      const val = str(row[COL.autoPayPoint]);
      // Only use as location if it looks like a city (non-numeric)
      if (val && isNaN(Number(val))) location = val;
    }

    rows.push({
      phone:              str(row[COL.phone]),
      salesCode:          str(row[COL.salesCode]),
      planDate:           parseDate(dateStr),
      planCost:           num(row[COL.planCost]),
      planType:           str(row[COL.planType]),
      agentEmail:         str(row[COL.agentEmail]),
      agentName:          str(row[COL.agentName]),
      tlName:             str(row[COL.tlName]),
      location,
      month:              str(row[COL.month]),
      channel:            str(row[COL.channel]),
      autoPayPoint:       num(row[COL.autoPayPoint]),
      totalPoints:        num(row[COL.totalPoints]),
      achievementPercent: num(row[COL.achievementPercent]),
      finalSalesPoints:   num(row[COL.finalSalesPoints]),
      transactionType:    str(row[COL.transactionType]),
      txnBucket:          str(row[COL.txnBucket]),
    });
  }

  return rows;
}
