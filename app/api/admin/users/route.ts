import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAccessProfiles, upsertAccessProfile } from "@/lib/services/access.service";
import { loadDashboardRawData } from "@/lib/server/dashboard-data";
import { processData } from "@/lib/dataProcessor";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
import type { UserRole } from "@/lib/types/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function canManage(role?: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session.role as UserRole) ?? "AGENT";
    if (!canManage(sessionRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const email = session.user.email.toLowerCase();
    const rawPayload = await loadDashboardRawData(session);
    const effectiveRole = resolveUserRole(sessionRole, email, rawPayload.agentRaw as string[][], rawPayload.appraisalRaw as string[][]);
    const analyticsPayload = processData(
      { role: effectiveRole, meta: { fetchedAt: new Date().toISOString() }, data: rawPayload },
      "dashboard",
      email
    ) as {
      allTeams?: Array<{
        tlName: string;
        agents?: Array<{ empId: string; email: string; tlName: string; status?: string; location?: string }>;
      }>;
    };

    const directory =
      analyticsPayload.allTeams?.flatMap((team) =>
        (team.agents ?? []).map((agent) => ({
          email: agent.email,
          employeeId: agent.empId,
          tlName: agent.tlName,
          status: agent.status ?? "Active",
          location: agent.location ?? "",
        }))
      ) ?? [];

    const accessProfiles = await listAccessProfiles();
    const mergedUsers = new Map<string, Record<string, unknown>>();

    for (const profile of accessProfiles) {
      mergedUsers.set(profile.email, { ...profile });
    }

    for (const person of directory) {
      const existing = mergedUsers.get(person.email) ?? {};
      mergedUsers.set(person.email, {
        ...existing,
        email: person.email,
        employeeId: person.employeeId,
        tlName: person.tlName,
        status: person.status,
        location: person.location,
      });
    }

    return NextResponse.json({
      users: [...mergedUsers.values()].sort((left, right) => String(left.email).localeCompare(String(right.email))),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionRole = (session.role as UserRole) ?? "AGENT";
    if (!canManage(sessionRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await upsertAccessProfile({
      email: body.email,
      name: body.name,
      role: body.role,
      isActive: body.isActive,
      employeeId: body.employeeId,
      tlName: body.tlName,
      notes: body.notes,
      permissions: body.permissions,
      managedBy: session.user.email,
    });

    return NextResponse.json({ user: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
