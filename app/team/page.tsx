"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AgentCard } from "@/components/dashboard/cards/AgentCard";
import { AgentLeaderboardChart } from "@/components/dashboard/charts/AgentLeaderboardChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Target, Medal, TrendingUp, ShieldCheck, AlertCircle, Search, LayoutGrid, List, ArrowUpDown, Phone, Star, Headset, Banknote, Coins } from "lucide-react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";

function PageSkeleton() {
  return (
    <div className="p-5 lg:p-8 space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-[360px] rounded-2xl" />
    </div>
  );
}

export default function TeamPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { data, isLoading: dataLoading, error } = useDashboardQuery("team");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"totalSold" | "achPercent">("totalSold");
  const [view, setView] = useState<"grid" | "table">("grid");

  const allAgents: any[] = data?.data?.team?.agents ?? data?.team?.agents ?? [];
  const agents = allAgents.filter((a) => (a.status ?? a.performance?.status ?? "Active") !== "Inactive");
  const tls: any[]    = data?.data?.team?.leaderboard ?? data?.team?.leaderboard ?? [];

  const parsePercent = (val: string | number | undefined): number => {
    if (!val) return 0;
    return parseFloat(String(val).replace("%", ""));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return agents
      .filter((a) =>
        !q ||
        a.empId?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.tlName?.toLowerCase().includes(q) ||
        String(a.location ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const achA = parsePercent(a.achPercent ?? a.performance?.achPercent);
        const achB = parsePercent(b.achPercent ?? b.performance?.achPercent);
        const soldA = a.totalSold ?? a.performance?.totalSold ?? 0;
        const soldB = b.totalSold ?? b.performance?.totalSold ?? 0;

        if (sortBy === "achPercent") return achB - achA;
        return soldB - soldA;
      });
  }, [agents, search, sortBy]);

  const totalSold = agents.reduce((s, a) => s + (a.totalSold ?? a.performance?.totalSold ?? 0), 0);
  const activeCount = agents.filter((a) => (a.totalSold ?? a.performance?.totalSold ?? 0) > 0).length;
  const eligibleCount = agents.filter((a) => (a.eligibility ?? a.performance?.eligibility) === "Eligible").length;

  // Team-level operational averages from team performance object
  const teamPerf = data?.data?.team?.performance ?? data?.team?.performance ?? {};
  const avgTalktime = teamPerf.avgTalktime ?? "–";
  const avgQuality = teamPerf.avgQuality ?? "–";
  const avgCompletedCalls = teamPerf.avgCompletedCalls ?? "–";
  const totalIncentive = data?.data?.team?.totals?.totalIncentive ?? data?.team?.totals?.totalIncentive ?? 0;
  const totalFinalPayout = data?.data?.team?.totals?.totalFinalPayout ?? data?.team?.totals?.totalFinalPayout ?? 0;
  const totalFunnel5k = data?.data?.team?.totals?.totalFunnel5k ?? data?.team?.totals?.totalFunnel5k ?? 0;

  const chartAgents = useMemo(() => filtered.slice(0, 10).map((a) => ({
    empId: a.empId,
    totalSold: a.totalSold ?? a.performance?.totalSold ?? 0,
    achPercent: a.achPercent ?? a.performance?.achPercent ?? "0%",
    tlName: a.tlName ?? "—",
  })), [filtered]);

  if (sessionStatus === "loading" || dataLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6 lg:p-8 h-full flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p>{error instanceof Error ? error.message : "Failed to load team data"}</p>
        </div>
      </div>
    );
  }

  const role = data?.role ?? (session as any)?.role ?? "AGENT";


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-5 lg:p-8 space-y-6 max-w-[1400px] mx-auto"
    >
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Team Management</p>
        <h1 className="font-heading text-3xl font-black text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "ADMIN" ? "All teams & agents across the platform" : "Your team's performance breakdown"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Agents" value={agents.length} icon={Users} iconColor="text-blue-400" accentClass="accent-blue" delay={0} />
        <MetricCard label="Active" value={activeCount} sub="with at least 1 sale" icon={ShieldCheck} iconColor="text-emerald-400" accentClass="accent-green" delay={0.08} />
        <MetricCard label="Eligible" value={eligibleCount} sub="for payout" icon={Target} iconColor="text-amber-400" accentClass="accent-amber" delay={0.16} />
        <MetricCard label="Total Sales" value={totalSold} icon={TrendingUp} iconColor="text-purple-400" accentClass="accent-purple" delay={0.24} />
      </div>

      {/* Team Operational Averages */}
      <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl p-6">
         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
               <Headset size={18} />
            </div>
            <div>
               <h3 className="text-lg font-black tracking-tight">Team Averages</h3>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Operational & Compensation Overview</p>
            </div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label="Avg Talktime" value={avgTalktime} icon={Phone} iconColor="text-blue-400" accentClass="accent-blue" delay={0} />
            <MetricCard label="Avg Quality" value={avgQuality} icon={Star} iconColor="text-amber-400" accentClass="accent-amber" delay={0.05} />
            <MetricCard label="Avg Calls" value={avgCompletedCalls} icon={Headset} iconColor="text-emerald-400" accentClass="accent-green" delay={0.1} />
            <MetricCard label="Total Incentive" value={totalIncentive > 0 ? `₹${totalIncentive.toLocaleString()}` : "0"} icon={Coins} iconColor="text-fuchsia-400" accentClass="accent-fuchsia" delay={0.15} />
            <MetricCard label="Total Payout" value={totalFinalPayout > 0 ? `₹${totalFinalPayout.toLocaleString()}` : "0"} icon={Banknote} iconColor="text-purple-400" accentClass="accent-purple" delay={0.2} />
            <MetricCard label="5K+ Funnel" value={totalFunnel5k} icon={Target} iconColor="text-indigo-400" accentClass="accent-indigo" delay={0.25} />
         </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="agents">
        {/* Tab bar + Search/Sort/View controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="agents" className="text-xs gap-1.5"><Users size={13} />Agents</TabsTrigger>
            {role !== "AGENT" && <TabsTrigger value="tls" className="text-xs gap-1.5"><Medal size={13} />TL Rankings</TabsTrigger>}
            <TabsTrigger value="chart" className="text-xs gap-1.5"><TrendingUp size={13} />Chart</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, TL, location..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-9 w-36 text-xs gap-1">
                <ArrowUpDown size={11} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSold">Sort: Sales</SelectItem>
                <SelectItem value="achPercent">Sort: Achievement</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-xl border border-border overflow-hidden">
              <Button variant={view === "grid" ? "default" : "ghost"} size="sm" className="h-9 px-3 rounded-none" onClick={() => setView("grid")}>
                <LayoutGrid size={14} />
              </Button>
              <Button variant={view === "table" ? "default" : "ghost"} size="sm" className="h-9 px-3 rounded-none" onClick={() => setView("table")}>
                <List size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Agents Tab */}
        <TabsContent value="agents">
          {search && (
            <p className="text-xs text-muted-foreground mb-3">{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"</p>
          )}

          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((agent: any, idx: number) => {
                const mapped = {
                  empId: agent.empId,
                  email: agent.email || "",
                  performance: {
                    achPercent: agent.achPercent ?? agent.performance?.achPercent ?? "0%",
                    planSaleTarget: agent.planSaleTarget ?? agent.performance?.planSaleTarget ?? 0,
                    totalSold: agent.totalSold ?? agent.performance?.totalSold ?? 0,
                    eligibility: agent.eligibility ?? agent.performance?.eligibility ?? "Not Eligible",
                    finalPayout: agent.finalPayout ?? agent.performance?.finalPayout ?? 0,
                  },
                };
                return <AgentCard key={agent.empId ?? idx} agent={mapped} />;
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
                  No agents match your search
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="table-row-hover">
                  <TableHeader>
                    <TableRow className="border-border bg-muted/30">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>EmpID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team Leader</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Ach%</TableHead>
                      <TableHead className="text-right">Payout</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a: any, i: number) => {
                      const ach = parsePercent(a.achPercent ?? a.performance?.achPercent);
                      const elig = a.eligibility ?? a.performance?.eligibility ?? "Not Eligible";
                      const payout = a.finalPayout ?? a.performance?.finalPayout ?? 0;
                      return (
                        <TableRow key={a.empId ?? i} className="border-border">
                          <TableCell className="text-[11px] text-muted-foreground font-mono">{i + 1}</TableCell>
                          <TableCell className="font-mono font-bold text-sm">{a.empId}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.email ?? "—"}</TableCell>
                          <TableCell className="text-xs">{a.tlName ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.location ?? a.performance?.location ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{a.planSaleTarget ?? a.performance?.planSaleTarget ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{a.totalSold ?? a.performance?.totalSold ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-mono text-xs font-bold ${ach >= 100 ? "text-emerald-400" : ach >= 75 ? "text-amber-400" : ach >= 50 ? "text-orange-400" : "text-red-400"}`}>
                              {a.achPercent ?? a.performance?.achPercent ?? "0%"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{payout > 0 ? `₹${payout.toLocaleString()}` : "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] ${elig === "Eligible" ? "badge-success" : "badge-danger"}`}>
                              {elig}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No agents found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TL Rankings */}
        {role !== "AGENT" && (
          <TabsContent value="tls">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <Table className="table-row-hover">
                <TableHeader>
                  <TableRow className="border-border bg-muted/30">
                    <TableHead className="w-14">Rank</TableHead>
                    <TableHead>Team Leader</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Agents</TableHead>
                    <TableHead className="text-right">Total Sold</TableHead>
                    <TableHead className="text-right">Ach%</TableHead>
                    <TableHead className="text-right">DRR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tls.map((tl: any, i: number) => {
                    const rank = tl.rank ?? i + 1;
                    return (
                      <TableRow key={tl.tlName ?? i} className="border-border">
                        <TableCell>
                          <span className={`inline-flex size-7 items-center justify-center rounded-lg border text-[11px] font-bold font-mono ${
                            rank === 1 ? "bg-yellow-500/15 border-yellow-500/20 text-yellow-400" :
                            rank === 2 ? "bg-zinc-400/15 border-zinc-400/20 text-zinc-400" :
                            rank === 3 ? "bg-orange-500/15 border-orange-500/20 text-orange-400" :
                            "bg-muted border-transparent text-muted-foreground"
                          }`}>{rank}</span>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{tl.tlName ?? tl.empId}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{tl.location ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{tl.agentCount ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">{tl.totalSold ?? tl.performance?.totalSold ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-xs font-bold text-emerald-400">{tl.achPercent ?? "0%"}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-[10px]">{tl.drr ?? tl.performance?.drr ?? 0}/day</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {tls.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No TL data available</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}

        {/* Chart Tab */}
        <TabsContent value="chart">
          <div className="h-[420px]">
            <AgentLeaderboardChart agents={chartAgents} />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
