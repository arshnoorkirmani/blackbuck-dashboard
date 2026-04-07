"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
  accentClass?: string; // e.g. "accent-amber"
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  glowClass?: string; // e.g. "stat-glow-green"
  delay?: number;
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-primary",
  accentClass = "",
  trend,
  trendLabel,
  glowClass = "",
  delay = 0,
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-emerald-500 dark:text-emerald-400" : trend === "down" ? "text-red-500 dark:text-red-400" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative bg-card text-card-foreground border border-border shadow-sm rounded-2xl p-6 flex flex-col gap-5 overflow-hidden transition-all duration-300 group hover:shadow-md ${accentClass}`}
    >
      {/* Content Row */}
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 opacity-80">{label}</p>
          <p className={`text-3xl font-bold tracking-tight text-foreground transition-colors duration-300 ${glowClass}`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`flex size-12 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 ${iconColor} shadow-sm group-hover:scale-105 transition-transform duration-500`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Footer / Trend Area */}
      <div className="flex items-center justify-between relative z-10">
        {trend && trendLabel ? (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 dark:bg-background/20 backdrop-blur-md border border-border/20 ${trendColor} transition-all duration-300 hover:scale-105`}>
            <TrendIcon size={14} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-widest">{trendLabel}</span>
          </div>
        ) : sub ? (
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{sub}</p>
        ) : (
          <div className="h-4" />
        )}
        
        {/* Decorative element */}
        <div className="flex gap-1">
           <span className="size-1 rounded-full bg-primary/20" />
           <span className="size-1 rounded-full bg-primary/40" />
           <span className="size-1 rounded-full bg-primary/60" />
        </div>
      </div>
    </motion.div>
  );
}
