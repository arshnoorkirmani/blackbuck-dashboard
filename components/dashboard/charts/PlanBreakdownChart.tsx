"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Sector } from "recharts";
import { ChartWithTableTabs } from "../ChartWithTableTabs";

interface PlanBreakdownChartProps {
  data: any; 
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 100%, 65%)",
  "hsl(280, 100%, 65%)",
  "hsl(140, 100%, 55%)",
  "hsl(35, 100%, 55%)",
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={10} fontWeight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={18} fontWeight="900" className="stat-glow">
        {(percent * 100).toFixed(0)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export function PlanBreakdownChart({ data }: PlanBreakdownChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).map(([key, value]: [string, any]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      count: value.count || 0,
      amount: value.amount || 0,
    })).filter(d => d.count > 0);
  }, [data]);

  const tableColumns = [
    { key: "name", label: "Plan Type" },
    { key: "count", label: "Sales Count" },
    { key: "amount", label: "Revenue (₹)" },
  ];

  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={110}
          paddingAngle={4}
          dataKey="count"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderRadius: '12px', 
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            color: 'hsl(var(--foreground))'
          }}
          itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
        />
        <Legend 
            verticalAlign="bottom" 
            height={50} 
            iconType="circle" 
            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '20px', color: 'hsl(var(--foreground))' }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <ChartWithTableTabs 
      title="Plan Distribution" 
      chartContent={chartContent} 
      tableData={chartData} 
      tableColumns={tableColumns} 
    />
  );
}
