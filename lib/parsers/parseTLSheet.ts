import type { TLSummaryRow } from "@/lib/types/dashboard";

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
 * Parse the "Team lead level" tab.
 *
 * The Team lead level sheet has merged header cells across rows 0-2.
 * Scan rows to find the first row that contains a recognizable TL name column.
 */
export function parseTLSheet(raw: string[][]): TLSummaryRow[] {
  if (!raw || raw.length < 2) return [];

  // Find the header row — look for a row that has "tl" or "team lead" or "name"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(6, raw.length); i++) {
    const rowLower = raw[i].join("|").toLowerCase();
    if (
      rowLower.includes("tl name") ||
      rowLower.includes("team lead") ||
      rowLower.includes("emp name") ||
      rowLower.includes("emp_name")
    ) {
      headerRowIdx = i;
      break;
    }
  }

  // If no recognizable header — try row 0 as fallback
  if (headerRowIdx === -1) headerRowIdx = 0;

  const headers = raw[headerRowIdx];

  const COL = {
    tlName:          findCol(headers, ["tl name", "tlname", "team lead", "name", "emp name"]),
    totalTarget:     findCol(headers, ["total target", "target", "plan sale target"]),
    totalSold:       findCol(headers, ["total sold", "plan sold", "sold"]),
    totalPoints:     findCol(headers, ["total sale point", "total point", "sale point", "points"]),
    percentAchieved: findCol(headers, ["% ach", "% achieve", "percent achieve", "achievement"]),
    converted10k:    findCol(headers, ["10k", "10,000", ">10k converted", "converted"]),
    required:        findCol(headers, ["pending", "required", "remaining"]),
    drr:             findCol(headers, ["drr", "daily"]),
  };

  const rows: TLSummaryRow[] = [];

  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i];
    const tlName = str(row[COL.tlName]);

    if (
      !tlName ||
      tlName.toLowerCase().includes("total") ||
      tlName.toLowerCase().includes("grand") ||
      tlName.toLowerCase().includes("location") ||
      tlName === ""
    ) {
      continue;
    }

    const totalSold = num(row[COL.totalSold]);
    const totalTarget = num(row[COL.totalTarget]);

    let percentAchieved = COL.percentAchieved !== -1 ? num(row[COL.percentAchieved]) : 0;
    if (percentAchieved === 0 && totalTarget > 0) {
      percentAchieved = parseFloat(((totalSold / totalTarget) * 100).toFixed(2));
    }

    rows.push({
      tlName,
      totalTarget,
      totalSold,
      totalPoints:    num(row[COL.totalPoints]),
      percentAchieved,
      converted10k:   num(row[COL.converted10k]),
      required:       num(row[COL.required]),
      drr:            num(row[COL.drr]),
    });
  }

  return rows;
}
