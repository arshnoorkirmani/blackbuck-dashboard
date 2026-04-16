"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "rose" | "slate";
};

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  slate: "border-border bg-muted/60 text-foreground",
};

export function StatCard({ title, value, description, icon: Icon, tone = "slate" }: StatCardProps) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
          <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
        </div>
        <div className={cn("rounded-2xl border p-3", toneStyles[tone])}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      {description ? <CardContent className="pt-0 text-xs text-muted-foreground">{description}</CardContent> : null}
    </Card>
  );
}
