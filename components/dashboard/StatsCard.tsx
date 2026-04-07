import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  sub?: string;
  accent?: string; // tailwind bg class e.g. "bg-purple-500/10"
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendLabel,
  sub,
  accent = "bg-primary/10",
}: StatsCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-border/80 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`flex size-8 items-center justify-center rounded-lg ${accent}`}>
            <Icon size={15} className={iconColor} strokeWidth={2} />
          </div>
        )}
      </div>
      <div>
        <p className="text-[28px] font-heading font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
      </div>
      {trend && trendLabel && (
        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${trendColor}`}>
          <TrendIcon size={12} />
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
