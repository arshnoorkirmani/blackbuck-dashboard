"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesOverviewChart } from "@/components/dashboard/charts/SalesOverviewChart";
import { AgentLeaderboardChart } from "@/components/dashboard/charts/AgentLeaderboardChart";
import { PlanBreakdownChart } from "@/components/dashboard/charts/PlanBreakdownChart";
import { TeamCard } from "@/components/dashboard/cards/TeamCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Users, Target, Award, AlertCircle, BarChart3, Table2, PieChart, Building2 } from "lucide-react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { useSession } from "next-auth/react";

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "thisWeek" },
  { label: "Last Week", value: "lastWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Month", value: "lastMonth" },
];

function PageSkeleton() {
  return (
    <div className="p-5 lg:p-8 space-y-6">
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("thisMonth");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const { data: session } = useSession();
  const { data, isLoading, error } = useDashboardQuery("analytics");

  const handleExport = (type: "csv" | "excel") => alert(`Exporting ${type.toUpperCase()}…`);

  const analytics = data?.data?.analytics ?? data?.analytics ?? {};
  const overall = analytics.overall ?? {};
  
  const periodData = analytics.periodComparison?.[period] || {};

  const totalSold = periodData.salesCount ?? overall.totalSold ?? 0;
  const totalAgents = periodData.activeAgents ?? overall.totalAgents ?? 0;
  const totalTarget = overall.totalTarget ?? 0;
  const totalEarned = overall.totalIncentive ?? 0;
  const totalPayout = overall.totalPayout ?? 0;
  
  const dailyTrend: any[] = analytics.dailyTrend ?? [];
  const topAgents: any[] = analytics.topAgents?.bySales ?? [];
  const tlLeaderboard: any[] = analytics.tlLeaderboard ?? [];

  const locations = ["all", ...new Set(tlLeaderboard.map(t => t.location).filter(Boolean))];
  const teams = ["all", ...new Set(tlLeaderboard.map(t => t.tlName).filter(Boolean))];

  const filteredDailyTrend = useMemo(() => {
    if (period === "thisMonth" || period === "lastMonth") return dailyTrend;
    if (period === "thisWeek") return dailyTrend.slice(-7);
    if (period === "lastWeek") return dailyTrend.slice(-14, -7);
    if (period === "yesterday") return dailyTrend.slice(-2, -1);
    if (period === "today") return dailyTrend.slice(-1);
    return dailyTrend;
  }, [dailyTrend, period]);

  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6 lg:p-8 h-full flex items-center justify-center">
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-5 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="font-bold">{error instanceof Error ? error.message : "Failed to load analytics data"}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 lg:p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen bg-transparent text-foreground pb-20"
    >
      {/* Premium Header */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1 w-8 bg-primary rounded-full" />
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Operational Intelligence</p>
            </div>
            <h1 className="font-heading text-4xl lg:text-5xl font-black text-foreground tracking-tight">Analytics <span className="text-primary">Hub</span></h1>
            <p className="text-sm font-medium text-muted-foreground mt-2 max-w-lg">Advanced performance monitoring and real-time incentive tracking for the active sales force.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap bg-card/40 backdrop-blur-md p-2 rounded-2xl border border-border/50 shadow-xl">
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all px-4" onClick={() => handleExport("csv")}>
              <Download size={14} /> CSV
            </Button>
            <Button variant="default" size="sm" className="h-9 gap-1.5 text-xs font-bold shadow-lg shadow-primary/20 px-4" onClick={() => handleExport("excel")}>
              <Download size={14} /> EXCEL REPORT
            </Button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-card/50 backdrop-blur-2xl border border-border/40 p-4 rounded-3xl shadow-2xl shadow-black/5">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Period Range</p>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 text-sm font-bold focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {DATE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs font-bold">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Work Location</p>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 text-sm font-bold focus:ring-primary/20 uppercase tracking-tighter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc} className="text-xs font-bold uppercase">{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Team Unit</p>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 text-sm font-bold focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {teams.map((team) => (
                    <SelectItem key={team} value={team} className="text-xs font-bold">{team === "all" ? "ALL TEAMS" : team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="lg:border-l border-border/30 lg:pl-6 flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Active Force</p>
                <p className="text-2xl font-black text-foreground">{totalAgents}</p>
             </div>
             <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Users size={20} />
             </div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Target" 
          value={totalTarget} 
          icon={Target} 
          iconColor="text-indigo-500" 
          accentClass="accent-indigo" 
          delay={0} 
        />
        <MetricCard 
          label="Total Sales" 
          value={totalSold} 
          icon={TrendingUp} 
          iconColor="text-amber-500" 
          accentClass="accent-amber" 
          delay={0.1} 
        />
        <MetricCard 
          label="Earned Incentive" 
          value={`₹${(totalEarned / 1000).toFixed(1)}k`}
          icon={Award} 
          iconColor="text-emerald-500" 
          accentClass="accent-green" 
          delay={0.2} 
        />
        <MetricCard
          label="Final Payout"
          value={`₹${(totalPayout / 1000).toFixed(1)}k`}
          icon={Target}
          iconColor="text-purple-500"
          accentClass="accent-purple"
          delay={0.3}
        />
      </div>

      {/* Main Analysis Area */}
      <div className="space-y-16 mt-4">
        {/* Sales Trend Chart */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <BarChart3 size={24} className="text-primary"/> Sales Velocity
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2 ml-9">Historical Daily progression</p>
            </div>
            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">
              Live Feed
            </Badge>
          </div>
          <div className="h-[480px] bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 shadow-2xl shadow-black/10 transition-all hover:shadow-primary/5 group/chart">
            <SalesOverviewChart dailyTrend={filteredDailyTrend} />
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Top Performers */}
          <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <div className="mb-4">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Users size={24} className="text-primary"/> Top Performers
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2 ml-9">Agent contribution metrics</p>
            </div>
            
            <div className="h-[400px] bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 shadow-2xl shadow-black/10">
              <AgentLeaderboardChart agents={topAgents.map((a) => ({ empId: a.empId, totalSold: a.totalSold ?? 0, achPercent: a.achPercent, tlName: a.tlName }))} />
            </div>

            <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5">
              <div className="px-8 py-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Elite Squad</h3>
                <Badge className="font-black text-[9px] uppercase">TOP 10</Badge>
              </div>
              <Table className="table-row-hover">
                <TableHeader>
                  <TableRow className="border-border/50 bg-muted/30 h-14">
                    <TableHead className="w-16 pl-8">#</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Agent ID</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Team</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Sales</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Ach%</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Incentive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAgents.map((a: any, i: number) => (
                    <TableRow key={a.empId ?? i} className="border-border/30 h-16 group/row transition-all hover:bg-muted/10">
                      <TableCell className="pl-8">
                        <span className={`inline-flex size-7 items-center justify-center rounded-xl text-[10px] font-bold font-mono transition-transform group-hover/row:scale-110 ${
                          i === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" :
                          i === 1 ? "bg-zinc-400 text-white shadow-lg shadow-zinc-400/20" :
                          i === 2 ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-muted text-muted-foreground"
                        }`}>{i + 1}</span>
                      </TableCell>
                      <TableCell className="font-mono font-black text-sm text-foreground">{a.empId}</TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">{a.tlName}</TableCell>
                      <TableCell className="text-right font-mono font-black text-primary text-base">{a.totalSold ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={parseFloat(a.achPercent ?? "0") >= 100 ? "success" : "warning"} className="font-mono text-[10px] font-black px-2">
                           {a.achPercent ?? "0%"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <p className="font-mono text-sm font-black text-emerald-500">{(a.finalPayout ?? 0) > 0 ? `₹${(a.finalPayout).toLocaleString()}` : "—"}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Right Column Mix */}
          <div className="space-y-12">
            {/* Plan Breakdown */}
            <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-400">
              <div className="mb-4">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <PieChart size={24} className="text-primary"/> Plan Mix
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2 ml-9">Revenue Diversification</p>
              </div>
              <div className="h-[420px] bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 shadow-2xl shadow-black/10 group/pie">
                <PlanBreakdownChart data={analytics?.planBreakdown || {}} />
              </div>
            </section>

            {/* Team Snapshot */}
            <section className="space-y-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Building2 size={24} className="text-primary"/> Squad Ranking
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2 ml-9">Team-level efficiency</p>
                </div>
                <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto">View All</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tlLeaderboard.slice(0, 4).map((team: any, i: number) => (
                  <TeamCard
                    key={team.tlName ?? i}
                    team={{
                      tlName: team.tlName,
                      location: team.location,
                      rank: team.rank ?? i + 1,
                      performance: { totalSold: team.totalSold, achPercent: team.achPercent, drr: team.drr },
                      totals: { totalAmount: (team.totalSold ?? 0) * 1000 },
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Detailed Data Table */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <div className="mb-6 flex items-end justify-between">
             <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Table2 size={24} className="text-primary"/> Data Ledger
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-2 ml-9">Granular transaction logs</p>
            </div>
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
               <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase px-4 rounded-lg bg-background shadow-sm">Sales</Button>
               <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase px-4 rounded-lg opacity-40">Incentive</Button>
            </div>
          </div>
          <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/10">
            <Table className="table-row-hover">
              <TableHeader>
                <TableRow className="border-border/40 bg-muted/30 h-16">
                  <TableHead className="pl-8 font-black uppercase text-[10px] tracking-widest">Date</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Growth Count</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Incentive Volume</TableHead>
                  <TableHead className="text-right pr-8 font-black uppercase text-[10px] tracking-widest">10K Milestone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDailyTrend.map((row: any) => (
                  <TableRow key={row.date} className="border-border/20 h-16 transition-colors hover:bg-muted/10 group/ledg">
                    <TableCell className="pl-8 font-mono text-sm font-black text-foreground">{row.date}</TableCell>
                    <TableCell className="text-right font-mono font-black text-primary text-base group-hover/ledg:scale-105 transition-transform origin-right">{row.salesCount}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-muted-foreground">₹{(row.totalAmount ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                         <Award size={10} />
                         <span className="font-mono text-[10px] font-black">{row.customers10k ?? 0}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
