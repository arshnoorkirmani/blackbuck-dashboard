"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AgentLeaderboardChart } from "@/components/dashboard/charts/AgentLeaderboardChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GlobalFilterPanel } from "@/components/dashboard/GlobalFilterPanel";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { useFilteredAgents } from "@/hooks/useFilteredData";
import { 
  Users, Shield, UserCheck, Activity, Plus, Trash2, Search, 
  Download, UserPlus, Filter, LayoutGrid, Zap, ArrowUpRight,
  Mail, ShieldCheck, MapPin, User
} from "lucide-react";

interface AdminDashboardProps {
  data?: any;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const { globalFilters } = useDashboardStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("AGENT");

  // Pull real data from API if available
  const allTeams: any[] = data?.allTeams ?? [];
  const allAgents: any[] = useMemo(() =>
    allTeams.flatMap((t: any) => t.agents ?? []),
    [allTeams]
  );
  const totalTLs = allTeams.length;
  const totalAgents = allAgents.length;
  const filteredAgents = useFilteredAgents(allAgents);

  const eligible = filteredAgents.filter((a) => (a.performance?.eligibility ?? a.eligibility) === "Eligible").length;
  const totalSold = filteredAgents.reduce((s, a) => s + (a.performance?.totalSold ?? a.totalSold ?? 0), 0);
  const totalTarget = filteredAgents.reduce((s, a) => s + (a.performance?.planSaleTarget ?? 0), 0);
  const totalAchievePoint = filteredAgents.reduce((s, a) => s + (a.performance?.totalSalePoint ?? a.performance?.salePointAch ?? 0), 0);
  const total10kCount = filteredAgents.reduce((s, a) => s + (a.performance?.converted10k ?? 0), 0);
  const tenKPercent = filteredAgents.length > 0 ? ((total10kCount / filteredAgents.length) * 100).toFixed(1) + "%" : "0%";

  const topAgents = useMemo(() =>
    [...filteredAgents]
      .sort((a, b) => (b.performance?.totalSold ?? b.totalSold ?? 0) - (a.performance?.totalSold ?? a.totalSold ?? 0))
      .slice(0, 10)
      .map((a) => ({
        empId: a.empId,
        totalSold: a.performance?.totalSold ?? a.totalSold ?? 0,
        achPercent: a.performance?.achPercent ?? a.achPercent ?? "0%",
        tlName: a.tlName ?? "—",
      })),
    [filteredAgents]
  );

  const ACTIVITY_LOG = [
    { action: "Dashboard data refreshed", time: "Just now", type: "info", icon: Zap },
    { action: `${totalAgents} agents loaded from API`, time: "Just now", type: "add", icon: UserCheck },
    { action: `${eligible} agents eligible for payout`, time: "Just now", type: "success", icon: ShieldCheck },
    { action: `Total ${totalSold} sales this month`, time: "Just now", type: "sales", icon: Activity },
    { action: `Achieved ${totalAchievePoint} pts against ${totalTarget}`, time: "Just now", type: "info", icon: Zap },
  ];

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
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Command Center v2.0</span>
          </div>
          <h1 className="font-heading text-4xl font-black text-foreground tracking-tight drop-shadow-sm">
            Admin <span className="text-primary">Control</span> Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Strategic overview of <span className="text-foreground">{totalTLs} departments</span> and <span className="text-foreground">{totalAgents} agents</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GlobalFilterPanel />
          <Button 
            onClick={() => setShowAdd(true)} 
            className="h-10 px-5 gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <UserPlus size={16} /> 
            Add Personnel
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 lg:gap-5">
        <MetricCard label="Strategic Units" value={totalTLs} icon={LayoutGrid} iconColor="text-indigo-400" accentClass="accent-purple" delay={0} />
        <MetricCard label="Personnel" value={filteredAgents.length} icon={Users} iconColor="text-blue-400" accentClass="accent-blue" delay={0.1} />
        <MetricCard label="Target Qualified" value={eligible} sub="Eligible for Payout" icon={ShieldCheck} iconColor="text-emerald-400" accentClass="accent-green" delay={0.2} />
        <MetricCard label="Gross Volume" value={totalSold.toLocaleString()} icon={Activity} iconColor="text-rose-400" accentClass="accent-red" delay={0.3} />
        <MetricCard label="Total Target" value={totalTarget.toLocaleString()} icon={UserCheck} iconColor="text-amber-400" accentClass="accent-amber" delay={0.4} />
        <MetricCard label="Achieve Point" value={totalAchievePoint.toLocaleString()} icon={Zap} iconColor="text-cyan-400" accentClass="accent-cyan" delay={0.5} />
        <MetricCard label="10K %" value={tenKPercent} sub={`Total 10K+: ${total10kCount}`} icon={Activity} iconColor="text-fuchsia-400" accentClass="accent-fuchsia" delay={0.6} />
      </div>

      {/* Analytics Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Chart Component */}
        <div className="lg:col-span-8 bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-xl shadow-black/5 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black tracking-tight">Performance Spectrum</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1 opacity-60">Top Agent Analysis</p>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 w-32 text-[10px] uppercase font-bold tracking-widest bg-muted/50 border-none">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[340px] w-full">
            <AgentLeaderboardChart agents={topAgents} />
          </div>
        </div>

        {/* System Logs & Summaries */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl overflow-hidden border-none shadow-2xl">
            <div className="px-6 py-5 bg-primary/5 border-b border-primary/10">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Operational Stream</h3>
            </div>
            <div className="p-4 space-y-1">
              {ACTIVITY_LOG.map((log, i) => {
                const Icon = log.icon;
                return (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex gap-4 items-start p-3.5 rounded-xl hover:bg-muted/30 transition-all cursor-default group"
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                      log.type === "add"     ? "bg-blue-500/10 text-blue-400" :
                      log.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                      log.type === "sales"   ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-[13px] text-foreground font-bold leading-tight">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-1 opacity-60">{log.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-lg">
            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-4">Unit Summary</h3>
            <div className="space-y-3">
              {allTeams.slice(0, 4).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                      {t.tlName?.charAt(0) || "T"}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{t.tlName}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.agents?.length ?? 0} Personnel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary font-mono">{t.performance?.totalSold ?? t.totals?.totalSold ?? 0}</p>
                    <div className="flex items-center gap-1 justify-end text-[9px] font-bold text-emerald-400 uppercase">
                      <ArrowUpRight size={10} /> Live
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Exploration Center */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-8 py-6 bg-muted/10 border-b border-border/50">
          <div>
            <h3 className="text-xl font-black tracking-tight">Personnel Directory</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Full system access · Real-time metrics</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-background">
                  <Download size={12} className="mr-1.5" /> Export CSV
                </Button>
                <div className="w-[1px] h-4 bg-border/50 self-center mx-1" />
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-background">
                  <Download size={12} className="mr-1.5" /> Excel
                </Button>
             </div>
             
             <div className="relative w-full sm:w-64">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
               <Input
                 placeholder="Fast search..."
                 className="pl-9 h-10 text-sm font-bold bg-background border-border/50 rounded-xl focus:ring-primary/20"
                 // This would sync back to globalFilters.agentSearch if needed, 
                 // but we already have it in GlobalFilterPanel.
               />
             </div>
          </div>
        </div>

        <Tabs defaultValue="table" className="w-full">
          <div className="px-8 pt-4 border-b border-border/50 flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50">
              <TabsTrigger value="table" className="h-8 px-5 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Table Architecture</TabsTrigger>
              <TabsTrigger value="charts" className="h-8 px-5 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Metrics Visualizer</TabsTrigger>
            </TabsList>
            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Showing {filteredAgents.length} of {totalAgents} records
            </div>
          </div>

          <TabsContent value="table" className="m-0">
            <div className="overflow-x-auto">
              <Table className="table-row-hover">
                <TableHeader>
                  <TableRow className="border-border/50 bg-muted/20">
                    <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-widest py-5">#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Employee Identifier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact Channel</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Lead Supervisor</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Gross Sales</TableHead>
                    <TabsTrigger value="charts" className="hidden lg:table-cell" /> {/* spacer */}
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Yield %</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Net Payout</TableHead>
                    <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">System Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredAgents.map((a: any, i: number) => {
                      const ach = parseFloat(a.performance?.achPercent ?? a.achPercent ?? "0");
                      const elig = a.performance?.eligibility ?? a.eligibility ?? "Not Eligible";
                      const payout = a.performance?.finalPayout ?? a.finalPayout ?? 0;
                      return (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={a.empId ?? i} 
                          className="border-border/50 group h-16"
                        >
                          <TableCell className="text-center font-black text-[10px] text-muted-foreground/40 font-mono">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px] border border-border/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {a.empId?.slice(-2)}
                              </div>
                              <span className="font-black text-sm tracking-tight text-foreground">{a.empId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground/80">{a.email ?? "—"}</TableCell>
                          <TableCell className="text-xs font-bold text-foreground/70">{a.tlName ?? "—"}</TableCell>
                          <TableCell className="text-right font-black text-sm tracking-tighter">{a.performance?.totalSold ?? a.totalSold ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-black text-sm tracking-tighter ${ach >= 100 ? "text-emerald-400" : ach >= 75 ? "text-amber-400" : ach >= 50 ? "text-orange-400" : "text-rose-400"}`}>
                              {a.performance?.achPercent ?? a.achPercent ?? "0%"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-black font-mono text-xs">
                            {payout > 0 ? `₹${payout.toLocaleString()}` : <span className="opacity-20 text-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-[0.1em] border-none px-3 py-1 bg-opacity-10 ${elig === "Eligible" ? "bg-emerald-500 text-emerald-400" : "bg-rose-500 text-rose-400"}`}>
                              {elig}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {filteredAgents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-24">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <Filter size={40} />
                          <p className="text-lg font-black uppercase tracking-widest">No Sector Match Found</p>
                          <p className="text-xs font-bold">Try adjusting your structural filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="m-0 p-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-muted/20 p-8 rounded-3xl border border-border/50">
                   <h4 className="text-sm font-black uppercase tracking-widest mb-8">Performance Spectrum</h4>
                   <div className="h-[400px]">
                     <AgentLeaderboardChart agents={topAgents} />
                   </div>
                </div>
                <div className="bg-muted/20 p-8 rounded-3xl border border-border/50">
                   <h4 className="text-sm font-black uppercase tracking-widest mb-8">Unit Distribution</h4>
                   {/* Placeholder for more charts or stats */}
                   <div className="flex items-center justify-center h-[400px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-30">
                      Visualizer 3.0 Ready
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Add User Dialog (Redesigned) ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/95 backdrop-blur-2xl border border-border rounded-[2rem] overflow-hidden shadow-2xl"
          >
            <div className="px-10 py-10 bg-primary/10 border-b border-primary/20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              <div className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
                <UserPlus size={28} strokeWidth={2.5} />
              </div>
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight leading-tight">Personnel <br/> <span className="text-primary">Recruitment</span></DialogTitle>
                <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-3 opacity-60">
                  Deploy new agent into the operational matrix
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Legal Name</Label>
                  <div className="relative">
                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <Input 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      placeholder="e.g. Major Arjun" 
                      className="h-12 pl-12 rounded-xl bg-muted/40 border-border focus:ring-primary/20 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Communication Channel</Label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <Input 
                      type="email" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      placeholder="arjun@matrix.ops" 
                      className="h-12 pl-12 rounded-xl bg-muted/40 border-border focus:ring-primary/20 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Operational Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border font-bold text-sm px-5">
                        <div className="flex items-center gap-2">
                           <Shield size={14} className="text-primary" />
                           <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        <SelectItem value="AGENT" className="font-bold py-3 px-4">Field Agent</SelectItem>
                        <SelectItem value="TL" className="font-bold py-3 px-4">Squad Leader</SelectItem>
                        <SelectItem value="ADMIN" className="font-bold py-3 px-4">System Controller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Primary Zone</Label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                      <Input 
                        placeholder="e.g. Sector 7, Bangalore" 
                        className="h-12 pl-12 rounded-xl bg-muted/40 border-border focus:ring-primary/20 font-bold"
                      />
                    </div>
                  </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-muted/20 border-t border-border/50 flex items-center justify-end gap-4">
              <Button variant="ghost" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-500/10 hover:text-rose-400 transition-colors" onClick={() => setShowAdd(false)}>
                Abort Mission
              </Button>
              <Button className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95" onClick={() => setShowAdd(false)}>
                Deploy Unit
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

