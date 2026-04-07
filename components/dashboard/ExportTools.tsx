'use client';

import React from 'react';
import { useFilteredData } from '@/lib/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportTools() {
  const { filteredAgents, filteredSales } = useFilteredData();

  const handleExport = (type: 'csv' | 'xlsx', scope: 'sales' | 'agents') => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    const filename = `${scope}-data-${timestamp}`;

    let data: any[] = [];
    if (scope === 'sales') {
      data = filteredSales.map(s => ({
        'Date': s.planDate,
        'Phone': s.phone,
        'Agent': s.agentEmail,
        'TL': s.tlName,
        'Channel': s.channel,
        'Type': s.transactionType,
        'Bucket': s.txnBucket,
        'Points': s.finalSalesPoints,
        'Achievement%': s.achievementPercent
      }));
    } else {
      data = filteredAgents.map(a => ({
        'Emp ID': a.empId,
        'Email': a.emailId,
        'TL': a.tlName,
        'Location': a.location,
        'Tenure': a.tenure,
        'Grade': a.grade,
        'Sold': a.totalSold,
        'Points': a.salePoints,
        'Achievement%': a.percentAchieved,
        'Total Payout': a.finalPayout
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, scope === 'sales' ? 'Filtered Sales' : 'Filtered Agents');

    if (type === 'xlsx') {
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 px-4 font-bold border-primary/20 text-primary hover:bg-primary/10 gap-2">
            <Download className="size-4" /> Export Data <ChevronDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl">
           <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Filtered Dataset</div>
           
           <DropdownMenuItem onClick={() => handleExport('xlsx', 'sales')} className="gap-2 cursor-pointer font-bold text-xs py-2.5">
              <FileSpreadsheet className="size-4 text-emerald-500" /> Filtered Sales (XLSX)
           </DropdownMenuItem>
           
           <DropdownMenuItem onClick={() => handleExport('csv', 'sales')} className="gap-2 cursor-pointer font-bold text-xs py-2.5">
              <FileText className="size-4 text-blue-500" /> Filtered Sales (CSV)
           </DropdownMenuItem>
           
           <div className="h-px bg-border my-1" />
           <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Agent Performance</div>
           
           <DropdownMenuItem onClick={() => handleExport('xlsx', 'agents')} className="gap-2 cursor-pointer font-bold text-xs py-2.5">
              <FileSpreadsheet className="size-4 text-emerald-500" /> Agent Audit (XLSX)
           </DropdownMenuItem>
           
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
