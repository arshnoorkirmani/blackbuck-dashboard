"use client";

import { useMemo } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, BarChart, Bar, ComposedChart
} from "recharts";
import { ChartWithTableTabs } from "../ChartWithTableTabs";
import { useDashboardStore } from "@/lib/store/dashboardStore";

interface SalesTrendChartProps {
  data: any[]; 
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-4 border border-border/50 rounded-xl shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-black font-mono text-muted-foreground uppercase tracking-widest mb-2 border-b border-border/30 pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] font-bold text-foreground/80">{entry.name}</span>
              </div>
              <span className="text-xs font-black font-mono text-foreground">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  const { globalFilters } = useDashboardStore();

  const chartData = useMemo(() => {
    const grouped = new Map<string, { date: string; sales: number; revenue: number; highValue: number }>();
    
    data.forEach(t => {
      // Filter check
      if (globalFilters.location.length > 0 && !globalFilters.location.includes(t.location)) return;
      if (globalFilters.planType.length > 0 && !globalFilters.planType.includes(t.planType)) return;
      
      const date = t.date;
      if (!date) return;
      
      if (!grouped.has(date)) {
        grouped.set(date, { date, sales: 0, revenue: 0, highValue: 0 });
      }
      const rec = grouped.get(date)!;
      rec.sales++;
      rec.revenue += (t.planCost || 0);
      if (t.txnBucket === "Converted Above 10K") rec.highValue++;
    });

    return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, globalFilters]);

  const tableColumns = [
    { key: "date", label: "Date" },
    { key: "sales", label: "Sales Count" },
    { key: "revenue", label: "Revenue (₹)" },
    { key: "highValue", label: "Above 10K" },
  ];

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="trendSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="trendRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
          tickLine={false} 
          axisLine={false} 
          dy={10} 
        />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
          tickLine={false} 
          axisLine={false} 
        />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
        
        <Bar yAxisId="left" dataKey="sales" name="Sales Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
        <Area 
          yAxisId="right" 
          type="monotone" 
          dataKey="revenue" 
          name="Revenue (₹)" 
          stroke="#8B5CF6" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#trendRevenue)" 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <ChartWithTableTabs 
      title="Daily Performance Trend" 
      chartContent={chartContent} 
      tableData={chartData} 
      tableColumns={tableColumns} 
    />
  );
}
