"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AgentCard } from "@/components/dashboard/cards/AgentCard";
import { AgentLeaderboardChart } from "@/components/dashboard/charts/AgentLeaderboardChart";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalFilterPanel } from "@/components/dashboard/GlobalFilterPanel";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { useFilteredAgents } from "@/hooks/useFilteredData";
import { 
  Target, TrendingUp, Users, CheckCircle2, Medal, 
  LayoutGrid, List, Search, ArrowUpDown, Download,
  Filter, Zap, ChevronRight, Activity
} from "lucide-react";

interface TLDashboardProps {
  data?: any;
}

export function TLDashboard({ data }: TLDashboardProps) {
  const { globalFilters } = useDashboardStore();
  const team = data?.team;
  const [sortBy, setSortBy] = useState<"totalSold" | "achPercent" | "finalPayout">("totalSold");
  const [view, setView] = useState<"grid" | "table">("grid");

  const totalSold   = team?.totals?.totalSold ?? 0;
  const totalTarget = team?.totals?.totalTarget ?? 0;
  const achPct = totalTarget > 0 ? Math.round((totalSold / totalTarget) * 100) : 0;
  const allMembers: any[] = team?.leaderboard ?? [];
  const members = allMembers.filter((a) => (a.eligibility ?? a.performance?.eligibility ?? "") !== "" || (a.totalSold ?? a.performance?.totalSold ?? 0) > 0);
  const tlName = team?.tlName ?? "Your Team";

  const filteredUnsorted = useFilteredAgents(members);
  const filtered = useMemo(() => {
    return [...filteredUnsorted].sort((a, b) => {
      if (sortBy === "achPercent") {
        return parseFloat(b.achPercent ?? "0") - parseFloat(a.achPercent ?? "0");
      }
      if (sortBy === "finalPayout") {
        return (b.finalPayout ?? b.performance?.finalPayout ?? 0) - (a.finalPayout ?? a.performance?.finalPayout ?? 0);
      }
      return (b.totalSold ?? b.performance?.totalSold ?? 0) - (a.totalSold ?? a.performance?.totalSold ?? 0);
    });
  }, [filteredUnsorted, sortBy]);

  const filteredTotalSold = filtered.reduce((s, a) => s + (a.totalSold ?? a.performance?.totalSold ?? 0), 0);
  const filteredTotalTarget = filtered.reduce((s, a) => s + (a.planSaleTarget ?? a.performance?.planSaleTarget ?? 0), 0);
  const filteredAchievePoint = filtered.reduce((s, a) => s + (a.totalSalePoint ?? a.performance?.totalSalePoint ?? a.performance?.salePointAch ?? 0), 0);
  const filtered10kCount = filtered.reduce((s, a) => s + (a.converted10k ?? a.performance?.converted10k ?? 0), 0);
  const filtered10kPercent = filtered.length > 0 ? ((filtered10kCount / filtered.length) * 100).toFixed(1) + "%" : "0%";

  // For chart
  const chartAgents = filtered.map((a) => ({
    empId: a.empId ?? a.name,
    totalSold: a.totalSold ?? a.performance?.totalSold ?? 0,
    achPercent: a.achPercent ?? a.performance?.achPercent ?? "0%",
    tlName: a.tlName ?? tlName,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 lg:p-8 space-y-8 max-w-[1600px] mx-auto"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-primary fill-primary/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Squad Operational View</span>
          </div>
          <h1 className="font-heading text-4xl font-black text-foreground tracking-tight">
            {tlName} <span className="text-muted-foreground/30 mx-2">/</span> <span className="text-primary">Performance</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Projecting metrics for <span className="text-foreground">{members.length} active units</span> in your operational sector.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-6 py-3 rounded-2xl border-2 font-heading text-2xl font-black shadow-lg transition-all ${
            achPct >= 100 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/10" :
            achPct >= 75  ? "border-amber-500/30 bg-amber-500/5 text-amber-400 shadow-amber-500/10" :
            "border-rose-500/30 bg-rose-500/5 text-rose-400 shadow-rose-500/10"
          }`}>
            {achPct}% <span className="text-xs font-black uppercase tracking-widest opacity-60 ml-2">Achievement</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
        <MetricCard label="Squad Volume" value={filteredTotalSold} sub={`Target: ${filteredTotalTarget}`} icon={TrendingUp} iconColor="text-amber-400" accentClass="accent-amber" delay={0} />
        <MetricCard label="Active Status" value={filtered.filter((a) => (a.totalSold ?? a.performance?.totalSold ?? 0) > 0).length} sub={`of ${filtered.length} available`} icon={Users} iconColor="text-blue-400" accentClass="accent-blue" delay={0.1} />
        <MetricCard
          label="Quality Verified"
          value={filtered.filter((a) => (a.eligibility ?? a.performance?.eligibility) === "Eligible").length}
          sub="Qualified for Payout"
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          accentClass="accent-green"
          delay={0.2}
        />
        <MetricCard label="Projected Target" value={filteredTotalTarget} icon={Target} iconColor="text-purple-400" accentClass="accent-purple" delay={0.3} />
        <MetricCard label="Achieve Point" value={filteredAchievePoint} icon={Zap} iconColor="text-cyan-400" accentClass="accent-cyan" delay={0.4} />
        <MetricCard label="10K %" value={filtered10kPercent} sub={`Total 10K+: ${filtered10kCount}`} icon={Activity} iconColor="text-fuchsia-400" accentClass="accent-fuchsia" delay={0.5} />
      </div>

      {/* Control Ribbon */}
      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Tabs defaultValue="agents" className="w-auto">
          <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/40">
            <TabsTrigger value="agents" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
              <Users size={12} /> Personnel
            </TabsTrigger>
            <TabsTrigger value="chart" className="h-9 px-6 text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
              <Medal size={12} /> Rankings
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <GlobalFilterPanel />
          
          <div className="h-8 w-[1px] bg-border/50 mx-2 hidden lg:block" />

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="h-10 w-44 text-[10px] font-black uppercase tracking-widest bg-muted/30 border-border/50 rounded-xl">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={12} className="text-primary" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="totalSold" className="font-bold">Metric: Gross Sales</SelectItem>
              <SelectItem value="achPercent" className="font-bold">Metric: Yield %</SelectItem>
              <SelectItem value="finalPayout" className="font-bold">Metric: Net Payout</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
            <Button variant={view === "grid" ? "default" : "ghost"} size="sm" className="h-8 px-3 rounded-lg" onClick={() => setView("grid")}>
              <LayoutGrid size={13} />
            </Button>
            <Button variant={view === "table" ? "default" : "ghost"} size="sm" className="h-8 px-3 rounded-lg" onClick={() => setView("table")}>
              <List size={13} />
            </Button>
          </div>
          
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 hover:bg-primary/5 transition-all">
            <Download size={14} className="mr-2" /> Data Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsContent value="agents" className="m-0 space-y-6">
          <AnimatePresence mode="popLayout">
            {view === "grid" ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filtered.map((agent: any, i: number) => (
                  <AgentCard key={agent.empId ?? i} agent={agent} />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-32 bg-card/20 rounded-3xl border border-dashed border-border/50 opacity-40">
                    <Filter size={48} className="mb-4" />
                    <p className="text-xl font-black uppercase tracking-[0.2em]">Zero Results</p>
                    <p className="text-xs font-bold mt-2">Modify your operational parameters</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
              >
                <Table className="table-row-hover">
                  <TableHeader>
                    <TableRow className="border-border/50 bg-muted/20 h-14">
                      <TableHead className="w-16 text-center text-[10px] font-black uppercase tracking-widest">Rank</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Personnel Identifier</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact Hash</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Capacity</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Gross Yield</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Achievement %</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Net Revenue</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Verification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((a: any, i: number) => {
                      const ach = parseFloat(a.achPercent ?? a.performance?.achPercent ?? "0");
                      const elig = a.eligibility ?? a.performance?.eligibility ?? "Not Eligible";
                      const payout = a.finalPayout ?? a.performance?.finalPayout ?? 0;
                      return (
                        <TableRow key={a.empId ?? i} className="border-border/50 group h-16">
                          <TableCell className="text-center">
                            <span className={`inline-flex size-7 items-center justify-center rounded-xl text-[10px] font-black font-mono border ${
                              i === 0 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20 shadow-lg shadow-yellow-500/10" :
                              i === 1 ? "bg-zinc-400/15 text-zinc-400 border-zinc-400/20" :
                              i === 2 ? "bg-orange-500/15 text-orange-400 border-orange-500/20" : 
                              "bg-muted text-muted-foreground border-transparent opacity-40"
                            }`}>{i + 1}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                               <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                                  {a.empId?.slice(-2)}
                               </div>
                               <span className="font-black text-sm tracking-tight text-foreground">{a.empId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground/60">{a.email ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-muted-foreground">{a.planSaleTarget ?? a.performance?.planSaleTarget ?? "—"}</TableCell>
                          <TableCell className="text-right font-black text-sm tracking-tighter">{a.totalSold ?? a.performance?.totalSold ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-black text-sm tracking-tighter ${ach >= 100 ? "text-emerald-400" : ach >= 75 ? "text-amber-400" : ach >= 50 ? "text-orange-400" : "text-rose-400"}`}>
                              {a.achPercent ?? a.performance?.achPercent ?? "0%"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-black font-mono text-xs text-primary">
                             {payout > 0 ? `₹${payout.toLocaleString()}` : <span className="opacity-20">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-[0.1em] border-none px-3 py-1 bg-opacity-10 ${elig === "Eligible" ? "bg-emerald-500 text-emerald-400" : "bg-rose-500 text-rose-400"}`}>
                              {elig}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="chart" className="m-0 pt-2">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-xl font-black tracking-tight">Efficiency Projection</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Comparative Revenue Analysis</p>
               </div>
               <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest">
                  History <ChevronRight size={12} className="ml-1" />
               </Button>
            </div>
            <div className="h-[480px]">
              <AgentLeaderboardChart agents={chartAgents} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
