"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CircleDot,
  Coins,
  Filter,
  Layers3,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
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
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { StatCard } from "@/components/workspace/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartPanel,
  DataTableShell,
  EmptyStatePanel,
  FilterToolbar,
  WorkspaceHero,
} from "@/components/workspace/primitives";
import { useWorkspaceUiStore } from "@/lib/store/workspaceUiStore";
import {
  PLAN_COLORS,
  buildPeriodRows,
  formatCurrencyValue,
  formatPercentValue,
  rankAgentsBySales,
  resolveActiveAgent,
} from "@/lib/view-models/operations";

type SalesPeriod = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "allTime";

type CustomerTxn = {
  phone: string;
  date: string;
  planCost: number;
  planType: string;
  totalTransaction: number;
  txnBucket: string;
  isAutoRenewal?: boolean;
  location?: string;
};

type AgentRecord = {
  empId: string;
  email: string;
  tlName: string;
  grade?: string;
  status?: string;
  location?: string;
  saleCode?: string;
  appraisal?: { name?: string } | null;
  performance: {
    planSaleTarget?: number;
    totalSold?: number;
    totalSalePoint?: number;
    ach10kPercent?: string;
    achPercent?: string;
    slab?: number;
    incentivesEarned?: number;
    finalPayout?: number;
    funnel5k?: number | string;
    converted10k?: number;
  };
  salesSummary: Record<
    SalesPeriod,
    { salesCount: number; totalAmount: number; customers10k: number; customers50k: number }
  >;
  customers: { all: CustomerTxn[] };
  drr: {
    target: number;
    totalSoldTillNow: number;
    remainingTarget: number;
    remainingDays: number;
    drr: number;
    isOnTrack: boolean;
  };
  targetGap: {
    target: number;
    achieved: number;
    remaining: number;
    percentDone: number;
    daysLeft: number;
    neededPerDay: number;
    isAchievable: boolean;
  };
  performanceScore?: { salesScore?: number; payoutScore?: number; overall?: number };
  activeDates?: { firstSaleDate?: string | null; lastSaleDate?: string | null; totalActiveDays?: number };
  alerts?: Array<{ message: string; severity: string }>;
};

type DashboardResponse = {
  role?: string;
  agent?: AgentRecord | null;
  team?: {
    tlName: string;
    rank?: number;
    agents?: AgentRecord[];
    performance?: { achPercent?: string; drr?: number };
    totals?: { totalSold?: number; activeCount?: number };
  } | null;
  allTeams?: Array<{ tlName: string; agents?: AgentRecord[] }>;
};

type SaleTypeResponse = {
  totals: { sales: number; revenue: number };
  planTypes: Array<{ planType: string; count: number; amount: number }>;
  byDay: Array<{
    date: string;
    bonus: number;
    superBonus: number;
    superBonusPlus: number;
    revenue: number;
  }>;
};

const PERIOD_OPTIONS: Array<{ label: string; value: SalesPeriod }> = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This week", value: "thisWeek" },
  { label: "Last week", value: "lastWeek" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "All time", value: "allTime" },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-[2rem]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-[440px] rounded-[2rem] xl:col-span-3" />
        <Skeleton className="h-[440px] rounded-[2rem] xl:col-span-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardQuery("dashboard");
  const response = (data ?? {}) as DashboardResponse;
  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriod>("thisMonth");
  const [planFilter, setPlanFilter] = useState("all");
  const [customerQuery, setCustomerQuery] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [agentQuery, setAgentQuery] = useState("");
  const [selectedAgentKey, setSelectedAgentKey] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { dashboardPerformanceView, setDashboardPerformanceView } = useWorkspaceUiStore();

  const allAgents = useMemo(() => {
    return (
      response.allTeams?.flatMap((team) => team.agents ?? []) ??
      response.team?.agents ??
      (response.agent ? [response.agent] : [])
    );
  }, [response.agent, response.allTeams, response.team?.agents]);

  const directory = useMemo(() => {
    const base = allAgents.length > 0 ? allAgents : response.agent ? [response.agent] : [];
    return base.filter(Boolean);
  }, [allAgents, response.agent]);

  const filteredDirectory = useMemo(() => {
    if (includeInactive) return directory;
    return directory.filter((agent) => agent.status !== "Inactive");
  }, [directory, includeInactive]);

  const filteredSuggestions = useMemo(() => {
    const query = agentQuery.trim().toLowerCase();
    return filteredDirectory
      .filter((agent) => {
        if (!query) return true;

        return (
          agent.empId.toLowerCase().includes(query) ||
          agent.email.toLowerCase().includes(query) ||
          String(agent.appraisal?.name ?? "").toLowerCase().includes(query) ||
          String(agent.tlName ?? "").toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [agentQuery, filteredDirectory]);

  const fallbackAgent =
    includeInactive || response.agent?.status !== "Inactive" ? response.agent : null;
  const activeAgent = resolveActiveAgent(filteredDirectory, selectedAgentKey, fallbackAgent);

  const activeTransactions = useMemo(() => {
    if (!activeAgent) return [];

    return activeAgent.customers.all.filter((customer) => {
      const planMatch = planFilter === "all" || customer.planType === planFilter;
      const query = customerQuery.trim().toLowerCase();
      const textMatch =
        !query ||
        customer.phone.toLowerCase().includes(query) ||
        customer.date.toLowerCase().includes(query) ||
        customer.planType.toLowerCase().includes(query) ||
        String(customer.totalTransaction).toLowerCase().includes(query);

      return planMatch && textMatch;
    });
  }, [activeAgent, customerQuery, planFilter]);

  const selectedPeriodLabel = PERIOD_OPTIONS.find((period) => period.value === selectedPeriod)?.label ?? "This month";
  const selectedPlanLabel =
    planFilter === "all"
      ? "All plan types"
      : planFilter === "BONUS"
        ? "Bonus"
        : planFilter === "SUPER_BONUS"
          ? "Super Bonus"
          : "Super Bonus Plus";

  const periodRows = useMemo(() => {
    if (!activeAgent) return [];
    return buildPeriodRows(activeAgent.salesSummary, PERIOD_OPTIONS);
  }, [activeAgent]);

  const activePeriodSummary = activeAgent?.salesSummary[selectedPeriod];

  const saleTypeQuery = useQuery<SaleTypeResponse>({
    queryKey: ["dashboard-sale-types", activeAgent?.email, selectedPeriod],
    enabled: Boolean(activeAgent?.email),
    queryFn: async () => {
      const res = await fetch(
        `/api/dashboard/sale-types?agent=${encodeURIComponent(activeAgent?.email ?? "")}&period=${selectedPeriod}`
      );

      if (!res.ok) {
        throw new Error("Unable to load sale type breakdown");
      }

      return res.json();
    },
    staleTime: 60_000,
  });

  const topPlanType = useMemo(() => {
    const rows = saleTypeQuery.data?.planTypes ?? [];
    if (!rows.length) return null;
    return [...rows].sort((left, right) => right.count - left.count)[0] ?? null;
  }, [saleTypeQuery.data?.planTypes]);

  const conversionMix = useMemo(() => {
    const total = activePeriodSummary?.salesCount ?? 0;
    const above10k = activePeriodSummary?.customers10k ?? 0;
    const above50k = activePeriodSummary?.customers50k ?? 0;
    const other = Math.max(0, total - above10k);
    const rows = [
      { label: "Converted > 10K", count: above10k, fill: "var(--chart-1)" },
      { label: "Converted > 50K", count: above50k, fill: "var(--chart-2)" },
      { label: "Other sales", count: other, fill: "var(--chart-3)" },
    ];
    return {
      total,
      rows: rows.map((row) => ({
        ...row,
        percentage: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
      })),
    };
  }, [activePeriodSummary?.customers10k, activePeriodSummary?.customers50k, activePeriodSummary?.salesCount]);

  const teamAgents = useMemo(() => {
    if (response.team?.agents?.length) {
      return response.team.agents;
    }

    if (response.agent && response.allTeams?.length) {
      const matched = response.allTeams.find((team) =>
        team.agents?.some((agent) => agent.empId === response.agent?.empId)
      );
      if (matched?.agents?.length) return matched.agents;
    }

    return directory;
  }, [directory, response.agent, response.allTeams, response.team?.agents]);

  const orgAgents = useMemo(() => {
    if (response.allTeams?.length) {
      return response.allTeams.flatMap((team) => team.agents ?? []);
    }
    return directory;
  }, [directory, response.allTeams]);

  const visibleTeamAgents = useMemo(() => {
    return includeInactive ? teamAgents : teamAgents.filter((agent) => agent.status !== "Inactive");
  }, [includeInactive, teamAgents]);

  const visibleOrgAgents = useMemo(() => {
    return includeInactive ? orgAgents : orgAgents.filter((agent) => agent.status !== "Inactive");
  }, [includeInactive, orgAgents]);

  const teamLeaderboard = useMemo(() => {
    return rankAgentsBySales(visibleTeamAgents, 6);
  }, [visibleTeamAgents]);

  const orgLeaderboard = useMemo(() => {
    const base = [...visibleOrgAgents].sort((left, right) => {
      if (includeInactive) {
        if (left.status === "Inactive" && right.status !== "Inactive") return 1;
        if (left.status !== "Inactive" && right.status === "Inactive") return -1;
      }
      return Number(right.performance.totalSold ?? 0) - Number(left.performance.totalSold ?? 0);
    });
    return base.slice(0, 6);
  }, [includeInactive, visibleOrgAgents]);

  const [performerScope, setPerformerScope] = useState<"team" | "org">("team");
  const activeLeaderboard = performerScope === "org" ? orgLeaderboard : teamLeaderboard;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !activeAgent) {
    return (
      <EmptyStatePanel
        title="Dashboard data not ready"
        description={
          error instanceof Error
            ? error.message
            : "Agent data is unavailable. Try again once the data pipeline refreshes."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="Agent command dashboard"
        title={activeAgent.appraisal?.name || activeAgent.email.split("@")[0]}
        description="Search any available agent by email or employee ID, switch focus instantly, and review target delivery, conversions, and sold customer activity from one professional workspace."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {response.role || "AGENT"}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {activeAgent.empId}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {activeAgent.tlName}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {activeAgent.location || "Location unavailable"}
            </Badge>
          </div>
        }
        actions={
          <FilterToolbar>
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="flex min-w-[320px] flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-2.5">
                <Search className="size-4 text-muted-foreground" />
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-auto flex-1 justify-start p-0 text-left">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {selectedAgentKey ? activeAgent.email : "Find agent by email or employee ID"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {activeAgent.empId} - {activeAgent.tlName}
                        </p>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0" align="start">
                    <Command>
                      <CommandInput
                        value={agentQuery}
                        onValueChange={setAgentQuery}
                        placeholder="Search agent, email, emp ID..."
                      />
                      <CommandList>
                        <CommandEmpty>No matching agent found.</CommandEmpty>
                        <CommandGroup heading="Agent suggestions">
                          {filteredSuggestions.map((agent) => (
                            <CommandItem
                              key={agent.email}
                              value={`${agent.empId} ${agent.email} ${agent.appraisal?.name ?? ""}`}
                              onSelect={() => {
                                setSelectedAgentKey(agent.email);
                                setAgentQuery(agent.email);
                                setSearchOpen(false);
                              }}
                              className="flex items-center justify-between py-3"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                  {agent.appraisal?.name || agent.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {agent.empId} - {agent.email}
                                </p>
                              </div>
                              <Badge variant="outline" className="rounded-full">
                                {agent.tlName}
                              </Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Sparkles className="size-4 text-amber-500" />
              </div>

              <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as SalesPeriod)}>
                <SelectTrigger className="h-11 min-w-[180px] rounded-2xl border-border/70 bg-background/70">
                  <CalendarDays className="mr-2 size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-11 min-w-[180px] rounded-2xl border-border/70 bg-background/70">
                  <Filter className="mr-2 size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plan types</SelectItem>
                  <SelectItem value="BONUS">Bonus</SelectItem>
                  <SelectItem value="SUPER_BONUS">Super Bonus</SelectItem>
                  <SelectItem value="SUPER_BONUS_PLUS">Super Bonus Plus</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex h-11 items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4">
                <Switch id="include-inactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
                <label htmlFor="include-inactive" className="text-sm font-medium text-foreground">
                  Inactive
                </label>
              </div>
            </div>
          </FilterToolbar>
        }
        aside={
          <Card className="rounded-[1.9rem] border-border/70 bg-card/85 shadow-none">
            <CardContent className="grid gap-3 p-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Selected agent</p>
                <h3 className="text-xl font-semibold text-foreground">{activeAgent.email}</h3>
                <p className="text-sm text-muted-foreground">
                  {activeAgent.empId} - {activeAgent.grade || "Grade unavailable"} - {activeAgent.tlName}
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {activeAgent.location || "Not available"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{activeAgent.status || "Active"}</p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">View focus</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{selectedPeriodLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedPlanLabel}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Pipeline signals</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {activePeriodSummary?.salesCount ?? 0} sales
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activePeriodSummary?.customers10k ?? 0} converted above 10K
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Best sale type</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {topPlanType?.planType || "Waiting for data"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {topPlanType ? `${topPlanType.count} sales - ${formatCurrencyValue(topPlanType.amount)}` : "No plan type data"}
                </p>
              </div>
            </CardContent>
          </Card>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total target"
          value={Number(activeAgent.performance.planSaleTarget ?? 0)}
          description="Monthly target assigned"
          icon={Target}
          tone="blue"
        />
        <StatCard
          title="Total sale"
          value={Number(activeAgent.performance.totalSold ?? 0)}
          description="This month performance"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          title="Total points"
          value={Number(activeAgent.performance.totalSalePoint ?? 0)}
          description="Accumulated sale points"
          icon={Layers3}
          tone="amber"
        />
        <StatCard
          title="10K achievement"
          value={formatPercentValue(activeAgent.performance.ach10kPercent)}
          description="Converted customers"
          icon={CircleDot}
          tone="rose"
        />
        <StatCard
          title="Achievement %"
          value={formatPercentValue(activeAgent.performance.achPercent)}
          description={`Payout Rs ${Number(activeAgent.performance.finalPayout ?? 0).toLocaleString("en-IN")}`}
          icon={Sparkles}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartPanel
          title="Performance command view"
          description="Period-wise movement for the selected agent. Chart and table stay synced with the same filters."
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Sales trend
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                10K conversion trend
              </Badge>
            </div>
          }
          className="xl:col-span-3"
        >
          <Tabs
            value={dashboardPerformanceView}
            onValueChange={(value) => setDashboardPerformanceView(value as "chart" | "table")}
            className="space-y-4"
          >
            <TabsList className="grid h-11 w-full max-w-[280px] grid-cols-2 rounded-2xl">
              <TabsTrigger value="chart" className="rounded-2xl">
                Chart
              </TabsTrigger>
              <TabsTrigger value="table" className="rounded-2xl">
                Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-0">
              <div className="h-[320px] min-w-0 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={periodRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="salesCount" stroke="var(--chart-1)" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="customers10k" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">10K customers</TableHead>
                      <TableHead className="text-right">50K customers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodRows.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right">{row.salesCount}</TableCell>
                        <TableCell className="text-right">{row.customers10k}</TableCell>
                        <TableCell className="text-right">{row.customers50k}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </ChartPanel>

        <Card className="rounded-[2rem] border-border/70 xl:col-span-2">
          <CardHeader>
            <CardTitle>Operational snapshot</CardTitle>
            <CardDescription>Focused highlights for the current period and selected agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">Sales count</p>
                <p className="mt-2 text-2xl font-semibold">{activePeriodSummary?.salesCount ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">10K customers</p>
                <p className="mt-2 text-2xl font-semibold">{activePeriodSummary?.customers10k ?? 0}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Revenue captured</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrencyValue(activePeriodSummary?.totalAmount ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agent notes</p>
              <div className="mt-3 space-y-3">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Team leader</span>
                  <span className="font-medium text-foreground">{activeAgent.tlName}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Sale code</span>
                  <span className="font-medium text-foreground">{activeAgent.saleCode || "Not available"}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Customer records</span>
                  <span className="font-medium text-foreground">{activeAgent.customers.all.length}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Payout</span>
                  <span className="font-medium text-foreground">
                    {formatCurrencyValue(activeAgent.performance.finalPayout)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel
          title="Top performers"
          description="Team contribution metrics for the current dashboard scope."
          actions={
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Top {activeLeaderboard.length}
            </Badge>
          }
          className="h-full"
        >
          <div className="flex h-full flex-col">
          <Tabs
            value={performerScope}
            onValueChange={(value) => setPerformerScope(value as "team" | "org")}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <TabsList className="grid h-11 w-full max-w-[320px] grid-cols-2 rounded-2xl">
                <TabsTrigger value="team" className="rounded-2xl">
                  Team only
                </TabsTrigger>
                <TabsTrigger value="org" className="rounded-2xl">
                  All agents
                </TabsTrigger>
              </TabsList>
              {performerScope === "org" ? (
                <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-3">
                  <Switch
                    id="include-inactive-top"
                    checked={includeInactive}
                    onCheckedChange={setIncludeInactive}
                  />
                  <label htmlFor="include-inactive-top" className="text-xs font-medium text-foreground">
                    Inactive
                  </label>
                </div>
              ) : null}
            </div>

            <TabsContent value="team" className="mt-0 space-y-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamLeaderboard.map((agent) => ({
                  id: agent.empId,
                  sales: Number(agent.performance.totalSold ?? 0),
                }))}
                layout="vertical"
                margin={{ left: 16, right: 8, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="id" tickLine={false} axisLine={false} fontSize={12} width={72} />
                <Tooltip />
                <Bar dataKey="sales" radius={[0, 999, 999, 0]}>
                  {teamLeaderboard.map((agent, index) => (
                    <Cell key={agent.email} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3">
            {teamLeaderboard.slice(0, 3).map((agent, index) => (
              <div
                key={agent.email}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{agent.empId}</p>
                  <p className="text-xs text-muted-foreground">{agent.appraisal?.name || agent.email}</p>
                  <p className="text-xs text-muted-foreground">
                    10K: {formatPercentValue(agent.performance.ach10kPercent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {Number(agent.performance.totalSold ?? 0)} sales
                  </p>
                    <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
            </TabsContent>
            <TabsContent value="org" className="mt-0 space-y-4">
              {orgLeaderboard.length === 0 ? (
                <EmptyStatePanel
                  title="All-agent leaderboard unavailable"
                  description="Organization-wide data is not available for this role. Ask an admin to enable org-level visibility."
                />
              ) : (
                <>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={orgLeaderboard.map((agent) => ({
                          id: agent.empId,
                          sales: Number(agent.performance.totalSold ?? 0),
                        }))}
                        layout="vertical"
                        margin={{ left: 16, right: 8, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis type="category" dataKey="id" tickLine={false} axisLine={false} fontSize={12} width={72} />
                        <Tooltip />
                        <Bar dataKey="sales" radius={[0, 999, 999, 0]}>
                          {orgLeaderboard.map((agent, index) => (
                            <Cell key={agent.email} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid gap-3">
                    {orgLeaderboard.slice(0, 3).map((agent, index) => (
                      <div
                        key={agent.email}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{agent.empId}</p>
                      <p className="text-xs text-muted-foreground">{agent.appraisal?.name || agent.email}</p>
                      <p className="text-xs text-muted-foreground">
                        10K: {formatPercentValue(agent.performance.ach10kPercent)}
                      </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {Number(agent.performance.totalSold ?? 0)} sales
                          </p>
                          <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Conversion mix"
          description="How the selected period is split between conversion buckets."
          actions={
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {conversionMix.total} total sales
            </Badge>
          }
          className="h-full"
        >
          <div className="flex h-full flex-col">
          <Tabs defaultValue="chart" className="space-y-4">
            <TabsList className="grid h-11 w-full max-w-[280px] grid-cols-2 rounded-2xl">
              <TabsTrigger value="chart" className="rounded-2xl">
                Chart
              </TabsTrigger>
              <TabsTrigger value="table" className="rounded-2xl">
                Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-0 space-y-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={conversionMix.rows} dataKey="count" nameKey="label" innerRadius={72} outerRadius={110} paddingAngle={4}>
                  {conversionMix.rows.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Conversion count</p>
              <div className="mt-3 h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionMix.rows} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} interval={0} />
                    <YAxis tickLine={false} axisLine={false} fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {conversionMix.rows.map((row) => (
                        <Cell key={row.label} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Conversion share</p>
              <div className="mt-3 h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionMix.rows} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} interval={0} />
                    <YAxis tickLine={false} axisLine={false} fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                      {conversionMix.rows.map((row) => (
                        <Cell key={row.label} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {conversionMix.rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ backgroundColor: row.fill }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.count} conversions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{row.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Share of total sales</p>
                </div>
              </div>
            ))}
          </div>
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bucket</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversionMix.rows.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right">{row.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </ChartPanel>
      </div>

      <Card className="rounded-[2rem] border-border/70">
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Compensation details</CardTitle>
            <CardDescription>Payout breakdown and funnel signals for the selected agent.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Compensation view
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Achieved slab</p>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2 text-muted-foreground">
                <Layers3 className="size-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold">{Number(activeAgent.performance.slab ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Incentives earned</p>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2 text-muted-foreground">
                <Coins className="size-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {formatCurrencyValue(activeAgent.performance.incentivesEarned)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">10K achievement</p>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2 text-muted-foreground">
                <Users className="size-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold">
              {formatPercentValue(activeAgent.performance.ach10kPercent)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Final payout</p>
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-2 text-muted-foreground">
                <Wallet className="size-4" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold">{formatCurrencyValue(activeAgent.performance.finalPayout)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartPanel
          title="Day-by-sale-type section"
          description="Route-backed breakdown of daily sales by plan type for the selected agent."
          actions={
            <div className="flex flex-wrap gap-2">
              {(saleTypeQuery.data?.planTypes ?? []).slice(0, 3).map((row) => (
                <Badge key={row.planType} variant="outline" className="rounded-full px-3 py-1">
                  {row.planType}: {row.count}
                </Badge>
              ))}
            </div>
          }
          className="xl:col-span-3"
        >
          {saleTypeQuery.isError ? (
            <EmptyStatePanel
              title="Sale type data unavailable"
              description="The day-by-day breakdown could not be loaded. Try again in a moment."
            />
          ) : (
            <div className="h-[340px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={saleTypeQuery.data?.byDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="bonus" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="superBonus" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="superBonusPlus" fill="var(--chart-3)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartPanel>

        <ChartPanel
          title="Target readiness"
          description="Remaining target, DRR pacing, and time left to close the current goal."
          className="xl:col-span-2"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="mt-2 text-2xl font-semibold">{activeAgent.targetGap.target}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Achieved</p>
              <p className="mt-2 text-2xl font-semibold">{activeAgent.targetGap.achieved}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="mt-2 text-2xl font-semibold">{activeAgent.targetGap.remaining}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Days left</p>
              <p className="mt-2 text-2xl font-semibold">{activeAgent.targetGap.daysLeft}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily rate required</span>
              <span className="font-semibold text-foreground">{activeAgent.targetGap.neededPerDay}/day</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">On track</span>
              <Badge className={activeAgent.targetGap.isAchievable ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}>
                {activeAgent.targetGap.isAchievable ? "Achievable" : "At risk"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">First sale date</span>
              <span className="font-medium text-foreground">{activeAgent.activeDates?.firstSaleDate ?? "Not available"}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last sale date</span>
              <span className="font-medium text-foreground">{activeAgent.activeDates?.lastSaleDate ?? "Not available"}</span>
            </div>
          </div>
        </ChartPanel>
      </div>

      <DataTableShell
        title="Sold customer information"
        description="Search, filter, and review customer-level transactions for the selected agent."
        toolbar={
          <Input
            value={customerQuery}
            onChange={(event) => setCustomerQuery(event.target.value)}
            placeholder="Search by phone, date, plan type, or transaction amount"
            className="max-w-md rounded-2xl"
          />
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{activeTransactions.length} matching customers</span>
          <span>Scroll inside the table to keep the title, search, and column labels visible.</span>
        </div>
        <div className="mt-4 max-h-[32rem] overflow-auto rounded-[1.5rem] border border-border/70">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <TableRow className="border-border/70 bg-card/95 hover:bg-card/95">
                <TableHead className="bg-card/95">Phone</TableHead>
                <TableHead className="bg-card/95">Date</TableHead>
                <TableHead className="bg-card/95">Plan type</TableHead>
                <TableHead className="bg-card/95 text-right">Plan cost</TableHead>
                <TableHead className="bg-card/95 text-right">Total transaction</TableHead>
                <TableHead className="bg-card/95 text-right">Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTransactions.map((customer) => (
                <TableRow key={`${customer.phone}-${customer.date}-${customer.planType}`}>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.date}</TableCell>
                  <TableCell>{customer.planType}</TableCell>
                  <TableCell className="text-right">{formatCurrencyValue(customer.planCost)}</TableCell>
                  <TableCell className="text-right">
                    {Number(customer.totalTransaction ?? 0).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">{customer.txnBucket || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {activeTransactions.length === 0 ? (
          <div className="mt-6">
            <EmptyStatePanel
              title="No transactions found"
              description="Try adjusting the plan type or search filter to view customer records."
            />
          </div>
        ) : null}
      </DataTableShell>
    </div>
  );
}
