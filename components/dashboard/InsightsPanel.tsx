'use client';

import React, { useMemo } from 'react';
import { useFilteredData } from '@/lib/hooks/useDashboardData';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, TrendingDown, Target, 
  Zap, Calendar, Award, BarChart3, 
  ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { parseISO, format, isValid } from 'date-fns';

export function InsightsPanel() {
  const { filteredAgents, filteredSales } = useFilteredData();

  const insights = useMemo(() => {
    if (!filteredSales.length) return null;

    // ── 1. Top Performing Day ──────────────────────────────────────────────
    const dailyMap: Record<string, number> = {};
    filteredSales.forEach(s => {
      const d = s.planDate;
      dailyMap[d] = (dailyMap[d] || 0) + 1;
    });
    const topDay = Object.entries(dailyMap).sort((a,b) => b[1] - a[1])[0];
    let topDayLabel = '—';
    try {
      if (topDay) {
        const d = parseISO(topDay[0]);
        if (isValid(d)) topDayLabel = format(d, 'do MMM');
      }
    } catch(e) {}

    // ── 2. Highest Value Segment (Channel) ─────────────────────────────────
    const channelMap: Record<string, number> = {};
    filteredSales.forEach(s => {
      channelMap[s.channel] = (channelMap[s.channel] || 0) + 1;
    });
    const topChannel = Object.entries(channelMap).sort((a,b) => b[1] - a[1])[0];

    // ── 3. Performance Trend (Momentum) ────────────────────────────────────
    // Split set into halves to see if trending up or down
    const sortedSales = [...filteredSales].sort((a,b) => a.planDate.localeCompare(b.planDate));
    const half = Math.floor(sortedSales.length / 2);
    const firstHalfCount = half > 0 ? sortedSales.slice(0, half).length : 0;
    const secondHalfCount = half > 0 ? sortedSales.slice(half).length : 0;
    
    // Growth vs previous half (approximate)
    const isTrendingUp = secondHalfCount >= firstHalfCount;
    const momentumPercent = firstHalfCount > 0 
      ? Math.round(((secondHalfCount - firstHalfCount) / firstHalfCount) * 100)
      : 0;

    // ── 4. Top Agent in View ───────────────────────────────────────────────
    const topAgent = [...filteredAgents].sort((a,b) => b.totalSold - a.totalSold)[0];

    return {
      topDay: { label: topDayLabel, value: topDay?.[1] || 0 },
      topChannel: { label: topChannel?.[0] || 'Unknown', count: topChannel?.[1] || 0 },
      isTrendingUp,
      momentum: momentumPercent,
      topAgent: { name: topAgent?.emailId.split('@')[0] || '—', sales: topAgent?.totalSold || 0 }
    };
  }, [filteredSales, filteredAgents]);

  if (!insights) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Momentum Insight */}
      <InsightCard 
        label="Sales Momentum"
        value={`${Math.abs(insights.momentum)}%`}
        sub={insights.isTrendingUp ? 'Trending Upward' : 'Decline vs Start'}
        icon={insights.isTrendingUp ? ArrowUpRight : ArrowDownRight}
        color={insights.isTrendingUp ? 'text-emerald-500' : 'text-rose-500'}
        bg={insights.isTrendingUp ? 'bg-emerald-500/10' : 'bg-rose-500/10'}
      />

      {/* Peak Activity */}
      <InsightCard 
        label="Peak Performance"
        value={insights.topDay.label}
        sub={`${insights.topDay.value} Records Logged`}
        icon={Calendar}
        color="text-blue-500"
        bg="bg-blue-500/10"
      />

      {/* Best Segment */}
      <InsightCard 
        label="Top Campaign"
        value={insights.topChannel.label}
        sub={`${insights.topChannel.count} Sales Attributed`}
        icon={Zap}
        color="text-amber-500"
        bg="bg-amber-500/10"
      />

      {/* Top Contributor */}
      <InsightCard 
        label="Prime Contributor"
        value={insights.topAgent.name}
        sub={`${insights.topAgent.sales} Units Delivered`}
        icon={Award}
        color="text-purple-500"
        bg="bg-purple-500/10"
      />

    </div>
  );
}

function InsightCard({ label, value, sub, icon: Icon, color, bg }: any) {
  return (
    <Card className="border-border/50 bg-card/40 shadow-none hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-black text-foreground tracking-tight truncate leading-none mt-1">{value}</p>
          <p className="text-[10px] font-bold text-muted-foreground mt-1 truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
