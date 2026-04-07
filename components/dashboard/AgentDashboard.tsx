"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AchievementGauge } from "@/components/dashboard/charts/AchievementGauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, TrendingUp, Award, CalendarDays, AlertTriangle, AlertCircle, Info,
  CheckCircle2, Flame, Clock, Zap, ArrowUpRight, Trophy,
  Activity, Star, ShieldCheck, Mail, Users,
  Phone, Headset, CalendarCheck, Percent, Banknote, Coins, BarChartHorizontal
} from "lucide-react";

interface AgentDashboardProps {
  data?: any;
}

const alertConfig: Record<string, { icon: typeof AlertTriangle; border: string; bg: string; text: string }> = {
  critical: { icon: AlertCircle, border: "border-rose-500/30", bg: "bg-rose-500/5", text: "text-rose-400" },
  warning:  { icon: AlertTriangle, border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-400" },
  info:     { icon: Info, border: "border-blue-500/30", bg: "bg-blue-500/5", text: "text-blue-400" },
};

export function AgentDashboard({ data }: AgentDashboardProps) {
  const agent = data?.agent;
  const team  = data?.team;

  const totalSold     = agent?.performance?.totalSold ?? 0;
  const totalSalePoint= agent?.performance?.totalSalePoint ?? agent?.performance?.salePointAch ?? 0;
  const planSaleTarget= agent?.performance?.planSaleTarget ?? 0;
  const achPercentRaw = agent?.performance?.achPercent ?? "0%";
  const achPercent    = parseFloat(String(achPercentRaw).replace("%", "")) || 0;
  const eligibility   = agent?.performance?.eligibility ?? "Not Eligible";
  const finalPayout   = agent?.performance?.finalPayout ?? 0;
  const rank          = agent?.performance?.rank ?? "-";
  const drr           = agent?.drr?.drr ?? 0;
  const daysLeft      = agent?.drr?.remainingDays ?? 0;
  const soldToday     = agent?.salesSummary?.today?.salesCount ?? 0;
  const soldThisWeek  = agent?.salesSummary?.thisWeek?.salesCount ?? 0;
  const soldThisMonth = agent?.salesSummary?.thisMonth?.salesCount ?? 0;
  const tlName        = agent?.tlName ?? "–";
  const empId         = agent?.empId ?? "–";
  const email         = agent?.email ?? "";
  const converted10k  = agent?.performance?.converted10k ?? 0;
  const ach10kPercent = agent?.performance?.ach10kPercent ?? "0%";
  const customersObj = agent?.customers;
  const customersList: any[] = Array.isArray(customersObj) ? customersObj : (customersObj?.all ?? []);
  const alerts: any[] = agent?.alerts ?? [];
  
  // New Operational & Compensation Fields (live under agent.performance)
  const talktime         = agent?.performance?.talktime ?? agent?.talktime ?? "–";
  const quality          = agent?.performance?.quality ?? agent?.quality ?? "–";
  const completedCalls   = agent?.performance?.completedCalls ?? agent?.completedCalls ?? "0";
  const attPercent       = agent?.performance?.attPercent ?? agent?.attPercent ?? "0%";
  const presentDays      = agent?.performance?.presentDays ?? agent?.presentDays ?? 0;
  const wfhAttendance    = agent?.performance?.wfhAttendance ?? agent?.wfhAttendance ?? 0;
  const slab             = agent?.performance?.slab ?? "–";
  const incentivesEarned = agent?.performance?.incentivesEarned ?? 0;
  const funnel5k         = agent?.performance?.funnel5k ?? agent?.funnel5k ?? "0";

  const progressPct = planSaleTarget > 0 ? Math.min(100, (totalSold / planSaleTarget) * 100) : 0;
  const isEligible  = eligibility === "Eligible";

  const now = new Date();
  const hourGreet = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 lg:p-8 space-y-8 max-w-[1600px] mx-auto"
    >
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Personal Matrix v2.0</span>
          </div>
          <h1 className="font-heading text-4xl font-black text-foreground tracking-tight drop-shadow-sm">
            {empId} <span className="text-primary">Dashboard</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground/70">{email}</span>
              {tlName !== "–" && <> · <span className="text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">{tlName} Unit</span></>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-5 py-2.5 rounded-2xl border-2 font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${
            isEligible ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-rose-500/20 bg-rose-500/5 text-rose-400"
          }`}>
            {isEligible ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
            {eligibility}
          </div>
          {finalPayout > 0 && (
            <div className="px-5 py-2.5 rounded-2xl border-2 border-amber-500/20 bg-amber-500/5 text-amber-400 font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
               <Star size={14} className="fill-amber-400/20" />
               ₹{finalPayout.toLocaleString()} Projected Payout
            </div>
          )}
        </div>
      </div>

      {/* ── ALERT STREAM ── */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert: any, i: number) => {
              const cfg = alertConfig[alert.severity] ?? alertConfig.info;
              const AlertIcon = cfg.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-4 px-5 py-4 rounded-2xl border-l-4 shadow-sm ${cfg.border} ${cfg.bg} ${cfg.text}`}
                >
                  <AlertIcon size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-xs uppercase tracking-[0.1em] opacity-60 mb-1">{alert.severity}</p>
                    <p className="font-bold text-sm leading-tight text-foreground/90">{alert.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
        <MetricCard label="Total Target" value={planSaleTarget} icon={Target} iconColor="text-purple-400" accentClass="accent-purple" delay={0} />
        <MetricCard label="Personal Volume" value={totalSold} icon={TrendingUp} iconColor="text-amber-400" accentClass="accent-amber" delay={0.05} />
        <MetricCard label="Matrix Points" value={totalSalePoint} icon={Award} iconColor="text-blue-400" accentClass="accent-blue" delay={0.1} />
        <MetricCard label="Achievement %" value={achPercentRaw} icon={CheckCircle2} iconColor="text-emerald-400" accentClass="accent-green" delay={0.15} />
        <MetricCard label="10K Conversions" value={converted10k} sub={`${ach10kPercent} Target Achieved`} icon={Star} iconColor="text-fuchsia-400" accentClass="accent-fuchsia" delay={0.2} />
        <MetricCard label="Customers Done" value={customersList.length} icon={Users} iconColor="text-indigo-400" accentClass="accent-indigo" delay={0.25} />
      </div>

      {/* ── CORE ANALYTICS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Achievement Core */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
             <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Performance Gauge</h3>
             <div className="h-[200px] w-full items-center justify-center flex">
                <AchievementGauge percent={achPercent} />
             </div>
             <div className="mt-6 text-center">
                <p className="text-3xl font-bold tracking-tight text-foreground">{achPercentRaw}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Total Achievement</p>
             </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <CalendarDays size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">DRR Matrix</h3>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-emerald-500">OPTIMAL</p>
                </div>
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-foreground tracking-tight">{drr}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Units / Day</span>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progress to Target</p>
                  <p className="text-xs font-black text-primary font-mono">{progressPct.toFixed(1)}%</p>
               </div>
               <div className="h-3 bg-muted/30 rounded-full overflow-hidden p-0.5 border border-border/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={`h-full rounded-full shadow-lg ${
                      achPercent >= 100 ? "bg-emerald-500 shadow-emerald-500/20" : 
                      achPercent >= 75 ? "bg-amber-500 shadow-amber-500/20" : 
                      "bg-rose-500 shadow-rose-500/20"
                    }`}
                  />
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                  <Clock size={12} />
                  <span>Only <span className="text-foreground font-black">{daysLeft} operational days</span> remaining</span>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
           <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-lg font-bold tracking-tight">Activity Log</h3>
                 </div>
                 <div className="p-1 bg-muted rounded-lg flex gap-1 border border-border">
                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-semibold uppercase rounded-md">Week</Button>
                    <Button variant="default" size="sm" className="h-7 px-3 text-[10px] font-semibold uppercase rounded-md shadow-sm">Month</Button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                 {[
                   { label: "Shift Output", value: soldToday, color: "text-primary", icon: Zap, sub: "Today" },
                   { label: "Weekly Volume", value: soldThisWeek, color: "text-blue-400", icon: Activity, sub: "Rolling 7d" },
                   { label: "Monthly Gross", value: soldThisMonth, color: "text-emerald-500", icon: TrendingUp, sub: "Total" },
                 ].map((stat, i) => (
                   <div key={i} className="bg-muted/40 border border-border/50 p-4 rounded-xl">
                     <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${stat.color.replace("text-", "bg-")}/10 ${stat.color}`}>
                           <stat.icon size={14} />
                        </div>
                     </div>
                     <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                     <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                     <p className="text-[10px] font-medium text-muted-foreground uppercase mt-1">{stat.sub}</p>
                   </div>
                 ))}
              </div>

              <div className="flex-1 min-h-[160px] border border-dashed border-border rounded-xl flex items-center justify-center p-6 bg-muted/20">
                 <div className="text-center">
                    <Activity size={24} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Temporal visualization initializing...</p>
                 </div>
              </div>
           </div>

           {/* Squad Standing Panel */}
           {team?.leaderboard && (
             <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-muted/10">
                   <div>
                      <h3 className="text-lg font-black tracking-tight">Squad Intelligence</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Team Hierarchy</p>
                   </div>
                   <Badge variant="outline" className="px-3 py-1 rounded-lg border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest">{tlName} Unit</Badge>
                </div>
                <div className="p-4 space-y-2">
                   {team.leaderboard.slice(0, 5).map((m: any, i: number) => {
                     const isSelf = m.empId === empId;
                     return (
                       <motion.div 
                         key={i} 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.7 + (i * 0.05) }}
                         className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                           isSelf ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5" : "hover:bg-muted/30"
                         }`}
                       >
                         <span className={`size-8 flex items-center justify-center rounded-xl font-mono text-[11px] font-black border ${
                            i === 0 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20" :
                            i === 1 ? "bg-zinc-400/20 text-zinc-400 border-zinc-400/20" :
                            i === 2 ? "bg-orange-500/20 text-orange-500 border-orange-500/20" :
                            "bg-muted/40 text-muted-foreground border-transparent"
                         }`}>
                           {i + 1}
                         </span>
                         <div className="flex-1">
                            <p className={`text-sm font-black tracking-tight ${isSelf ? "text-primary" : "text-foreground"}`}>
                               {m.empId} {isSelf && <span className="ml-2 text-[9px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase tracking-widest">Elite</span>}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Squad Member</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black font-mono">{m.totalSold}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${
                               parseFloat(m.achPercent) >= 100 ? "text-emerald-400" : "text-muted-foreground/60"
                            }`}>{m.achPercent}</p>
                         </div>
                       </motion.div>
                     );
                   })}
                </div>
             </div>
           )}
        </div>
      </div>

      {/* ── OPERATIONAL & INCENTIVE METRICS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
         {/* Operational Metrics */}
         <div className="bg-card border border-border/50 rounded-[2.5rem] shadow-xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border/50">
               <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shadow-inner border border-blue-500/20">
                  <Headset size={20} />
               </div>
               <div>
                  <h3 className="text-xl font-black tracking-tight">Operational Quality</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Call metrics & Attendance</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <MetricCard label="Talktime" value={talktime} icon={Phone} iconColor="text-blue-400" accentClass="accent-blue" delay={0.1} />
               <MetricCard label="Quality Score" value={quality} icon={Star} iconColor="text-amber-400" accentClass="accent-amber" delay={0.15} />
               <MetricCard label="Completed Calls" value={completedCalls} icon={CheckCircle2} iconColor="text-emerald-400" accentClass="accent-green" delay={0.2} />
               <MetricCard label="Attendance %" value={attPercent} sub={`${presentDays} pres. | ${wfhAttendance} WFH`} icon={CalendarCheck} iconColor="text-purple-400" accentClass="accent-purple" delay={0.25} />
            </div>
         </div>

         {/* Compensation Details */}
         <div className="bg-card border border-border/50 rounded-[2.5rem] shadow-xl p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border/50">
               <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl shadow-inner border border-amber-500/20">
                  <Banknote size={20} />
               </div>
               <div>
                  <h3 className="text-xl font-black tracking-tight">Compensation Details</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Payout Breakdown</p>
               </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
               <MetricCard label="Achieved Slab" value={slab} icon={BarChartHorizontal} iconColor="text-fuchsia-400" accentClass="accent-fuchsia" delay={0.1} />
               <MetricCard label="Incentives Earned" value={incentivesEarned > 0 ? `₹${incentivesEarned.toLocaleString()}` : "0"} icon={Coins} iconColor="text-amber-400" accentClass="accent-amber" delay={0.15} />
               <MetricCard label=">5k Funnel" value={funnel5k} icon={Target} iconColor="text-indigo-400" accentClass="accent-indigo" delay={0.2} />
               <MetricCard label="Final Payout" value={finalPayout > 0 ? `₹${finalPayout.toLocaleString()}` : "0"} icon={Banknote} iconColor="text-emerald-400" accentClass="accent-green" delay={0.25} />
            </div>
         </div>
      </div>

      {/* ── CUSTOMER DATA TABLE ── */}
      <div className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl mt-8">
         <div className="px-8 py-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
            <div>
               <h3 className="text-xl font-black tracking-tight flex items-center gap-2"><Users size={20} className="text-primary" /> Customer Transaction Data</h3>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-1">Details of verified conversions</p>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1.5 rounded-lg border-primary/20 text-primary font-black uppercase text-[10.5px] tracking-widest bg-primary/5">{customersList.length} Total Customers</Badge>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-muted/20 border-b border-border/50">
                  <tr>
                     <th className="px-8 py-4 font-black w-20">#</th>
                     <th className="px-6 py-4 font-black">Customer ID</th>
                     <th className="px-6 py-4 font-black">Plan details</th>
                     <th className="px-6 py-4 font-black">Date</th>
                     <th className="px-6 py-4 font-black text-right">Txn Value</th>
                     <th className="px-8 py-4 font-black text-right">Points</th>
                  </tr>
               </thead>
               <tbody>
                  {customersList.map((cust: any, i: number) => (
                     <tr key={i} className="border-b border-border/30 hover:bg-muted/10 transition-colors group">
                        <td className="px-8 py-4 font-mono text-muted-foreground/60 group-hover:text-primary transition-colors text-xs font-bold">
                           {(i + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground tracking-tight">
                           {cust.customerId || cust.id || "—"}
                        </td>
                        <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-card/50 text-[10px] tracking-wide font-black border-border">
                                {cust.planDesc || cust.plan || "Unknown"}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground uppercase tracking-wide font-bold">
                           {cust.date || "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                           ₹{(cust.totalTransaction || cust.planCost || cust.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-8 py-4 text-right">
                           <span className="inline-flex items-center justify-center bg-blue-500/10 text-blue-400 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-blue-500/20">
                              {cust.salePoint || cust.points || 0} pts
                           </span>
                        </td>
                     </tr>
                  ))}
                  {customersList.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground uppercase font-black text-[11px] tracking-[0.2em] opacity-60">
                           No verified customers found for this agent
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </motion.div>
  );
}
