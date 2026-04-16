"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, ShieldCheck, Target, TrendingUp, UserCog, Users } from "lucide-react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { formatCurrencyValue, formatPercentValue } from "@/lib/view-models/operations";
import { EmptyStatePanel, DataTableShell, PermissionStateBanner, WorkspaceHero } from "@/components/workspace/primitives";
import { StatCard } from "@/components/workspace/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TeamAgent = {
  empId: string;
  email: string;
  tlName: string;
  location?: string;
  status?: string;
  appraisal?: { name?: string } | null;
  performance: {
    totalSold?: number;
    achPercent?: string;
    finalPayout?: number;
    eligibility?: string;
  };
};

type TeamResponse = {
  role?: string;
  team?: {
    tlName: string;
    rank?: number;
    location?: string;
    agents?: TeamAgent[];
    totals?: {
      agentCount?: number;
      totalSold?: number;
      totalFinalPayout?: number;
      totalConverted10k?: number;
      activeCount?: number;
    };
    performance?: {
      achPercent?: string;
      drr?: number;
      avgTalktime?: string;
      avgQuality?: string;
      avgCompletedCalls?: string;
    };
  } | null;
  allTeams?: Array<{
    tlName: string;
    rank?: number;
    location?: string;
    performance?: { achPercent?: string };
    totals?: { totalSold?: number; agentCount?: number };
  }>;
};

type AccessResponse = {
  role?: string;
  access?: {
    permissions?: {
      canManageTeamMembers?: boolean;
      canViewSensitivePayouts?: boolean;
    };
  };
};

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[2rem]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-[520px] rounded-[2rem] xl:col-span-3" />
        <Skeleton className="h-[520px] rounded-[2rem] xl:col-span-2" />
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { data, isLoading, error } = useDashboardQuery("team");
  const accessQuery = useQuery<AccessResponse>({
    queryKey: ["access-me-team"],
    queryFn: async () => {
      const res = await fetch("/api/access/me", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load access state");
      }
      return res.json();
    },
    staleTime: 60_000,
  });
  const response = (data ?? {}) as TeamResponse;
  const [search, setSearch] = useState("");
  const canManage = accessQuery.data?.access?.permissions?.canManageTeamMembers ?? false;
  const canViewPayouts = accessQuery.data?.access?.permissions?.canViewSensitivePayouts ?? false;

  const agents = useMemo(() => (response.team?.agents ? [...response.team.agents] : []), [response.team]);
  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return agents.filter((agent) => {
      if (!query) return true;

      return (
        agent.empId.toLowerCase().includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        String(agent.appraisal?.name ?? "").toLowerCase().includes(query)
      );
    });
  }, [agents, search]);

  if (isLoading) {
    return <TeamSkeleton />;
  }

  if (error) {
    return (
      <EmptyStatePanel
        title="Team workspace unavailable"
        description={error instanceof Error ? error.message : "Team data could not be loaded right now."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="TL workspace"
        title={response.team?.tlName || "Team workspace"}
        description="Manage your active roster, compare current productivity, and work inside permission-aware controls that respect super admin governance."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {response.role || "TL"}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Rank {response.team?.rank ?? "-"}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {response.team?.location || "Location unavailable"}
            </Badge>
          </div>
        }
        actions={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Achievement</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatPercentValue(response.team?.performance?.achPercent)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">DRR</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {Number(response.team?.performance?.drr ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Active agents</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {Number(response.team?.totals?.activeCount ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        }
        aside={
          <PermissionStateBanner
            enabled={canManage}
            description={
              canManage
                ? "Team management controls are enabled. You can supervise member-level actions and move through management flows."
                : "Super admin has disabled TL edit permissions. Data remains visible, but action controls stay locked."
            }
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Agents in team"
          value={Number(response.team?.totals?.agentCount ?? agents.length)}
          description="Current roster size"
          icon={Users}
          tone="blue"
        />
        <StatCard
          title="Total sold"
          value={Number(response.team?.totals?.totalSold ?? 0)}
          description="Combined team production"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          title="Active agents"
          value={Number(response.team?.totals?.activeCount ?? 0)}
          description="Members with active status"
          icon={ShieldCheck}
          tone="amber"
        />
        <StatCard
          title="Team DRR"
          value={Number(response.team?.performance?.drr ?? 0)}
          description={`Achievement ${formatPercentValue(response.team?.performance?.achPercent)}`}
          icon={Target}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <DataTableShell
          title="Team member detail"
          description="Searchable team operations table with permission-aware actions and stable payout visibility."
          className="xl:col-span-3"
          toolbar={
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team member by name, email, or employee ID"
              className="w-full rounded-2xl md:w-[340px]"
            />
          }
        >
          {!filteredAgents.length ? (
            <EmptyStatePanel
              title="No team members match this search"
              description="Try a different name, email, or employee ID to restore the roster view."
            />
          ) : (
            <div className="dashboard-scroll-shell max-h-[36rem] overflow-auto rounded-[1.5rem] border border-border/70">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                  <TableRow className="bg-card/95 hover:bg-card/95">
                    <TableHead>Agent</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Total sold</TableHead>
                    <TableHead className="text-right">Achievement</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.email}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{agent.appraisal?.name || agent.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {agent.empId} - {agent.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{agent.location || "-"}</TableCell>
                      <TableCell className="text-right">{Number(agent.performance.totalSold ?? 0)}</TableCell>
                      <TableCell className="text-right">{formatPercentValue(agent.performance.achPercent)}</TableCell>
                      <TableCell className="text-right">
                        {canViewPayouts ? formatCurrencyValue(agent.performance.finalPayout) : "Hidden"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={canManage ? "default" : "outline"}
                          size="sm"
                          disabled={!canManage}
                          className="rounded-xl"
                        >
                          {canManage ? (
                            <>
                              <UserCog className="mr-2 size-4" />
                              Manage
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 size-4" />
                              Locked
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DataTableShell>

        <Card className="rounded-[2rem] border-border/70 xl:col-span-2">
          <CardHeader>
            <CardTitle>Cross-team comparison</CardTitle>
            <CardDescription>Other teams stay visible for performance context while your own team remains the main workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(response.allTeams ?? []).length ? (
              (response.allTeams ?? []).slice(0, 6).map((team) => (
                <div key={team.tlName} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{team.tlName}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.location || "No location"} - Rank {team.rank ?? "-"}
                      </p>
                    </div>
                    <Badge variant="outline">{formatPercentValue(team.performance?.achPercent)}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-card p-3">Sales: {Number(team.totals?.totalSold ?? 0)}</div>
                    <div className="rounded-xl bg-card p-3">Agents: {Number(team.totals?.agentCount ?? 0)}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStatePanel
                title="No comparison teams available"
                description="This view will show the rest of the organization once comparison data is available."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
