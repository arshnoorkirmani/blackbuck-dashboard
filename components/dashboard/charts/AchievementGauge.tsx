"use client";

import { useMemo } from "react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer
} from "recharts";

interface AchievementGaugeProps {
  percent: number; // 0–200
  label?: string;
}

export function AchievementGauge({ percent, label = "Achievement" }: AchievementGaugeProps) {
  const capped = Math.min(percent, 200);
  const displayPct = Math.round(percent);

  const color =
    percent >= 100 ? "#10B981" :
    percent >= 75  ? "#F59E0B" :
    percent >= 50  ? "#F97316" :
    "#EF4444";

  const data = [{ value: Math.min(capped, 100), fill: color }];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2">
      <div className="relative w-[160px] h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={225}
            endAngle={-45}
            data={data}
            barSize={12}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              cornerRadius={8}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading text-3xl font-black leading-none"
            style={{ color, filter: `drop-shadow(0 0 12px ${color}50)` }}
          >
            {displayPct}%
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{label}</span>
        </div>
      </div>

      {/* Status */}
      <div
        className="text-xs font-bold px-3 py-1 rounded-full"
        style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
      >
        {percent >= 100 ? "🎯 Target Hit!" : percent >= 75 ? "⚡ On Track" : percent >= 50 ? "⚠ Needs Push" : "🔴 Critical"}
      </div>
    </div>
  );
}
