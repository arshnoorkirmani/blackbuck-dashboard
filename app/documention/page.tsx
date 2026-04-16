"use client";

import { BookOpen, ChartColumnBig, LockKeyhole, Settings, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceHero } from "@/components/workspace/primitives";

const steps = [
  {
    title: "1. Sign in",
    description: "Use Google Workspace for standard access, or the server-defined super admin credentials for governance tasks.",
    icon: LockKeyhole,
  },
  {
    title: "2. Open Dashboard",
    description: "Start from the dashboard to focus one agent, search by email or employee ID, and review sales plus customer records.",
    icon: ChartColumnBig,
  },
  {
    title: "3. Use TL Workspace",
    description: "Team leads can monitor every team member. Editing actions appear only when the super admin keeps TL permissions enabled.",
    icon: Users,
  },
  {
    title: "4. Configure safely",
    description: "Use Settings for Google Sheet source details and Super Admin for user roles, permission flags, and platform governance.",
    icon: Settings,
  },
];

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="Platform guide"
        title="How to use the BlackBuck operations workspace"
        description="A concise operating flow for the redesigned dashboard, analytics, TL workspace, super admin control center, and settings area."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Role-aware
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Sheets-backed
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Theme-ready workspace
            </Badge>
          </div>
        }
        actions={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Core journey</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Login - Review - Act</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Governance model</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Role + permission based</p>
              </div>
            </CardContent>
          </Card>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="rounded-[2rem] border-border/70">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] border-border/70 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Role guide
            </CardTitle>
            <CardDescription>What each role can do in the product.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <h3 className="font-semibold text-foreground">Agent</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Focus on personal performance, customer sales data, analytics context, and searchable agent lookups within the available scope.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <h3 className="font-semibold text-foreground">Team Lead</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Operate the TL workspace, compare team members, and act on management tools when permission is enabled by super admin.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
              <h3 className="font-semibold text-foreground">Admin / Super Admin</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Control configuration, user access, dashboard governance, and permission switches across the entire platform.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Best practice
            </CardTitle>
            <CardDescription>Keep access and data quality professional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              Review dashboard source tabs after any sheet structure change.
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              Limit permission editors to the super admin whenever possible.
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              Use analytics filters before exporting so reports match the intended scope.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
