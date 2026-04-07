import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSheetData } from "@/lib/google";

export const dynamic = "force-dynamic";

/**
 * GET /api/debug-headers?sheetId=...
 * Returns the first 2 rows (headers + sample data) from all 6 tabs.
 * TEMPORARY — delete after fixing parsers.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get("sheetId") ?? "19-8yw-lVlhg_uM_nN2jegiddX5c-cEU9gS73gZf-G50";

    const tabs = [
      "Agent level - Plan Sale",
      "Team lead level",
      "Dump- Plan Sale",
      "Tele - Plan Sold(10k)",
      "Calculation",
      "New EMP ID",
    ];

    const results: Record<string, { headers: string[]; row1: string[] }> = {};

    for (const tab of tabs) {
      try {
        const raw = await getSheetData(session.accessToken, sheetId, tab);
        results[tab] = {
          headers: raw[0] ?? [],
          row1: raw[1] ?? [],
        };
      } catch (e: unknown) {
        results[tab] = {
          headers: [`ERROR: ${e instanceof Error ? e.message : "Unknown"}`],
          row1: [],
        };
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
