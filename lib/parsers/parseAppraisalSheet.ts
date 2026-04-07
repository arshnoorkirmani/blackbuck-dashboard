import type { AppraisalRow } from "@/lib/types/dashboard";

function findCol(headers: string[], candidates: string[]): number {
  const normalised = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = normalised.findIndex((h) => h.includes(c.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

function str(val: string | undefined): string {
  return (val ?? "").trim();
}

/**
 * Parse the "New EMP ID" (employee roster) tab.
 *
 * Actual headers (from debug):
 *   Emp ID | Emp Name | Phone no | email id | New emp id
 *
 * NOTE: This sheet does NOT have TL Name, Grade, Location, or Role columns.
 * TL resolution must be done via the Agent sheet's tlName column instead.
 */
export function parseAppraisalSheet(raw: string[][]): AppraisalRow[] {
  if (!raw || raw.length < 2) return [];

  const headers = raw[0];

  const COL = {
    empId:    findCol(headers, ["emp id", "emp_id", "empid", "employee id"]),
    name:     findCol(headers, ["emp name", "name", "employee name"]),
    email:    findCol(headers, ["email id", "email_id", "email", "mail id"]),
    role:     findCol(headers, ["role", "designation", "position"]),
    tlName:   findCol(headers, ["tl name", "team lead", "tl"]),
    grade:    findCol(headers, ["grade"]),
    location: findCol(headers, ["location", "zone", "city"]),
  };

  const rows: AppraisalRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const empId = str(row[COL.empId]);
    const email = str(row[COL.email]);
    if (!empId && !email) continue;

    rows.push({
      empId,
      name:     str(row[COL.name]),
      email,
      role:     str(row[COL.role]),      // likely empty for this sheet
      tlName:   str(row[COL.tlName]),    // likely empty for this sheet
      grade:    str(row[COL.grade]),     // likely empty for this sheet
      location: str(row[COL.location]), // likely empty for this sheet
    });
  }

  return rows;
}

/**
 * Given a user email and the parsed appraisal rows, determine if this user
 * is a Team Lead. Returns their TL name(s) as they appear in the agent sheet.
 *
 * Since "New EMP ID" sheet doesn't have TL info, this function also accepts
 * an optional agentRows array to check if the user's email appears as a TL
 * in the agent sheet's tlName column.
 *
 * For this project: TL detection is done by checking if the user's NAME appears
 * in any agent row's tlName column. The user's name comes from the appraisal sheet.
 */
export function resolveTLNames(
  userEmail: string,
  appraisal: AppraisalRow[],
  agentTlNames?: string[]  // all unique TL names from the agent sheet
): string[] | null {
  const emailLower = userEmail.toLowerCase();

  // First try: find the user's name from appraisal sheet, check if it appears as a TL
  const myRow = appraisal.find((r) => r.email.toLowerCase() === emailLower);

  if (myRow) {
    // Check if their role says TL
    const roleLower = myRow.role.toLowerCase();
    const isTL =
      roleLower.includes("tl") ||
      roleLower.includes("team lead") ||
      roleLower.includes("team_lead") ||
      roleLower.includes("manager");

    if (isTL) {
      const names = new Set<string>();
      if (myRow.tlName) names.add(myRow.tlName);
      if (myRow.name) names.add(myRow.name);
      return names.size > 0 ? Array.from(names) : null;
    }

    // Even without role field, check if their name appears in the agent sheet's TL column
    if (myRow.name && agentTlNames) {
      const nameLower = myRow.name.toLowerCase();
      const matchedTLName = agentTlNames.find(
        (tl) => tl.toLowerCase() === nameLower
      );
      if (matchedTLName) return [matchedTLName];
    }
  }

  return null;
}
