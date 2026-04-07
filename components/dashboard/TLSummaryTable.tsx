'use client';

import React from 'react';
import type { TLSummaryRow } from '@/lib/types/dashboard';

export function TLSummaryTable({ summaries }: { summaries: TLSummaryRow[] }) {
  // Sort by percentAchieved descending
  const sorted = [...summaries].sort((a, b) => b.percentAchieved - a.percentAchieved);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold font-heading tracking-tight text-foreground">Team Lead Summary</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Sorted by % achievement — highest first</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">TL Name</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Target</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sold</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Points</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">% Achieved</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">10k Conv.</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Required</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">DRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((tl) => {
              // Color-code: green ≥ 100%, amber 80–99%, red < 80%
              const rowBg =
                tl.percentAchieved >= 100
                  ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                  : tl.percentAchieved >= 80
                  ? 'bg-amber-500/5 hover:bg-amber-500/10'
                  : 'bg-red-500/5 hover:bg-red-500/10';

              const achieveColor =
                tl.percentAchieved >= 100
                  ? 'text-emerald-500'
                  : tl.percentAchieved >= 80
                  ? 'text-amber-500'
                  : 'text-red-500';

              return (
                <tr key={tl.tlName} className={`transition-colors ${rowBg}`}>
                  <td className="px-3 py-2.5 font-medium text-foreground">{tl.tlName}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{tl.totalTarget}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-foreground">{tl.totalSold}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{tl.totalPoints}</td>
                  <td className={`px-3 py-2.5 text-right font-bold ${achieveColor}`}>{tl.percentAchieved.toFixed(1)}%</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{tl.converted10k}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{tl.required}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{tl.drr.toFixed(1)}</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No TL data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
