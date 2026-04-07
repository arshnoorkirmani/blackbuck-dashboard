"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { ChartWithTableTabs } from "@/components/dashboard/ChartWithTableTabs";

interface AgentLeaderboardChartProps {
  agents: Array<{
    empId: string;
    totalSold: number;
    achPercent?: string | number;
    tlName?: string;
  }>;
}

const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#F97316", "#EC4899", "#06B6D4", "#84CC16", "#EF4444", "#A78BFA"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-xl px-4 py-3 shadow-xl text-xs space-y-1">
      <p className="font-bold font-mono text-foreground">{label}</p>
      <p className="text-muted-foreground">Sales: <span className="text-primary font-bold">{payload[0]?.value}</span></p>
      {payload[0]?.payload?.ach && (
        <p className="text-muted-foreground">Ach: <span className="text-foreground font-semibold">{payload[0].payload.ach}</span></p>
      )}
    </div>
  );
}

export function AgentLeaderboardChart({ agents }: AgentLeaderboardChartProps) {
  const chartData = useMemo(
    () =>
      (agents ?? [])
        .slice(0, 10)
        .sort((a, b) => b.totalSold - a.totalSold)
        .map((a) => ({
          name: a.empId,
          Sales: a.totalSold,
          ach: a.achPercent ?? "—",
          tl: a.tlName ?? "—",
        })),
    [agents]
  );

  const tableColumns = [
    { key: "name", label: "Agent ID" },
    { key: "Sales", label: "Total Sales" },
    { key: "ach", label: "Achievement %" },
    { key: "tl", label: "Team Leader" },
  ];

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={75}
          tick={{ fontSize: 10, fill: "hsl(var(--foreground))", fontFamily: "JetBrains Mono" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="Sales" radius={[0, 6, 6, 0]} barSize={18} label={{ position: "right", fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: "bold" }}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <ChartWithTableTabs
      title="Top Agents Leaderboard"
      chartContent={chartContent}
      tableData={chartData}
      tableColumns={tableColumns}
    />
  );
}
