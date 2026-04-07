"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { ChartWithTableTabs } from "@/components/dashboard/ChartWithTableTabs";

interface SalesOverviewChartProps {
  dailyTrend: Array<{ date: string; salesCount: number; totalAmount: number; customers10k?: number }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-xl px-4 py-3 shadow-xl text-xs space-y-1.5">
      <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold text-foreground">
            {entry.name === "Revenue" ? `₹${(entry.value as number).toLocaleString()}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SalesOverviewChart({ dailyTrend }: SalesOverviewChartProps) {
  const chartData = useMemo(
    () =>
      (dailyTrend ?? []).map((d) => ({
        date: d.date,
        Sales: d.salesCount,
        Revenue: d.totalAmount,
        "10K+": d.customers10k ?? 0,
      })),
    [dailyTrend]
  );

  const tableColumns = [
    { key: "date", label: "Date" },
    { key: "Sales", label: "Sales" },
    { key: "Revenue", label: "Revenue (₹)" },
    { key: "10K+", label: "10K Conversions" },
  ];

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "hsl(var(--foreground))" }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="Sales"
          stroke="#F59E0B"
          strokeWidth={2.5}
          fill="url(#salesGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#F59E0B", strokeWidth: 0 }}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="Revenue"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <ChartWithTableTabs
      title="Sales Trend"
      chartContent={chartContent}
      tableData={chartData}
      tableColumns={tableColumns}
    />
  );
}
