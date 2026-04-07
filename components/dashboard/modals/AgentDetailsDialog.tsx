"use client";

import { useDashboardStore } from "@/lib/store/dashboardStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { User, Award, Percent, DollarSign, Target, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface AgentDetailsDialogProps {
  agentsDataMap: any; // Ideally passing the full parsed data or fetching via React Query by selectedAgentId
}

export function AgentDetailsDialog({ agentsDataMap }: AgentDetailsDialogProps) {
  const { selectedAgentId, closeAgentModal } = useDashboardStore();

  const agent = useMemo(() => {
    if (!selectedAgentId || !agentsDataMap) return null;
    // Assume agentsDataMap could be array or Map. Let's just find by empid or email.
    if (Array.isArray(agentsDataMap)) {
      return agentsDataMap.find(a => a.empId === selectedAgentId || a.email === selectedAgentId);
    }
    // If it's a Map, but we get an array from the parsed structure in AdminDashboard, so passing array is best
    return null;
  }, [selectedAgentId, agentsDataMap]);

  if (!agent) {
    // If agent not found but modal is open, we can just return the empty dialog
    return (
      <Dialog open={!!selectedAgentId} onOpenChange={(open) => !open && closeAgentModal()}>
        <DialogContent>Agent not found</DialogContent>
      </Dialog>
    );
  }

  const perf = agent.performance || {};
  const customers = agent.customers?.all || [];

  return (
    <Dialog open={!!selectedAgentId} onOpenChange={(open) => !open && closeAgentModal()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-card/95 backdrop-blur-2xl border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className="size-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground">
                <User size={32} />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight">{agent.empId}</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
                  {agent.email} • {agent.location} • {agent.tlName}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`font-mono text-sm uppercase tracking-widest px-4 py-1.5 border-none ${perf.eligibility === 'Eligible' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                {perf.eligibility || 'Unknown'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col">
          <div className="px-6 border-b border-border/50 bg-card">
            <TabsList className="bg-transparent h-14 w-full justify-start space-x-6 p-0 rounded-none">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 uppercase font-black text-[10px] tracking-widest">Overview</TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 uppercase font-black text-[10px] tracking-widest">Sales Data</TabsTrigger>
              <TabsTrigger value="customers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 uppercase font-black text-[10px] tracking-widest">Customers</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 h-[450px] overflow-y-auto custom-scrollbar bg-muted/10">
            <TabsContent value="overview" className="m-0 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard icon={<Target size={16} />} label="Target" value={perf.planSaleTarget} />
                <MetricCard icon={<Award size={16} />} label="Sold" value={perf.totalSold} />
                <MetricCard icon={<Percent size={16} />} label="Achievement" value={`${perf.achPercent || "0"}%`} />
                <MetricCard icon={<TrendingUp size={16} />} label="DRR" value={perf.drr || "0"} />
                <MetricCard icon={<DollarSign size={16} />} label="Final Payout" value={`₹${(perf.finalPayout || 0).toLocaleString()}`} className="col-span-2 sm:col-span-4 bg-emerald-500/5 border-emerald-500/20 text-emerald-500" />
              </div>
            </TabsContent>

            <TabsContent value="sales" className="m-0">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-5 border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Today</p>
                   <p className="font-black font-mono text-3xl mt-2">{agent.salesSummary?.today?.salesCount || 0}</p>
                 </div>
                 <div className="p-5 border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">This Week</p>
                   <p className="font-black font-mono text-3xl mt-2">{agent.salesSummary?.thisWeek?.salesCount || 0}</p>
                 </div>
                 <div className="p-5 border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">This Month</p>
                   <p className="font-black font-mono text-3xl mt-2">{agent.salesSummary?.thisMonth?.salesCount || 0}</p>
                 </div>
                 <div className="p-5 border border-border/50 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">All Time</p>
                   <p className="font-black font-mono text-3xl mt-2">{agent.salesSummary?.allTime?.salesCount || 0}</p>
                 </div>
               </div>
            </TabsContent>

            <TabsContent value="customers" className="m-0">
               <div className="border border-border/50 rounded-2xl bg-card overflow-hidden shadow-sm">
                <Table className="table-row-hover">
                  <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md">
                    <TableRow className="border-border/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Phone</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Cost</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Bucket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.slice(0, 50).map((c: any, i: number) => (
                      <TableRow key={i} className="border-border/50 h-14">
                        <TableCell className="font-mono text-xs font-bold">{c.phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[9px] uppercase font-black px-2 py-0.5">{c.planType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-black text-emerald-500">₹{c.planCost}</TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{c.date}</TableCell>
                        <TableCell className="text-xs font-medium truncate max-w-[150px]">{c.txnBucket}</TableCell>
                      </TableRow>
                    ))}
                    {customers.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground text-[10px] font-black uppercase tracking-widest">No customer transactions found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
               </div>
            </TabsContent>
          </div>
        </Tabs>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon, label, value, className = "" }: any) {
  return (
    <div className={`p-4 border border-border rounded-xl bg-card flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground/80">
        {icon} <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}
