"use client";

import { CalendarClock, CircleDollarSign, MapPinned, ShieldCheck, TrendingUp, UserRound } from "lucide-react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { formatCurrencyValue, formatPercentValue } from "@/lib/view-models/operations";
import { EmptyStatePanel, WorkspaceHero } from "@/components/workspace/primitives";
import { StatCard } from "@/components/workspace/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ProfileAgent = {
  empId: string;
  email: string;
  tlName: string;
  location?: string;
  grade?: string;
  status?: string;
  doj?: string;
  appraisal?: { name?: string; personalPhone?: string } | null;
  performance: {
    totalSold?: number;
    achPercent?: string;
    finalPayout?: number;
    planSaleTarget?: number;
  };
  salesSummary: {
    today: { salesCount: number; totalAmount: number };
    thisWeek: { salesCount: number; totalAmount: number };
    thisMonth: { salesCount: number; totalAmount: number };
  };
};

type DashboardResponse = {
  agent?: ProfileAgent | null;
  role?: string;
};

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[2rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-[2rem]" />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading, error } = useDashboardQuery("dashboard");
  const response = (data ?? {}) as DashboardResponse;
  const agent = response.agent;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !agent) {
    return (
      <EmptyStatePanel
        title="Profile data unavailable"
        description={error instanceof Error ? error.message : "Profile data could not be loaded."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="Agent profile"
        title={agent.appraisal?.name || agent.email.split("@")[0]}
        description="Personal performance identity with reporting structure, current productivity, and key operational markers from the live dashboard data."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {response.role || "AGENT"}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {agent.empId}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {agent.tlName}
            </Badge>
          </div>
        }
        actions={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{agent.empId}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Reporting TL</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{agent.tlName}</p>
              </div>
            </CardContent>
          </Card>
        }
        aside={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{agent.location || "Not available"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Current status</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{agent.status || "Active"}</p>
              </div>
            </CardContent>
          </Card>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly target"
          value={Number(agent.performance.planSaleTarget ?? 0)}
          description="Assigned target"
          icon={ShieldCheck}
          tone="blue"
        />
        <StatCard
          title="Total sold"
          value={Number(agent.performance.totalSold ?? 0)}
          description={`Achievement ${formatPercentValue(agent.performance.achPercent)}`}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          title="Final payout"
          value={formatCurrencyValue(agent.performance.finalPayout)}
          description="Current payout projection"
          icon={CircleDollarSign}
          tone="amber"
        />
        <StatCard
          title="This month sales"
          value={agent.salesSummary.thisMonth.salesCount}
          description={`Revenue ${formatCurrencyValue(agent.salesSummary.thisMonth.totalAmount)}`}
          icon={CalendarClock}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] border-border/70 xl:col-span-2">
          <CardHeader>
            <CardTitle>Operational identity</CardTitle>
            <CardDescription>High-signal profile fields useful during coaching and performance reviews.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <UserRound className="size-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Email</p>
              <p className="mt-2 font-medium text-foreground">{agent.email}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <MapPinned className="size-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Grade</p>
              <p className="mt-2 font-medium text-foreground">{agent.grade || "Not available"}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <CalendarClock className="size-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Date of joining</p>
              <p className="mt-2 font-medium text-foreground">{agent.doj || "Not available"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/70">
          <CardHeader>
            <CardTitle>Current month snapshot</CardTitle>
            <CardDescription>Fast summary of recent selling motion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="mt-2 text-2xl font-semibold">{agent.salesSummary.today.salesCount} sales</p>
              <p className="text-sm text-muted-foreground">{formatCurrencyValue(agent.salesSummary.today.totalAmount)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              <p className="text-xs text-muted-foreground">This week</p>
              <p className="mt-2 text-2xl font-semibold">{agent.salesSummary.thisWeek.salesCount} sales</p>
              <p className="text-sm text-muted-foreground">{formatCurrencyValue(agent.salesSummary.thisWeek.totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
