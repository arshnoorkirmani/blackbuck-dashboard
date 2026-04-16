"use client";

import { useMemo, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldCheck, SlidersHorizontal, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { formatPercentValue } from "@/lib/view-models/operations";
import { DataTableShell, EmptyStatePanel, WorkspaceHero } from "@/components/workspace/primitives";
import { StatCard } from "@/components/workspace/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PermissionSet = {
  canSearchAgents?: boolean;
  canExportData?: boolean;
  canViewAdvancedAnalytics?: boolean;
  canManageTeamMembers?: boolean;
  canManageDashboardConfig?: boolean;
  canManageUsers?: boolean;
  canViewSensitivePayouts?: boolean;
  canChangePermissions?: boolean;
};

type ManagedUser = {
  email: string;
  name?: string;
  role?: string;
  employeeId?: string;
  tlName?: string;
  location?: string;
  status?: string;
  isActive?: boolean;
  notes?: string;
  permissions?: PermissionSet;
};

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[2rem]" />
        ))}
      </div>
      <Skeleton className="h-[560px] rounded-[2rem]" />
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [isPending, startTransition] = useTransition();

  const usersQuery = useQuery<{ users: ManagedUser[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "Unable to load users" }));
        throw new Error(payload.error || "Unable to load users");
      }
      return res.json();
    },
    staleTime: 30_000,
  });

  const users = useMemo(() => (usersQuery.data?.users ? [...usersQuery.data.users] : []), [usersQuery.data?.users]);
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = selectedRole === "all" || String(user.role ?? "AGENT") === selectedRole;
      const matchesSearch =
        !query ||
        user.email.toLowerCase().includes(query) ||
        String(user.employeeId ?? "").toLowerCase().includes(query) ||
        String(user.name ?? "").toLowerCase().includes(query) ||
        String(user.tlName ?? "").toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [search, selectedRole, users]);

  const updateUser = (email: string, patch: Partial<ManagedUser>) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, ...patch }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({ error: "Unable to update user" }));
          throw new Error(payload.error || "Unable to update user");
        }

        await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        toast.success("User access updated");
      } catch (updateError) {
        toast.error(updateError instanceof Error ? updateError.message : "Unable to update user");
      }
    });
  };

  if (usersQuery.isLoading) {
    return <AdminSkeleton />;
  }

  if (usersQuery.error) {
    return (
      <EmptyStatePanel
        title="Super admin data unavailable"
        description={usersQuery.error instanceof Error ? usersQuery.error.message : "Super admin data could not be loaded."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="Super admin control center"
        title="Manage roles, permissions, and operational access"
        description="Govern user access from one professional console that connects database-backed permissions with sheet-derived employee context."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Live permission edits
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              DB + Sheets sync
            </Badge>
          </div>
        }
        actions={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Default admin flow</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Environment-backed</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Permission model</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Role + toggle based</p>
              </div>
            </CardContent>
          </Card>
        }
        aside={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                Default super admin credentials are read from the server environment and the account is bootstrapped automatically.
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                Toggle updates are applied live and reflected across admin, TL, dashboard, and settings surfaces.
              </div>
            </CardContent>
          </Card>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Managed users"
          value={users.length}
          description="Profiles available in access control"
          icon={Users}
          tone="blue"
        />
        <StatCard
          title="Super admins"
          value={users.filter((user) => user.role === "SUPER_ADMIN").length}
          description="Credential-based control users"
          icon={Shield}
          tone="rose"
        />
        <StatCard
          title="TL managers"
          value={users.filter((user) => user.role === "TL").length}
          description="Team leads with governance rules"
          icon={UserCog}
          tone="amber"
        />
        <StatCard
          title="Permission writers"
          value={users.filter((user) => user.permissions?.canChangePermissions).length}
          description={`${formatPercentValue(users.length ? (users.filter((user) => user.permissions?.canChangePermissions).length / users.length) * 100 : 0)} of roster`}
          icon={ShieldCheck}
          tone="green"
        />
      </div>

      <DataTableShell
        title="User and permission dashboard"
        description="Search every user, adjust roles, and control permission flags without leaving the governance workspace."
        toolbar={
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, employee ID, or TL"
              className="w-full rounded-2xl md:w-[320px]"
            />
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full rounded-2xl md:w-[220px]">
                <SlidersHorizontal className="mr-2 size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TL">TL</SelectItem>
                <SelectItem value="AGENT">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {!filteredUsers.length ? (
          <EmptyStatePanel
            title="No users match this filter"
            description="Adjust the role filter or search query to restore the management table."
          />
        ) : (
          <div className="dashboard-scroll-shell max-h-[38rem] overflow-auto rounded-[1.5rem] border border-border/70">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <TableRow className="bg-card/95 hover:bg-card/95">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Team Mgmt</TableHead>
                  <TableHead>Settings</TableHead>
                  <TableHead>Permission Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{user.name || user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.employeeId || "No emp ID"} - {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(user.role ?? "AGENT")}
                        onValueChange={(value) => updateUser(user.email, { role: value })}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[160px] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="TL">TL</SelectItem>
                          <SelectItem value="AGENT">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{user.tlName || "-"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={user.isActive !== false}
                        onCheckedChange={(checked) => updateUser(user.email, { isActive: checked })}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(user.permissions?.canManageTeamMembers)}
                        onCheckedChange={(checked) =>
                          updateUser(user.email, {
                            permissions: { ...user.permissions, canManageTeamMembers: checked },
                          })
                        }
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(user.permissions?.canManageDashboardConfig)}
                        onCheckedChange={(checked) =>
                          updateUser(user.email, {
                            permissions: { ...user.permissions, canManageDashboardConfig: checked },
                          })
                        }
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(user.permissions?.canChangePermissions)}
                        onCheckedChange={(checked) =>
                          updateUser(user.email, {
                            permissions: { ...user.permissions, canChangePermissions: checked },
                          })
                        }
                        disabled={isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
