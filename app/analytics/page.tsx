"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Filter, Layers3, MapPinned, Search, Table2, Trophy, Users } from "lucide-react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import {
  filterAgentDirectory,
  formatCurrencyValue,
  parsePercentValue,
  PLAN_COLORS,
} from "@/lib/view-models/operations";
import { useWorkspaceUiStore } from "@/lib/store/workspaceUiStore";
import {
  ChartPanel,
  DataTableShell,
  EmptyStatePanel,
  FilterToolbar,
  WorkspaceHero,
} from "@/components/workspace/primitives";
import { StatCard } from "@/components/workspace/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AnalyticsAgent = {
  empId: string;
  email: string;
  tlName: string;
  location?: string;
  grade?: string;
  saleCode?: string;
  performance: {
    totalSold?: number;
    achPercent?: string;
    finalPayout?: number;
    converted10k?: number;
  };
  salesSummary: {
    today: { salesCount: number; totalAmount: number };
    thisWeek: { salesCount: number; totalAmount: number };
    thisMonth: { salesCount: number; totalAmount: number };
  };
  customers: { summary?: { total?: number; above10kCount?: number; above50kCount?: number } };
  appraisal?: { name?: string } | null;
  alerts?: Array<{ message: string }>;
};

type AnalyticsResponse = {
  analytics?: {
    overall?: {
      totalAgents?: number;
      totalSold?: number;
      totalRevenue?: number;
      totalPayoutAmount?: number;
      totalConverted10k?: number;
      totalTarget?: number;
    };
    dailyTrend?: Array<{ date: string; salesCount: number; totalAmount: number; customers10k: number }>;
    tlLeaderboard?: Array<{
      tlName: string;
      location: string;
      rank: number;
      totalSold: number;
      achPercent: string;
      drr: number;
      agentCount?: number;
    }>;
    topAgents?: {
      bySales?: Array<{
        empId: string;
        email: string;
        tlName: string;
        totalSold: number;
        achPercent: string;
        finalPayout: number;
      }>;
    };
    planBreakdown?: Record<string, { count?: number; amount?: number; percentage?: string }>;
  };
  agents?: AnalyticsAgent[];
};

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[2rem]" />
      <Skeleton className="h-24 rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-[2rem]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-[420px] rounded-[2rem] xl:col-span-3" />
        <Skeleton className="h-[420px] rounded-[2rem] xl:col-span-2" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useDashboardQuery("analytics");
  const response = (data ?? {}) as AnalyticsResponse;
  const analytics = response.analytics ?? {};
  const agents = response.agents ? [...response.agents] : [];
  const [locationFilter, setLocationFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AnalyticsAgent | null>(null);
  const directoryView = useWorkspaceUiStore((state) => state.analyticsDirectoryView);
  const setDirectoryView = useWorkspaceUiStore((state) => state.setAnalyticsDirectoryView);
  const trendView = useWorkspaceUiStore((state) => state.analyticsTrendView);
  const setTrendView = useWorkspaceUiStore((state) => state.setAnalyticsTrendView);

  const locations = ["all", ...new Set(agents.map((agent) => agent.location).filter(Boolean) as string[])];
  const teams = ["all", ...new Set(agents.map((agent) => agent.tlName).filter(Boolean))];
  const filteredAgents = filterAgentDirectory(agents, search, locationFilter, teamFilter);
  const planBreakdown = Object.entries(analytics.planBreakdown ?? {}).map(([plan, value], index) => ({
    plan,
    count: Number(value.count ?? 0),
    amount: Number(value.amount ?? 0),
    fill: PLAN_COLORS[index % PLAN_COLORS.length],
  }));
  const topPerformerCards = (analytics.topAgents?.bySales ?? []).slice(0, 4);
  const squadRanking = (analytics.tlLeaderboard ?? []).slice(0, 4);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <EmptyStatePanel
        title="Analytics unavailable"
        description={error instanceof Error ? error.message : "Analytics data could not be loaded."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="Operational intelligence"
        title="Analytics hub"
        description="Advanced performance monitoring, plan distribution, and team ranking from one organized analytics workspace."
        meta={
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-panel-muted rounded-[1.5rem] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Active force</p>
              <p className="mt-3 text-xl font-semibold text-foreground">{Number(analytics.overall?.totalAgents ?? agents.length)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Tracked agents in current analytics scope.</p>
            </div>
            <div className="surface-panel-muted rounded-[1.5rem] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Top team</p>
              <p className="mt-3 text-xl font-semibold text-foreground">{squadRanking[0]?.tlName || "Waiting for data"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{squadRanking[0]?.location || "No location data"}</p>
            </div>
            <div className="surface-panel-muted rounded-[1.5rem] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Distribution</p>
              <p className="mt-3 text-xl font-semibold text-foreground">{planBreakdown.length} plan types</p>
              <p className="mt-1 text-sm text-muted-foreground">Shared across filters, charts, and detail views.</p>
            </div>
          </div>
        }
      />

      <FilterToolbar>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr]">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-14 rounded-2xl">
              <MapPinned className="mr-2 size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location === "all" ? "All locations" : location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-14 rounded-2xl">
              <Users className="mr-2 size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team === "all" ? "All teams" : team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agent by name, email, employee ID, or TL name"
              className="h-14 rounded-2xl pl-11"
            />
          </div>
        </div>
      </FilterToolbar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total target" value={Number(analytics.overall?.totalTarget ?? 0)} description="Organization target assigned" icon={Layers3} tone="blue" />
        <StatCard title="Total sales" value={Number(analytics.overall?.totalSold ?? 0)} description="Organization level total sold" icon={BarChart3} tone="green" />
        <StatCard title="Earned incentive" value={formatCurrencyValue(analytics.overall?.totalRevenue)} description="Tracked booking and revenue value" icon={Trophy} tone="amber" />
        <StatCard title="Final payout" value={formatCurrencyValue(analytics.overall?.totalPayoutAmount)} description={`${Number(analytics.overall?.totalConverted10k ?? 0)} high-value conversions`} icon={Filter} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartPanel
          title="Daily trend"
          description="Switch between visual and table views without losing the active filter scope."
          className="xl:col-span-3"
          actions={
            <Tabs value={trendView} onValueChange={(value) => setTrendView(value as "chart" | "table")} className="w-full max-w-[240px]">
              <TabsList className="grid h-11 grid-cols-2 rounded-2xl">
                <TabsTrigger value="chart" className="rounded-2xl">
                  Chart
                </TabsTrigger>
                <TabsTrigger value="table" className="rounded-2xl">
                  Data
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          {(analytics.dailyTrend ?? []).length ? (
            <Tabs value={trendView} onValueChange={(value) => setTrendView(value as "chart" | "table")}>
              <TabsContent value="chart" className="mt-0">
                <div className="h-[320px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyTrend ?? []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="salesCount" stroke="var(--chart-1)" strokeWidth={3} />
                      <Line type="monotone" dataKey="customers10k" stroke="var(--chart-2)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="table" className="mt-0">
                <div className="dashboard-scroll-shell max-h-[22rem] overflow-auto rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                      <TableRow className="bg-background/95 hover:bg-background/95">
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">10K</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analytics.dailyTrend ?? []).slice(-14).map((row) => (
                        <TableRow key={row.date}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="text-right">{row.salesCount}</TableCell>
                          <TableCell className="text-right">{row.customers10k}</TableCell>
                          <TableCell className="text-right">{formatCurrencyValue(row.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <EmptyStatePanel
              title="No daily trend data"
              description="Trend rows will appear here once analytics data is available for the selected scope."
            />
          )}
        </ChartPanel>

        <ChartPanel title="Plan mix" description="Donut view with plan-level distribution." className="xl:col-span-2">
          {planBreakdown.length ? (
            <div className="space-y-6">
              <div className="h-[240px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planBreakdown} dataKey="count" nameKey="plan" innerRadius={64} outerRadius={104} paddingAngle={4}>
                      {planBreakdown.map((row) => (
                        <Cell key={row.plan} fill={row.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planBreakdown.map((row) => (
                    <TableRow key={row.plan}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="size-3 rounded-full" style={{ backgroundColor: row.fill }} />
                          {row.plan}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{formatCurrencyValue(row.amount)}</TableCell>
                      <TableCell className="text-right">
                        {planBreakdown.length
                          ? `${Math.round((row.count / Math.max(1, planBreakdown.reduce((sum, item) => sum + item.count, 0))) * 100)}%`
                          : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyStatePanel
              title="No plan mix data"
              description="Plan-level distribution will appear here once the analytics payload includes plan rows."
            />
          )}
        </ChartPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartPanel
          title="Top performers"
          description="Agent contribution metrics and live leaderboard visibility."
          className="xl:col-span-3"
          actions={
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Top {topPerformerCards.length || 0}
            </Badge>
          }
        >
          {topPerformerCards.length ? (
            <div className="grid gap-4">
              {topPerformerCards.map((agent, index) => (
                <div key={agent.email} className="surface-panel-muted flex items-center justify-between rounded-[1.5rem] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{agent.empId}</p>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                    </div>
                  </div>
                  <div className="grid gap-1 text-right">
                    <p className="text-lg font-semibold text-foreground">{agent.totalSold}</p>
                    <p className="text-xs text-muted-foreground">{agent.achPercent} ach</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStatePanel
              title="No top performers available"
              description="Top-agent cards will appear once sales ranking data is available."
            />
          )}
        </ChartPanel>

        <ChartPanel
          title="Squad ranking"
          description="Team-level efficiency snapshot for the leading squads."
          className="xl:col-span-2"
          actions={
            <Badge variant="outline" className="rounded-full px-3 py-1">
              View all
            </Badge>
          }
        >
          {squadRanking.length ? (
            <div className="grid gap-4">
              {squadRanking.map((team) => (
                <div key={team.tlName} className="surface-panel-muted rounded-[1.75rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{team.tlName}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{team.location || "Location unavailable"}</p>
                    </div>
                    <Badge className="rounded-full bg-primary/10 text-primary">Rank #{team.rank}</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Sales volume</p>
                      <p className="mt-2 text-2xl font-semibold">{team.totalSold}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Achievement</p>
                      <p className="mt-2 text-2xl font-semibold">{team.achPercent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Team size</p>
                      <p className="mt-2 text-xl font-semibold">{team.agentCount ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">DRR</p>
                      <p className="mt-2 text-xl font-semibold">{team.drr}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStatePanel
              title="No squad ranking data"
              description="Team-level leaderboard cards will appear here once ranking data is available."
            />
          )}
        </ChartPanel>
      </div>

      <DataTableShell
        title="Agent directory"
        description="Switch between card and table views. Clicking an agent opens a complete performance profile."
        toolbar={
          <div className="flex items-center gap-2">
            <Button variant={directoryView === "cards" ? "default" : "outline"} className="rounded-2xl" onClick={() => setDirectoryView("cards")}>
              Cards
            </Button>
            <Button variant={directoryView === "table" ? "default" : "outline"} className="rounded-2xl" onClick={() => setDirectoryView("table")}>
              <Table2 className="mr-2 size-4" />
              Table
            </Button>
          </div>
        }
      >
        {!filteredAgents.length ? (
          <EmptyStatePanel
            title="No agents match this analytics filter"
            description="Try widening the location, team, or search criteria to restore the directory."
          />
        ) : directoryView === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAgents.map((agent) => (
              <button
                key={agent.email}
                type="button"
                onClick={() => setSelectedAgent(agent)}
                className="surface-panel rounded-[1.75rem] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{agent.appraisal?.name || agent.email}</p>
                    <p className="text-sm text-muted-foreground">{agent.empId} - {agent.email}</p>
                  </div>
                  <Badge variant="outline">{agent.tlName}</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Total sold</p>
                    <p className="mt-2 text-xl font-semibold">{Number(agent.performance.totalSold ?? 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Achievement</p>
                    <p className="mt-2 text-xl font-semibold">{String(agent.performance.achPercent ?? "0%")}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
                  <span className="text-muted-foreground">{agent.location || "Location unavailable"}</span>
                  <span className={parsePercentValue(agent.performance.achPercent) >= 75 ? "font-semibold text-emerald-500" : "font-semibold text-red-500"}>
                    {String(agent.performance.achPercent ?? "0%")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="dashboard-scroll-shell max-h-[34rem] overflow-auto rounded-[1.5rem] border border-border/70">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                <TableRow className="bg-card/95 hover:bg-card/95">
                  <TableHead>Agent</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Achievement</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.email} className="cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{agent.appraisal?.name || agent.email}</p>
                        <p className="text-xs text-muted-foreground">{agent.empId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{agent.tlName}</TableCell>
                    <TableCell>{agent.location || "-"}</TableCell>
                    <TableCell className="text-right">{Number(agent.performance.totalSold ?? 0)}</TableCell>
                    <TableCell className="text-right">{String(agent.performance.achPercent ?? "0%")}</TableCell>
                    <TableCell className="text-right">{formatCurrencyValue(agent.performance.finalPayout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DataTableShell>

      <Dialog open={Boolean(selectedAgent)} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-w-3xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>{selectedAgent?.appraisal?.name || selectedAgent?.email}</DialogTitle>
          </DialogHeader>
          {selectedAgent ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-[1.5rem]">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-medium text-muted-foreground">Agent identity</p>
                  <p className="text-lg font-semibold">{selectedAgent.empId}</p>
                  <p className="text-sm text-muted-foreground">{selectedAgent.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedAgent.tlName} - {selectedAgent.location || "Location unavailable"}</p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.5rem]">
                <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">This month sales</p>
                    <p className="mt-2 text-2xl font-semibold">{selectedAgent.salesSummary.thisMonth.salesCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">This month revenue</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrencyValue(selectedAgent.salesSummary.thisMonth.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">10K conversions</p>
                    <p className="mt-2 text-2xl font-semibold">{Number(selectedAgent.performance.converted10k ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Final payout</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrencyValue(selectedAgent.performance.finalPayout)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.5rem] md:col-span-2">
                <CardContent className="p-5">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Alerts and signals</p>
                  <div className="space-y-2">
                    {(selectedAgent.alerts ?? []).length ? (
                      selectedAgent.alerts?.map((alert) => (
                        <div key={alert.message} className="rounded-2xl border border-border/70 bg-muted/50 p-3 text-sm">
                          {alert.message}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-border/70 bg-muted/50 p-3 text-sm text-muted-foreground">
                        No active alerts for this agent.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
