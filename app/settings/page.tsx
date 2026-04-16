"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, KeyRound, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_DASHBOARD_CONFIG, type DashboardConfig } from "@/lib/types/dashboard";
import { EmptyStatePanel, PermissionStateBanner, WorkspaceHero } from "@/components/workspace/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type AccessResponse = {
  role?: string;
  access?: {
    permissions?: {
      canManageDashboardConfig?: boolean;
    };
  };
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-[2rem]" />
      <Skeleton className="h-[560px] rounded-[2rem]" />
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  const configQuery = useQuery<{ dashboardConfig: DashboardConfig }>({
    queryKey: ["dashboard-config"],
    queryFn: async () => {
      const res = await fetch("/api/config?type=dashboard", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load dashboard config");
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  const accessQuery = useQuery<AccessResponse>({
    queryKey: ["settings-access"],
    queryFn: async () => {
      const res = await fetch("/api/access/me", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to load access profile");
      }
      return res.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (configQuery.data?.dashboardConfig) {
      setConfig(configQuery.data.dashboardConfig);
    }
  }, [configQuery.data?.dashboardConfig]);

  const canEdit = accessQuery.data?.access?.permissions?.canManageDashboardConfig ?? false;

  if (configQuery.isLoading || accessQuery.isLoading) {
    return <SettingsSkeleton />;
  }

  if (configQuery.error || accessQuery.error) {
    return (
      <EmptyStatePanel
        title="Settings unavailable"
        description={
          configQuery.error instanceof Error
            ? configQuery.error.message
            : accessQuery.error instanceof Error
              ? accessQuery.error.message
              : "Settings data could not be loaded."
        }
      />
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "dashboard", dashboardConfig: config }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "Unable to save dashboard config" }));
        throw new Error(payload.error || "Unable to save dashboard config");
      }

      await configQuery.refetch();
      toast.success("Dashboard configuration saved");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save dashboard configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceHero
        badge="Dashboard settings"
        title="Data source and access guidance"
        description="Configure dashboard source tabs, review login methods, and keep operational access aligned with governance rules from the super admin console."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {canEdit ? "Editable" : "Read only"}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Google + Super admin login
            </Badge>
          </div>
        }
        actions={
          <Card className="rounded-[1.75rem] border-border/70 bg-background/70 shadow-none">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Edit access</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{canEdit ? "Enabled" : "Read only"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs text-muted-foreground">Login methods</p>
                <p className="mt-2 text-sm font-medium text-foreground">Google Workspace and server-defined super admin credentials</p>
              </div>
            </CardContent>
          </Card>
        }
        aside={
          <PermissionStateBanner
            enabled={canEdit}
            enabledLabel="Config edits enabled"
            disabledLabel="Config edits restricted"
            description={
              canEdit
                ? "This role can update the Google Sheet URL and tab mapping from the settings workspace."
                : "Configuration remains visible, but save actions are locked until a role with dashboard-config permission signs in."
            }
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] border-border/70 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5 text-primary" />
              Dashboard source configuration
            </CardTitle>
            <CardDescription>Editable only when the current role has dashboard configuration permission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Google Sheet URL</label>
              <Input
                value={config.sheetUrl}
                disabled={!canEdit}
                onChange={(event) => setConfig((current) => ({ ...current, sheetUrl: event.target.value }))}
                className="rounded-2xl"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(config.tabs).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium capitalize text-foreground">{key}</label>
                  <Input
                    value={value}
                    disabled={!canEdit}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        tabs: {
                          ...current.tabs,
                          [key as keyof DashboardConfig["tabs"]]: event.target.value,
                        },
                      }))
                    }
                    className="rounded-2xl"
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleSave} disabled={!canEdit || isSaving} className="rounded-2xl">
              <Save className="mr-2 size-4" />
              {isSaving ? "Saving..." : "Save dashboard configuration"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              Login and permission notes
            </CardTitle>
            <CardDescription>Quick reminders for people operating the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              Google users sign in with their corporate account and inherit role-aware access.
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              Super admin credentials are server-side and power the control center even without a Google session.
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              TL edit controls can be disabled from the super admin page. When disabled, TLs continue to see data but lose change actions.
            </div>
            <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 text-primary">
              <ShieldCheck className="mb-2 size-5" />
              Permissions are enforced through the database-backed access model and reflected directly in the UI.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
