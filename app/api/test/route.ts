import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { processData } from "@/lib/dataProcessor";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import type { UserRole } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TestView = "dashboard" | "team" | "analytics";

function normalizeView(value: string | null): TestView {
  if (value === "team" || value === "analytics") {
    return value;
  }
  return "dashboard";
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const sessionRole = (session.role as UserRole) ?? "AGENT";
    const rawPayload = await loadDashboardRawData(session);
    const role = resolveUserRole(sessionRole, email, rawPayload.agentRaw as string[][], rawPayload.appraisalRaw as string[][]);
    const view = normalizeView(req.nextUrl.searchParams.get("view"));
    const processed = processData(
      { role, meta: { fetchedAt: new Date().toISOString() }, data: rawPayload },
      view,
      email
    );

    return NextResponse.json({
      ok: true,
      view,
      role,
      meta: {
        fetchedAt: new Date().toISOString(),
        counts: {
          agentRows: rawPayload.agentRaw.length,
          tlRows: rawPayload.tlRaw.length,
          salesRows: rawPayload.rawSalesRaw.length,
          teleSalesRows: rawPayload.teleSalesRaw.length,
        },
      },
      snapshot: processed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
