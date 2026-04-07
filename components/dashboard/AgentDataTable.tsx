'use client';

import React, { useState, useMemo } from 'react';
import type { AgentRow } from '@/lib/types/dashboard';
import { useDispatch } from 'react-redux';
import { setSelectedAgent } from '@/lib/store/dashboardSlice';
import type { AppDispatch } from '@/lib/store';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { DetailDrawer } from '@/components/dashboard/DetailDrawer';

const PAGE_SIZE = 10;

type SortKey = keyof Pick<AgentRow, 'totalSold' | 'salePoints' | 'percentAchieved' | 'finalPayout' | 'presentDays' | 'talktime' | 'completedCalls'>;
type SortDir = 'asc' | 'desc';

export function AgentDataTable({ agents }: { agents: AgentRow[] }) {
  const dispatch = useDispatch<AppDispatch>();

  const [search, setSearch] = useState('');
  const [tlFilter, setTlFilter] = useState('__all__');
  const [tenureFilter, setTenureFilter] = useState('__all__');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('totalSold');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedAgentRow, setSelectedAgentRow] = useState<AgentRow | null>(null);

  // Unique filter values
  const tlNames = useMemo(() => [...new Set(agents.map(a => a.tlName).filter(Boolean))].sort(), [agents]);
  const tenures = useMemo(() => [...new Set(agents.map(a => a.tenure).filter(Boolean))].sort(), [agents]);

  // Filtered & sorted data
  const filtered = useMemo(() => {
    let result = agents;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.empId.toLowerCase().includes(q) ||
        a.emailId.toLowerCase().includes(q) ||
        a.tlName.toLowerCase().includes(q)
      );
    }

    if (tlFilter !== '__all__') {
      result = result.filter(a => a.tlName === tlFilter);
    }
    if (tenureFilter !== '__all__') {
      result = result.filter(a => a.tenure === tenureFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return result;
  }, [agents, search, tlFilter, tenureFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group"
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`size-3 transition-colors ${sortKey === col ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`} />
      </span>
    </th>
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header + Filters */}
      <div className="p-4 border-b border-border space-y-3">
        <h3 className="text-sm font-bold font-heading tracking-tight text-foreground">Agent Performance</h3>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search EmpID, email, TL..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Select value={tlFilter} onValueChange={v => { setTlFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All TLs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All TLs</SelectItem>
              {tlNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={tenureFilter} onValueChange={v => { setTenureFilter(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All Tenures" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Tenures</SelectItem>
              {tenures.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emp ID</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">TL</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tenure</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
              <SortHeader label="Sales" col="totalSold" />
              <SortHeader label="Points" col="salePoints" />
              <SortHeader label="% Achieved" col="percentAchieved" />
              <SortHeader label="Payout" col="finalPayout" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((a) => {
              const achieveColor =
                a.percentAchieved >= 100 ? 'text-emerald-500' :
                a.percentAchieved >= 80  ? 'text-amber-500' :
                'text-red-500';

              return (
                <tr
                  key={a.empId}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => {
                    dispatch(setSelectedAgent(a.empId));
                    setSelectedAgentRow(a);
                  }}
                >
                  <td className="px-3 py-2.5 font-medium text-foreground">{a.empId}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <span title={a.emailId} className="block max-w-[160px] truncate text-xs">{a.emailId}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.tlName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.tenure}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.grade}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{a.totalSold}</td>
                  <td className="px-3 py-2.5 text-foreground">{a.salePoints}</td>
                  <td className={`px-3 py-2.5 font-bold ${achieveColor}`}>{a.percentAchieved.toFixed(1)}%</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground">₹{a.finalPayout.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No matching agents found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)} className="h-7 w-7 p-0">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-[11px] font-medium px-2 text-muted-foreground">{safePage} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7 w-7 p-0">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <DetailDrawer 
        data={selectedAgentRow}
        isOpen={!!selectedAgentRow}
        onClose={() => setSelectedAgentRow(null)}
        type="agent"
      />
    </div>
  );
}
