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
  Phone, Calendar, Fuel, UserCircle, MapPin, 
  CreditCard, Archive, Filter
} from 'lucide-react';
import type { SalesRow } from '@/lib/types/dashboard';
import { format } from 'date-fns';
import { DetailDrawer } from '@/components/dashboard/DetailDrawer';

interface CustomerRecordsTableProps {
  sales: SalesRow[];
}

export function CustomerRecordsTable({ sales }: CustomerRecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof SalesRow>('planDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<SalesRow | null>(null);
  const pageSize = 12;

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      (s.phone || '').includes(searchTerm) ||
      (s.tlName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.location || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="rounded-xl border border-dashed border-border py-16 text-center bg-muted/5">
        <Archive className="size-10 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Customer Records Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
          <Input 
            placeholder="Search Phone, TL, or Location..." 
            className="pl-10 h-10 text-xs bg-muted/30 border-border/50 focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-6 font-bold text-[10px] uppercase border-primary/20 text-primary bg-primary/5">
              {filteredSales.length} Total Customers
           </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden bg-card/40 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-6 h-auto cursor-pointer" onClick={() => toggleSort('planDate')}>
                  <div className="flex items-center gap-2">Date <ArrowUpDown className="size-3" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-4 h-auto cursor-pointer" onClick={() => toggleSort('phone')}>
                  <div className="flex items-center gap-2">Phone No <ArrowUpDown className="size-3" /></div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-4 h-auto">Plan Cost</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-4 h-auto">Plan Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-4 h-auto">TL Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-4 h-auto">Location</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-4 h-auto">Transaction</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-muted-foreground py-4 px-6 h-auto text-right">Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map((sale, i) => (
                <TableRow 
                  key={i} 
                  className="hover:bg-primary/5 border-border transition-all duration-200 group cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                       <Calendar className="size-3.5 text-muted-foreground" />
                       <span className="text-xs font-bold text-foreground opacity-80 group-hover:opacity-100 transition-opacity">
                        {sale.planDate ? format(new Date(sale.planDate), 'dd MMM yyyy') : '—'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                       <Phone className="size-3.5 text-muted-foreground" />
                       <span className="text-xs font-black font-mono tracking-tighter text-foreground">{sale.phone || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <Fuel className="size-3.5 text-primary" />
                       <span className="text-sm font-black text-foreground">₹{Math.round(sale.planCost).toLocaleString('en-IN')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant="secondary" className="text-[9px] font-black uppercase h-5 bg-muted/50 border-border/50">
                      {sale.planType || 'Standard'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <UserCircle className="size-3.5 text-muted-foreground" />
                       <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{sale.tlName || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <MapPin className="size-3.5 text-muted-foreground" />
                       <span className="text-xs font-medium text-muted-foreground">{sale.location || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <CreditCard className="size-3.5 text-muted-foreground" />
                       <span className="text-[10px] font-black uppercase tracking-tight text-foreground/70">{sale.transactionType || 'Sale'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Badge variant="outline" className="text-[9px] font-black uppercase h-5 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                      {sale.txnBucket || 'N/A'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-4">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
             Page <span className="text-foreground">{page}</span> / {totalPages || 1}
           </p>
           <div className="h-3 w-px bg-border/50" />
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
             Total <span className="text-foreground">{filteredSales.length}</span> Objects
           </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(page - 1)} 
              disabled={page === 1}
              className="h-8 px-3 text-[10px] font-bold uppercase gap-1 hover:bg-muted"
            >
              <ChevronLeft className="size-3.5" /> Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(page + 1)} 
              disabled={page === totalPages}
              className="h-8 px-3 text-[10px] font-bold uppercase gap-1 hover:bg-muted"
            >
              Next <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <DetailDrawer 
        data={selectedSale}
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        type="sale"
      />
    </div>
  );
}
