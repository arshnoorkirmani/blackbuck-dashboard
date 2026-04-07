"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Target, MapPin, Building2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TeamCardProps {
  team: any;
}

export function TeamCard({ team }: TeamCardProps) {
  const router = useRouter();
  
  const perf = team.performance || {};
  const totals = team.totals || {};
  const achPercent = parseFloat(String(perf.achPercent || "0").replace("%", "")) || 0;
  const rank = team.rank || 0;
  const totalSold = perf.totalSold || 0;
  const drr = perf.drr || 0;
  const totalAmount = totals.totalAmount || 0;
  const location = team.location || "North Region";

  const statusColor = 
    achPercent >= 100 ? "text-emerald-500" : 
    achPercent >= 75  ? "text-amber-500" : 
    achPercent >= 50  ? "text-orange-500" : "text-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full relative group"
    >
      <div className="h-full flex flex-col overflow-hidden bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shadow-sm transition-transform duration-300">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-lg font-bold tracking-tight text-foreground transition-colors">{team.tlName}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider opacity-80">{location}</p>
              </div>
            </div>
          </div>
          {rank > 0 && (
            <div className="bg-muted px-3 py-1.5 rounded-xl border border-border flex flex-col items-center">
               <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-1">Rank</span>
               <span className="text-sm font-bold text-primary">#{rank}</span>
            </div>
          )}
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-6 mb-6 flex-1">
          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Sales Volume</p>
            <div className="flex items-end gap-1">
               <span className="text-2xl font-bold tracking-tight text-foreground">{totalSold}</span>
               <span className="text-[10px] font-semibold text-muted-foreground mb-1">units</span>
            </div>
          </div>
          
          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Achievement</p>
            <div className="flex items-end gap-1">
               <span className={`text-2xl font-bold tracking-tight ${statusColor}`}>{achPercent}%</span>
               <TrendingUp size={14} className={`${statusColor} mb-1.5 opacity-80`} />
            </div>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Yield (Inc)</p>
            <p className="text-lg font-bold tracking-tight text-foreground">₹{(totalAmount / 1000).toFixed(1)}k</p>
          </div>

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">DRR</p>
            <div className="flex items-center gap-2">
               <span className="text-lg font-bold text-primary">{drr}</span>
               <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (drr / 10) * 100)}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <Button 
          variant="secondary"
          className="w-full h-10 rounded-xl font-semibold text-xs tracking-wider gap-2 bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 group/btn"
          onClick={() => {
            router.push(`/team?tl=${encodeURIComponent(team.tlName)}`);
          }}
        >
          Explore Performance
          <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
}
