"use client";

import { useDashboardStore } from "@/lib/store/dashboardStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface CustomerListDialogProps {
  transactions: any[]; 
}

export function CustomerListDialog({ transactions }: CustomerListDialogProps) {
  const { customerModalContext, closeCustomerModal } = useDashboardStore();

  if (!customerModalContext) return null;

  // Optionally filter the transactions here based on customerModalContext.filter
  const displayTxns = transactions.filter(t => {
    if (customerModalContext.type === "above10k") return t.txnBucket === "Converted Above 10K";
    if (customerModalContext.type === "above50k") return t.totalTransaction >= 50000;
    return true; // "all" or generic
  });

  return (
    <Dialog open={!!customerModalContext} onOpenChange={(open) => !open && closeCustomerModal()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden border-none bg-transparent shadow-none flex flex-col">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-card/95 backdrop-blur-2xl border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[85vh]"
        >
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-primary/5 shrink-0">
          <DialogTitle className="text-3xl font-black tracking-tight">
             {customerModalContext.type === "above10k" ? "Customers > 10K" :
              customerModalContext.type === "above50k" ? "Customers > 50K" : "Customer List"}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
            Showing {displayTxns.length} records
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-muted/10">
          <div className="border border-border/50 rounded-2xl bg-card overflow-hidden shadow-sm">
            <Table className="table-row-hover">
              <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md">
                <TableRow className="border-border/50">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Phone</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Agent</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Cost</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Prev Txn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTxns.slice(0, 100).map((c: any, i: number) => (
                  <TableRow key={i} className="border-border/50 h-14 transition-colors">
                    <TableCell className="font-mono text-xs font-bold">{c.phone}</TableCell>
                    <TableCell className="text-xs font-medium truncate max-w-[120px]">{c.agentEmail || c.saleCode}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase font-black px-2 py-0.5 tracking-wider">{c.planType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary font-black">₹{(c.planCost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{c.date}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{c.location}</TableCell>
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">₹{(c.prevTransaction || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {displayTxns.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground text-[10px] font-black uppercase tracking-widest">No matching customer transactions</TableCell></TableRow>
                )}
                {displayTxns.length > 100 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/20">Showing top 100 results. Use filters for more specific queries.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
