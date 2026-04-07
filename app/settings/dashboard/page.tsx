"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchDashboardConfig,
  saveDashboardConfig,
  updateLocalDashboardConfig,
} from "@/lib/store/configSlice";
import { DashboardConfig, DEFAULT_DASHBOARD_CONFIG } from "@/lib/types/dashboard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database,
  Wifi,
  Save,
  Loader2,
  Check,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

const TAB_FIELDS: { key: keyof DashboardConfig["tabs"]; label: string; hint: string }[] = [
  { key: "agent",     label: "Agent Data Tab",              hint: 'e.g. "Agent level - Plan Sale"' },
  { key: "tl",        label: "Team Lead Summary Tab",       hint: 'e.g. "Team lead level"' },
  { key: "rawSales",  label: "Raw Sales Dump Tab",          hint: 'e.g. "Dump- Plan Sale"' },
  { key: "teleSales", label: "Tele Sales Tab",              hint: 'e.g. "Tele - Plan Sold(10k)"' },
  { key: "incentive", label: "Incentive / Calculation Tab", hint: 'e.g. "Calculation"' },
  { key: "appraisal", label: "Employee Roster Tab",         hint: 'e.g. "New EMP ID"' },
];

export default function DashboardSettingsPage() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { dashboardConfig, dashboardConfigStatus } = useAppSelector((s) => s.config);
  const currentRole = (session as any)?.role ?? "AGENT";
  const currentEmail = session?.user?.email ?? "";
  const isAdmin = currentRole === "ADMIN";
  const isTL   = currentRole === "TL";
  const canEdit = isAdmin || isTL;

  const [local, setLocal] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; tabs?: string[]; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (dashboardConfigStatus === "idle") dispatch(fetchDashboardConfig());
  }, [dashboardConfigStatus, dispatch]);

  useEffect(() => {
    if (dashboardConfig) setLocal(dashboardConfig);
  }, [dashboardConfig]);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleTestConnection = async () => {
    if (!local.sheetUrl) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/fetch-sheet-tabs?url=${encodeURIComponent(local.sheetUrl)}`);
      const data = await res.json();
      if (res.ok && data.tabs) {
        setTestResult({ ok: true, tabs: data.tabs });
      } else {
        setTestResult({ ok: false, error: data.error || "Unknown error" });
      }
    } catch (e: unknown) {
      setTestResult({ ok: false, error: e instanceof Error ? e.message : "Network error" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      await dispatch(saveDashboardConfig(local)).unwrap();
      showToast(true, "Dashboard configuration saved successfully!");
    } catch {
      showToast(false, "Failed to save. Check your permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Non-admin view ────────────────────────────────────────────────────────
  if (!canEdit && !isTL) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-center px-6">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-red-500/10 border border-red-500/20">
            <ShieldAlert className="size-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Access Denied</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Only Admins can modify Dashboard Data Settings. Contact your administrator.
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md">
            Logged in as: {currentEmail}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (dashboardConfigStatus === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 border border-primary/20">
              <Database className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading tracking-tight text-foreground">
                Dashboard Data Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure the Google Sheet source and tab mappings for all sales data.
              </p>
            </div>
          </div>
          {canEdit && (
            <Button onClick={handleSave} disabled={isSaving} className="h-9 px-5 font-bold gap-2 shrink-0">
              {isSaving ? (
                <><Loader2 className="size-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="size-4" /> Save Configuration</>
              )}
            </Button>
          )}
        </div>

        {/* Role banner */}
        <div className={`mb-6 rounded-lg border px-4 py-3 text-xs ${
          isAdmin
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-amber-500/20 bg-amber-500/5"
        }`}>
          <p className="text-muted-foreground">
            Logged in as <span className="font-mono font-bold text-foreground">{currentEmail}</span>
            {" — Role: "}
            <span className={`font-bold ${isAdmin ? "text-emerald-500" : "text-amber-500"}`}>
              {currentRole}
            </span>
          </p>
          {!isAdmin && (
            <p className="mt-1 text-amber-600 dark:text-amber-400">
              ⚠️ You are viewing the current config but cannot save changes. Add your email to{" "}
              <span className="font-mono font-bold">ADMIN_EMAILS</span> in{" "}
              <span className="font-mono">.env.local</span>, restart the server, then sign out and back in.
            </p>
          )}
        </div>

        <div className="space-y-8">
          {/* ── Google Sheet URL ───────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-0.5">Google Sheet URL</h2>
              <p className="text-xs text-muted-foreground">
                Paste the full URL of your Google Spreadsheet. Everyone in your workspace who logs in
                with their Google account will access it with their own OAuth token.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={local.sheetUrl}
                onChange={(e) => {
                  setLocal({ ...local, sheetUrl: e.target.value });
                  setTestResult(null);
                }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 h-9 text-xs font-mono"
                disabled={!canEdit}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting || !local.sheetUrl}
                className="h-9 px-3 shrink-0 text-xs font-semibold gap-1.5"
              >
                {isTesting ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Testing...</>
                ) : (
                  <><Wifi className="size-3.5" /> Test Connection</>
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`rounded-lg border p-3 text-xs ${
                testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                  : "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
              }`}>
                {testResult.ok ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Check className="size-3.5" /> Connection successful! Found {testResult.tabs?.length} tabs:
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {testResult.tabs?.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-500 mt-1">
                      ✓ Copy the exact tab names above and paste them into the fields below.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{testResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Tab Name Mappings ──────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-0.5">Sheet Tab Mappings</h2>
              <p className="text-xs text-muted-foreground">
                Enter the <strong>exact</strong> tab names from your spreadsheet. Use "Test Connection" above
                to see all available tab names.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TAB_FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </label>
                  <Input
                    value={local.tabs[key]}
                    onChange={(e) =>
                      setLocal({ ...local, tabs: { ...local.tabs, [key]: e.target.value } })
                    }
                    placeholder={hint}
                    className="h-9 text-xs font-mono"
                    disabled={!canEdit}
                  />
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="pt-2 flex items-center justify-between border-t border-border">
                <button
                  type="button"
                  onClick={() => setLocal(DEFAULT_DASHBOARD_CONFIG)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="size-3" /> Reset to defaults
                </button>
                <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5 text-xs">
                  {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* ── Info box ──────────────────────────────────────────────── */}
          <div className="rounded-xl border border-border bg-muted/30 p-5 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground text-[13px]">How roles work</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>Admin</strong> — email listed in <code className="bg-muted px-1 py-0.5 rounded text-[10px]">ADMIN_EMAILS</code> in <code className="bg-muted px-1 py-0.5 rounded text-[10px]">.env.local</code>. Full unrestricted access.</li>
              <li><strong>TL</strong> — automatically detected: if your name (from the Employee Roster tab) appears in the Agent sheet's TL column, you are a TL. You see only your team.</li>
              <li><strong>Agent</strong> — everyone else. Sees only their own record and their team members.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.ok
            ? "bg-card border-emerald-500/30"
            : "bg-card border-red-500/30"
        }`}>
          <div className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
            toast.ok ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
          }`}>
            {toast.ok
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <AlertTriangle className="size-3" />
            }
          </div>
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-foreground">{toast.ok ? "Saved" : "Error"}</div>
            <div className="text-[12px] text-muted-foreground">{toast.msg}</div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
