'use client';

import React, { useMemo } from 'react';
import type { AgentRow, SalesRow } from '@/lib/types/dashboard';
import { 
  TrendingUp, Star, Target, Wallet, ShieldAlert, 
  ArrowUpRight, Calendar as CalendarIcon, Info,
  TrendingDown, CheckCircle2, Clock, User
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Area, AreaChart 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentSalesTable } from './AgentSalesTable';
import { CustomerRecordsTable } from './CustomerRecordsTable';
import { PerformanceCard } from './PerformanceCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { calculateTargetStats, THRESHOLDS } from '@/lib/utils/normalization';
import { format, differenceInDays, endOfMonth, startOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { EmptyState } from '@/components/shared/EmptyState';
import { Users2, BarChart3, ListChecks } from 'lucide-react';

interface AgentSpecificViewProps {
  agentData: AgentRow | null;
  salesRecords: SalesRow[];
  hasPermission: boolean;
}

function MiniKPI({ label, value, icon: Icon, color, tooltip }: { label: string; value: string; icon: React.ElementType; color: string; tooltip?: string }) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20 cursor-help">
      <div className={`flex items-center justify-center size-9 rounded-lg ${color}`}>
        <Icon className="size-4 text-white/90" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-lg font-bold font-heading text-foreground leading-none">{value}</p>
      </div>
    </div>
  );

  if (!tooltip) return content;

  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-center">
          {tooltip}
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

export function AgentSpecificView({ agentData, salesRecords, hasPermission }: AgentSpecificViewProps) {
  const stats = useMemo(() => {
    if (!agentData) return null;
    
    const today = new Date();
    const monthEnd = endOfMonth(today);
    const monthStart = startOfMonth(today);
    const dayOfMonth = today.getDate();
    const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const remainingDays = Math.max(1, totalDaysInMonth - dayOfMonth + 1);
    
    const target = agentData.planTarget || 0;
    const sold = agentData.totalSold || 0;
    
    const calculated = calculateTargetStats(target, sold, remainingDays);
    const actualDRR = Math.round(sold / dayOfMonth) || 0;

    // Build trend data for the current month
    const daysArr = eachDayOfInterval({ start: monthStart, end: today });
    const trendChartData = daysArr.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySales = salesRecords.filter(s => s.planDate === dateStr).length;
      return {
        date: format(day, 'dd MMM'),
        Actual: daySales,
        Benchmark: Math.round(target / totalDaysInMonth)
      };
    });

    return { ...calculated, actualDRR, trendChartData, remainingDays, totalDaysInMonth };
  }, [agentData, salesRecords]);

  if (!hasPermission) {
    return (
      <EmptyState 
        icon={ShieldAlert}
        title="Access Denied"
        description="You don't have permission to view this agent's data. Please contact your administrator if you believe this is an error."
      />
    );
  }

  if (!agentData || !stats) {
    return (
      <EmptyState 
        icon={Users2}
        title="No Agent Records"
        description="No sales or engagement data found for this agent in the current period."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Personal KPI Grid (4 Columns) ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniKPI
          label="Total Achieved"
          value={stats.achieved.toString()}
          icon={TrendingUp}
          color="bg-emerald-500 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.3)]"
        />
        <MiniKPI
          label="Sale Points"
          value={Math.round(agentData.salePoints).toString()}
          icon={Star}
          color="bg-blue-500 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.3)]"
        />
        <MiniKPI
          label="Daily Run Rate (DRR)"
          value={stats.drr.toString()}
          icon={Clock}
          color="bg-amber-500 shadow-[0_4px_12px_-2px_rgba(245,158,11,0.3)]"
          tooltip="Required sales units per remaining working day to hit your monthly target."
        />
        <MiniKPI
          label="Incentive Earned"
          value={`₹${Math.round(agentData.finalPayout).toLocaleString('en-IN')}`}
          icon={Wallet}
          color="bg-purple-500 shadow-[0_4px_12px_-2px_rgba(168,85,247,0.3)]"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── High-Impact Detail Metrics (12 Col Grid) ───────────────── */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* DRR Insight Chart */}
          <Card className="border-border shadow-sm bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Performance Velocity
              </CardTitle>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                 <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-primary" /> Actual</div>
                 <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-muted border border-primary/20" /> Benchmark</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fill: 'var(--muted-foreground)', fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 backdrop-blur-md border border-border p-2 rounded-lg shadow-xl text-[10px] font-bold">
                            <p className="border-b border-border/50 pb-1 mb-1">{data.date}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="flex items-center gap-1.5 py-0.5">
                                <span className="size-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                {p.name}: <span className="text-foreground">{p.value} Sales</span>
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null;
                    }} />
                    <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} barSize={14} />
                    <Line 
                      type="monotone" 
                      dataKey="Benchmark" 
                      stroke="#F59E0B" 
                      strokeWidth={2} 
                      strokeDasharray="4 4" 
                      dot={false}
                      name="Daily Benchmark" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ── High-Threshold Performance Cockpits (10K / 50K) ─────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <PerformanceCard 
               title="10K Performance" 
               threshold={THRESHOLDS.LEVEL_1} 
               sales={salesRecords} 
               color="#3B82F6"
             />
             <PerformanceCard 
               title="50K Elite Tracker" 
               threshold={THRESHOLDS.LEVEL_2} 
               sales={salesRecords} 
               color="#F59E0B"
             />
          </div>
        </div>

        {/* ── 4-Col Wide Side Section ────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Target Summary Sidebar */}
          <Card className="border-border shadow-md bg-card/60 overflow-hidden ring-1 ring-primary/5">
             <div className="h-1 bg-gradient-to-r from-primary to-amber-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Target Compliance Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end border-b border-border/60 pb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Required DRR</p>
                  <p className="text-4xl font-black text-foreground tracking-tighter">{stats.drr}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Actual Pace</p>
                  <p className={`text-base font-black ${stats.actualDRR >= stats.drr ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {stats.actualDRR} / day
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Achievement Matrix</span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full bg-muted border border-border/80 ${stats.percent >= 100 ? 'text-emerald-500' : 'text-primary'}`}>
                     {stats.percent}% Met
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted border border-border/20 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${stats.percent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(stats.percent, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                   <div className="bg-muted/30 p-2 rounded-lg border border-border/50">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Target</p>
                      <p className="text-sm font-black text-foreground">{stats.target}</p>
                   </div>
                   <div className="bg-muted/30 p-2 rounded-lg border border-border/50 text-right">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Achieved</p>
                      <p className="text-sm font-black text-foreground">{stats.achieved}</p>
                   </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                   <CalendarIcon className="size-3.5 opacity-50 text-primary" /> 
                   <span>{format(new Date(), 'MMMM yyyy')} Period</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold p-2 rounded-lg bg-primary/5 border border-primary/20 text-primary">
                   <div className="flex items-center gap-2">
                      <Clock className="size-3.5" /> 
                      <span>Time Remaining:</span>
                   </div>
                   <span>{stats.remainingDays} Days Left</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Focus Section (Quick Stats) */}
          <Card className="border-border shadow-sm bg-muted/20">
             <CardHeader className="p-4 pb-0">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                   <Users2 className="size-3.5" /> Client Base Audit
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4 pt-4 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                         <ListChecks className="size-4 text-primary" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-tight">Total Customers</span>
                   </div>
                   <span className="text-lg font-black">{salesRecords.length}</span>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Exploration Tabs: Buckets & Monthly Matrix ───────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
           <h2 className="text-lg font-black font-heading text-foreground uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" /> Monthly Activity Matrix
           </h2>
           <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6 border border-border/50 h-11">
            <TabsTrigger value="all" className="text-xs px-6 font-bold uppercase tracking-widest h-9">
               Customer Records (From Sheet) <span className="ml-2 text-[10px] opacity-50">({salesRecords.length})</span>
            </TabsTrigger>
            <TabsTrigger value="10k" className="text-xs px-6 font-bold uppercase tracking-widest h-9">
               ≥ 10K High Value <span className="ml-2 text-[10px] opacity-50">({salesRecords.filter(s => s.planCost >= THRESHOLDS.LEVEL_1).length})</span>
            </TabsTrigger>
            <TabsTrigger value="50k" className="text-xs px-6 font-bold uppercase tracking-widest h-9">
               ≥ 50K Elite Tier <span className="ml-2 text-[10px] opacity-50">({salesRecords.filter(s => s.planCost >= THRESHOLDS.LEVEL_2).length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="animate-in fade-in slide-in-from-bottom-2">
            <CustomerRecordsTable sales={salesRecords} />
          </TabsContent>
          
          <TabsContent value="10k" className="animate-in fade-in slide-in-from-bottom-2">
            <CustomerRecordsTable sales={salesRecords.filter(s => s.planCost >= THRESHOLDS.LEVEL_1)} />
          </TabsContent>
          
          <TabsContent value="50k" className="animate-in fade-in slide-in-from-bottom-2">
            <CustomerRecordsTable sales={salesRecords.filter(s => s.planCost >= THRESHOLDS.LEVEL_2)} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Grid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
             <User className="size-3.5" /> Employee Data Profile
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {[
            { label: 'Employee ID', value: agentData.empId },
            { label: 'Email', value: agentData.emailId },
            { label: 'Team Lead', value: agentData.tlName },
            { label: 'Tenure', value: agentData.tenure },
            { label: 'Grade', value: agentData.grade },
            { label: 'Location', value: agentData.location },
            { label: 'Present Days', value: agentData.presentDays.toString() },
            { label: 'Talktime', value: `${agentData.talktime} min` },
            { label: 'Completed Calls', value: agentData.completedCalls.toLocaleString('en-IN') },
            { label: 'Plan Target', value: agentData.planTarget.toString() },
            { label: 'Slab', value: agentData.slab || '—' },
            { label: 'Bonus', value: agentData.bonus.toString() },
            { label: 'Super Bonus', value: agentData.superBonus.toString() },
            { label: 'Incentives Earned', value: `₹${Math.round(agentData.incentivesEarned).toLocaleString('en-IN')}` },
            { label: 'Payout Factor', value: `${agentData.payoutFactor}x` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card px-4 py-4 hover:bg-muted/10 transition-colors">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">{label}</p>
              <p className="text-sm font-black text-foreground tracking-tight">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
