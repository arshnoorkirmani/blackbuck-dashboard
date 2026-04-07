'use client';

import React, { useEffect, useState } from 'react';
import type { DashboardKPIs } from '@/lib/types/dashboard';
import { TrendingUp, Star, Target, Wallet, AlertCircle, TrendingDown, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KPICardProps {
  label: string;
  value: number;
  format: 'number' | 'percent' | 'currency';
  icon: React.ElementType;
  gradient: string;
  delay: number;
  badge?: {
    label: string;
    color: string;
  };
}

function AnimatedValue({ target, format, duration = 1200 }: { target: number; format: string; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }

    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCurrent(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  if (format === 'percent') return <>{current.toFixed(1)}%</>;
  if (format === 'currency') return <>₹{Math.round(current).toLocaleString('en-IN')}</>;
  return <>{Math.round(current).toLocaleString('en-IN')}</>;
}

function KPICard({ label, value, format, icon: Icon, gradient, delay, badge }: KPICardProps) {
  return (
    <div
      className="relative group overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[3px] ${gradient}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {badge && (
              <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 h-4 border-none ${badge.color}`}>
                {badge.label}
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold font-heading tracking-tight text-foreground">
            <AnimatedValue target={value} format={format} />
          </p>
        </div>
        <div className={`flex items-center justify-center size-10 rounded-lg ${gradient} bg-opacity-10 shrink-0`}>
          <Icon className="size-5 text-white/90" />
        </div>
      </div>
    </div>
  );
}

export function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  const getBadge = (label: string, value: number) => {
    if (label === 'Avg Achievement') {
      if (value < 50) return { label: 'CRITICAL', color: 'bg-destructive/10 text-destructive' };
      if (value < 85) return { label: 'AT RISK', color: 'bg-amber-500/10 text-amber-500' };
      if (value >= 100) return { label: 'ELITE', color: 'bg-emerald-500/10 text-emerald-500' };
    }
    if (label === 'Total Sales' && kpis.avgAchievement < 80) {
      return { label: 'LAGGING', color: 'bg-rose-500/10 text-rose-500' };
    }
    return undefined;
  };

  const cards: Omit<KPICardProps, 'delay'>[] = [
    {
      label: 'Total Sales',
      value: kpis.totalSales,
      format: 'number',
      icon: TrendingUp,
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      badge: getBadge('Total Sales', kpis.totalSales),
    },
    {
      label: 'Sale Points',
      value: kpis.totalPoints,
      format: 'number',
      icon: Star,
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      label: 'Avg Achievement',
      value: kpis.avgAchievement,
      format: 'percent',
      icon: Target,
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
      badge: getBadge('Avg Achievement', kpis.avgAchievement),
    },
    {
      label: 'Total Incentives',
      value: kpis.totalIncentives,
      format: 'currency',
      icon: Wallet,
      gradient: 'bg-gradient-to-r from-amber-500 to-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <KPICard key={card.label} {...card} delay={i * 100} />
      ))}
    </div>
  );
}
