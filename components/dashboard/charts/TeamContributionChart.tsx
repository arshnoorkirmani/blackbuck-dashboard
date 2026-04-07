"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { ChartWithTableTabs } from "../ChartWithTableTabs";

interface TeamContributionChartProps {
  teams: any[];
}

export function TeamContributionChart({ teams }: TeamContributionChartProps) {
  const chartData = useMemo(() => {
    if (!teams) return [];
    return teams.map(t => ({
      name: t.tlName || t.name || 'Unknown',
      sales: t.performance?.totalSold || 0,
      revenue: t.totals?.totalSalePoints || 0, // Using Sale Points here for proxy of scale, customize as needed
      conversion10k: t.performance?.converted10k || 0,
    })).sort((a, b) => b.sales - a.sales).slice(0, 10);
  }, [teams]);

  const tableColumns = [
    { key: "name", label: "Team" },
    { key: "sales", label: "Total Sales" },
    { key: "revenue", label: "Sale Points" },
    { key: "conversion10k", label: ">10K" },
  ];

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
        <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} />
        <RechartsTooltip 
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
        />
        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <ChartWithTableTabs 
      title="Team Contribution" 
      chartContent={chartContent} 
      tableData={chartData} 
      tableColumns={tableColumns} 
    />
  );
}
