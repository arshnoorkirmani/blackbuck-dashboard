import type { IncentiveRule } from "@/lib/types/dashboard";

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
 * Parse the "Calculation" (incentive rules) tab.
 * Row 0 is expected to be the header row.
 */
export function parseIncentiveSheet(raw: string[][]): IncentiveRule[] {
  if (!raw || raw.length < 2) return [];

  const headers = raw[0];

  const COL = {
    slab:             findCol(headers, ["slab", "tier", "band"]),
    incentivePerSale: findCol(headers, ["incentive per sale", "per sale", "rate"]),
    payoutFactor:     findCol(headers, ["payout factor", "factor", "multiplier"]),
    minSales:         findCol(headers, ["min sale", "minimum", "threshold"]),
  };

  const rules: IncentiveRule[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const slab = str(row[COL.slab]);
    if (!slab) continue;

    rules.push({
      slab,
      incentivePerSale: num(row[COL.incentivePerSale]),
      payoutFactor:     num(row[COL.payoutFactor]),
      minSales:         num(row[COL.minSales]),
    });
  }

  return rules;
}
