'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, ArrowUpDown, ChevronLeft, ChevronRight, 
  Download, Calendar, Tag, CreditCard, Filter
} from 'lucide-react';
import type { SalesRow } from '@/lib/types/dashboard';
import { format } from 'date-fns';

interface AgentSalesTableProps {
  sales: SalesRow[];
}

export function AgentSalesTable({ sales }: AgentSalesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof SalesRow>('planDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      (s.salesCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.channel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sales, searchTerm, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const paginatedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: keyof SalesRow) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  if (sales.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center bg-muted/5">
        <div className="size-10 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-3">
          <Filter className="size-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">No transaction records found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search transactions (ID, Channel...)" 
            className="pl-9 h-9 text-xs bg-muted/20 border-border/50 focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase cursor-pointer py-3 h-auto" onClick={() => toggleSort('planDate')}>
                <div className="flex items-center gap-1">Date <ArrowUpDown className="size-3" /></div>
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3 h-auto">Subscription / Customer</TableHead>
              <TableHead className="text-[10px] font-bold uppercase py-3 h-auto">Channel</TableHead>
              <TableHead className="text-[10px] font-bold uppercase text-right py-3 h-auto" onClick={() => toggleSort('totalPoints')}>
                <div className="flex items-center justify-end gap-1">Points <ArrowUpDown className="size-3" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSales.map((sale, i) => (
              <TableRow key={i} className="hover:bg-muted/10 border-border transition-colors">
                <TableCell className="text-[11px] font-medium py-3 text-muted-foreground whitespace-nowrap">
                   {sale.planDate ? format(new Date(sale.planDate), 'dd MMM yyyy') : '—'}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold font-mono tracking-tight text-foreground truncate max-w-[120px]">
                      {sale.salesCode || 'N/A'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">{sale.phone || 'No Phone'}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className="text-[9px] h-4 bg-muted/40 font-bold px-1.5 uppercase border-border/50">
                    {sale.channel || 'Standard'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-3">
                  <p className="text-xs font-black text-emerald-500">{sale.totalPoints.toLocaleString('en-IN')}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 opacity-70 italic">{sale.transactionType || 'Sale'}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Total: <span className="text-foreground">{filteredSales.length}</span> records
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)} 
              disabled={page === 1}
              className="size-7"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="text-[10px] font-bold min-w-16 text-center">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)} 
              disabled={page === totalPages}
              className="size-7"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
