"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { User, Target, CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import { useDashboardStore } from "@/lib/store/dashboardStore";

interface AgentCardProps {
  agent: any;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { openAgentModal } = useDashboardStore();

  const perf = agent.performance || {};
  const achPercentRaw = perf.achPercent || "0%";
  const achPercent = parseFloat(String(achPercentRaw).replace("%", "")) || 0;
  const totalSold = perf.totalSold || 0;
  const target = perf.planSaleTarget || 0;
  const payout = perf.finalPayout || 0;
  const eligibility = perf.eligibility || "Not Eligible";
  const isEligible = eligibility === "Eligible";

  // Trajectory Analysis
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const monthProgress = currentDay / daysInMonth;
  const targetTrajectory = target * monthProgress;
  
  const getStatus = () => {
    if (target === 0) return { label: "No Target", color: "text-muted-foreground", bg: "bg-muted", glow: "from-muted/20" };
    if (totalSold >= target) return { label: "Target Met", color: "text-emerald-400", bg: "bg-emerald-500", glow: "from-emerald-500/20" };
    if (totalSold >= targetTrajectory * 1.1) return { label: "Ahead", color: "text-emerald-400", bg: "bg-emerald-500", glow: "from-emerald-500/20" };
    if (totalSold >= targetTrajectory * 0.9) return { label: "On Track", color: "text-blue-400", bg: "bg-blue-500", glow: "from-blue-500/20" };
    if (totalSold >= targetTrajectory * 0.7) return { label: "At Risk", color: "text-amber-400", bg: "bg-amber-500", glow: "from-amber-500/20" };
    return { label: "Behind", color: "text-red-400", bg: "bg-red-500", glow: "from-red-500/20" };
  };

  const status = getStatus();
  const progressPct = target > 0 ? Math.min(100, (totalSold / target) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openAgentModal(agent.empId)}
      className="group relative cursor-pointer"
    >
      <div className="relative h-full bg-card text-card-foreground rounded-2xl p-6 border border-border flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
        {/* Top Section: Avatar & Stats */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`relative size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border border-border/50`}>
              <User size={18} />
              {isEligible && (
                 <div className="absolute top-0 right-0 size-2.5 bg-emerald-500 border-2 border-card rounded-full" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-mono text-sm font-bold truncate text-foreground">{agent.empId}</h4>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{agent.email?.split('@')[0] || "Agent"}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-2xl font-bold text-foreground leading-none">{totalSold}</p>
            <Badge variant="outline" className={`mt-2 py-0 h-4.5 text-[9px] font-bold border-0 uppercase ${status.bg} text-white shadow-sm`}>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Middle: Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-muted-foreground"><Target size={12} /> Target: {target}</span>
            <span className={status.color}>{achPercent}% ACH</span>
          </div>
          <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${status.bg}`} 
            />
          </div>
        </div>

        {/* Footer: Multi-metrics */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-border/40">
           <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                 <Wallet size={12} />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Payout</p>
                 <p className="text-[11px] font-bold text-foreground truncate">₹{payout.toLocaleString()}</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <div className={`size-6 rounded-lg ${isEligible ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"} flex items-center justify-center`}>
                 <TrendingUp size={12} />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Status</p>
                 <p className={`text-[11px] font-bold truncate ${isEligible ? "text-primary" : "text-red-400"}`}>{eligibility}</p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
