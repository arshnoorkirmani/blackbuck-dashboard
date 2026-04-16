import type { UserRole } from "@/lib/types/dashboard";
import { parseAppraisalSheet, resolveTLNames } from "@/lib/parsers/parseAppraisalSheet";

export function resolveUserRole(
  sessionRole: UserRole,
  userEmail: string,
  agentRows: string[][],
  appraisalRows: string[][]
): UserRole {
  if (sessionRole === "SUPER_ADMIN") {
    return "SUPER_ADMIN";
  }

  if (sessionRole === "ADMIN") {
    return "ADMIN";
  }

  const normalizedEmail = userEmail.toLowerCase().trim();
  if (!normalizedEmail) {
    return "AGENT";
  }

  const appraisal = parseAppraisalSheet(appraisalRows);
  const uniqueTLNames = [...new Set(agentRows.slice(2).map((row) => String(row[2] ?? "").trim()).filter(Boolean))];
  const tlNames = resolveTLNames(normalizedEmail, appraisal, uniqueTLNames);

  return tlNames && tlNames.length > 0 ? "TL" : "AGENT";
}
