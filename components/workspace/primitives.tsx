"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WorkspaceHeroProps = {
  badge?: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
};

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

type EmptyStatePanelProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

type PermissionStateBannerProps = {
  enabled: boolean;
  enabledLabel?: string;
  disabledLabel?: string;
  description: string;
};

type FilterToolbarProps = {
  children: React.ReactNode;
  className?: string;
};

type ChartPanelProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function WorkspaceHero({
  badge,
  title,
  description,
  meta,
  actions,
  aside,
  className,
}: WorkspaceHeroProps) {
  return (
    <Card className={cn("overflow-hidden rounded-[2rem] border-border bg-card shadow-lg", className)}>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.35fr,1fr] lg:p-8">
        <div className="space-y-5">
          {badge ? (
            <Badge className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground shadow-none">
              {badge}
            </Badge>
          ) : null}
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">{title}</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {meta}
        </div>

        <div className="space-y-4">
          {actions}
          {aside}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceSectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function DataTableShell({
  title,
  description,
  toolbar,
  children,
  className,
}: {
  title: string;
  description?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-[2rem] border-border/70", className)}>
      <CardHeader className="gap-4 border-b border-border/70 bg-card/95 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {toolbar}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

export function FilterToolbar({ children, className }: FilterToolbarProps) {
  return (
    <Card className={cn("rounded-[2rem] border-border/70 bg-card/80 shadow-sm", className)}>
      <CardContent className="p-4 md:p-5">{children}</CardContent>
    </Card>
  );
}

export function ChartPanel({ title, description, actions, children, className }: ChartPanelProps) {
  return (
    <Card className={cn("rounded-[2rem] border-border/70", className)}>
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyStatePanel({
  title,
  description,
  icon: Icon = AlertTriangle,
  action,
  className,
}: EmptyStatePanelProps) {
  return (
    <Card className={cn("rounded-[2rem] border-dashed border-border/70 bg-card/70", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function PermissionStateBanner({
  enabled,
  enabledLabel = "Enabled",
  disabledLabel = "Restricted",
  description,
}: PermissionStateBannerProps) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Permission status</p>
            <p className="text-xs text-muted-foreground">Role-aware controls are enforced from the access layer.</p>
          </div>
          <Badge className={enabled ? "rounded-full bg-emerald-500/10 text-emerald-600 shadow-none" : "rounded-full bg-amber-500/10 text-amber-700 shadow-none"}>
            {enabled ? enabledLabel : disabledLabel}
          </Badge>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 text-primary" />
            <p>{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
