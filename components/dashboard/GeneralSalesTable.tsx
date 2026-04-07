'use client';

import React, { useState, useMemo } from 'react';
import type { SalesRow } from '@/lib/types/dashboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, Download, Database } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 15;

export function GeneralSalesTable({ sales }: { sales: SalesRow[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof SalesRow>('planDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Column Specific Filters
  const [campaignFilter, setCampaignFilter] = useState('__all__');
  const [bucketFilter, setBucketFilter] = useState('__all__');
  const [minAchieve, setMinAchieve] = useState('');

  const campaignOptions = useMemo(() => [...new Set(sales.map(s => s.channel).filter(Boolean))].sort(), [sales]);
  const bucketOptions = useMemo(() => [...new Set(sales.map(s => s.txnBucket).filter(Boolean))].sort(), [sales]);

  const filtered = useMemo(() => {
    let result = sales;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => 
        s.agentEmail.toLowerCase().includes(q) || 
        s.phone.includes(q) || 
        s.tlName.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q)
      );
    }

    if (campaignFilter !== '__all__') {
      result = result.filter(s => s.channel === campaignFilter);
    }
    if (bucketFilter !== '__all__') {
      result = result.filter(s => s.txnBucket === bucketFilter);
    }
    if (minAchieve) {
      const min = parseFloat(minAchieve);
      if (!isNaN(min)) {
        result = result.filter(s => (s.achievementPercent || 0) >= min);
      }
    }

    return [...result].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc' 
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [sales, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key: keyof SalesRow) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const exportSelection = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Filtered Sales");
    XLSX.writeFile(wb, `Sales_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold font-heading text-foreground">Detailed Sales Explorer</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Explore all sales transactions matching current filters</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search by Email, TL, Phone..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportSelection} className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground border-b border-border/50" onClick={() => toggleSort('planDate')}>Date</th>
              <th className="px-4 py-3 border-b border-border/50">Agent</th>
              <th className="px-4 py-3 border-b border-border/50">TL</th>
              <th className="px-4 py-3 border-b border-border/50">Phone</th>
              <th className="px-4 py-3 border-b border-border/50">
                <div className="flex flex-col gap-1.5">
                  <span>Campaign</span>
                  <Select value={campaignFilter} onValueChange={(v) => { setCampaignFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-6 text-[9px] font-medium lowercase px-2 focus:ring-1 focus:ring-primary/30">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {campaignOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground border-b border-border/50" onClick={() => toggleSort('totalPoints')}>Points</th>
              <th className="px-4 py-3 border-b border-border/50">
                <div className="flex flex-col gap-1.5">
                  <span>Bucket</span>
                  <Select value={bucketFilter} onValueChange={(v) => { setBucketFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-6 text-[9px] font-medium lowercase px-2 focus:ring-1 focus:ring-primary/30">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      {bucketOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </th>
              <th className="px-4 py-3 border-b border-border/50">
                <div className="flex flex-col gap-1.5">
                  <span className="cursor-pointer hover:text-foreground" onClick={() => toggleSort('achievementPercent')}>Achieve %</span>
                  <Input 
                    type="number"
                    placeholder="Min %"
                    value={minAchieve}
                    onChange={e => { setMinAchieve(e.target.value); setPage(1); }}
                    className="h-6 px-1.5 py-0.5 text-[9px] font-medium w-full focus-visible:ring-1 focus-visible:ring-primary/30"
                  />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer hover:text-foreground border-b border-border/50" onClick={() => toggleSort('finalSalesPoints')}>Final Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((s, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.planDate}</td>
                <td className="px-4 py-3 font-semibold text-foreground">
                   <div className="truncate max-w-[120px]" title={s.agentEmail}>{s.agentEmail.split('@')[0]}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.tlName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.phone}</td>
                <td className="px-4 py-3"><span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-md text-[9px] font-bold">{s.channel}</span></td>
                <td className="px-4 py-3 font-bold text-foreground">{s.totalPoints}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.txnBucket || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${s.achievementPercent >= 100 ? 'text-emerald-500' : s.achievementPercent >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                    {s.achievementPercent?.toFixed(1) || '0'}%
                  </span>
                </td>
                <td className="px-4 py-3 font-black text-foreground">{s.finalSalesPoints || '-'}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-0">
                  <EmptyState 
                    icon={Database}
                    title="No Sales Found"
                    description={search ? `No records match "${search}" in this selection.` : "No sales records available for this period."}
                    className="py-12"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)} className="h-7 w-7 p-0"><ChevronLeft className="size-4" /></Button>
          <span className="text-[11px] font-medium px-2 text-muted-foreground">{safePage} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 w-7 p-0"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
