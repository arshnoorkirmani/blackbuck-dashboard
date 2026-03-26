"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { AppHeader } from "@/components/shared/app-header";
import { FormConfig, DEFAULT_CONFIG } from "@/lib/services/config.service";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateLocalConfig, resetConfigToDefault, fetchConfig, saveDatabaseConfig } from "@/lib/store/configSlice";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, X, Save, RotateCcw } from "lucide-react";

function ArrayEditor({ label, items, onChange }: { label: string, items: string[], onChange: (v: string[]) => void }) {
  const [newVal, setNewVal] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVal.trim() && !items.includes(newVal.trim())) {
      onChange([...items, newVal.trim()]);
    }
    setNewVal("");
  };

  const remove = (val: string) => {
    onChange(items.filter(i => i !== val));
  };

  return (
    <div className="border border-border rounded-xl p-5 bg-card/50 shadow-sm">
      <div className="font-heading font-semibold text-sm mb-3 text-foreground">{label}</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map(item => (
          <Badge key={item} variant="secondary" className="px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 hover:bg-secondary">
            {item}
            <button type="button" onClick={() => remove(item)} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <Input
          size={1}
          className="h-9 text-[13px] font-medium bg-background shadow-sm"
          placeholder={`Add new ${label.toLowerCase()}...`}
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
        />
        <Button type="submit" size="sm" variant="outline" className="h-9 px-3 shrink-0 shadow-sm hover:bg-muted">
          <Plus className="size-4 text-muted-foreground" />
        </Button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { data: config, status: configStatus, lastFetchedEmail } = useAppSelector(state => state.config);

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      if (configStatus === 'idle' || lastFetchedEmail !== session.user.email) {
        dispatch(fetchConfig(session.user.email));
      }
    }
  }, [session, status, dispatch, configStatus, lastFetchedEmail]);

  const setConfig = (newConfig: FormConfig) => {
    dispatch(updateLocalConfig(newConfig));

    // Auto-save logic (debounced)
    if (session?.user?.email) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await dispatch(saveDatabaseConfig({ email: session.user!.email!, config: newConfig })).unwrap();
          setToastMsg("Auto-saved successfully!");
        } catch {
          setToastMsg("Failed to auto-save configuration.");
        } finally {
          setSaving(false);
          setTimeout(() => setToastMsg(null), 3000);
        }
      }, 1500); // 1.5s debounce
    }
  };

  const saveConfig = async () => {
    if (!session?.user?.email) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaving(true);
    try {
      await dispatch(saveDatabaseConfig({ email: session.user.email, config })).unwrap();
      setToastMsg("Configuration saved successfully!");
    } catch (err) {
      setToastMsg("Failed to save configuration.");
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  if (configStatus === 'loading' || configStatus === 'idle' || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground size-6" />
      </div>
    );
  }



  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-background text-foreground font-sans relative">
      <AppHeader />
      <div className="max-w-4xl mx-auto w-full px-6 py-10 md:py-14 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10 border-b border-border/80 pb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Form Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage static fields, dropdown arrays, and offline options tailored to your operations.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground font-medium h-9 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <RotateCcw className="size-4 mr-2" /> Reset Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset settings to default?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently revert all your custom settings, including visible fields, dropdown options, and action mappings back to their factory defaults.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => setConfig(DEFAULT_CONFIG)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
                  >
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" onClick={saveConfig} disabled={saving} className="h-9 px-4 font-bold shadow-sm transition-all w-36">
              {saving ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="size-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10">

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-[100px] flex flex-col gap-6">

              {/* Visible Fields */}
              <div>
                <h2 className="font-heading font-bold text-base tracking-tight border-b border-border pb-3 mb-5">Visible Fields</h2>
                <div className="bg-card/30 border border-border p-5 rounded-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground/90 tracking-wide">Show No. of Trucks</span>
                    <Switch checked={config.visibleFields.noOfTrucks} onCheckedChange={c => setConfig({ ...config, visibleFields: { ...config.visibleFields, noOfTrucks: c } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground/90 tracking-wide">Show Fueling Potential</span>
                    <Switch checked={config.visibleFields.fuelingPotential} onCheckedChange={c => setConfig({ ...config, visibleFields: { ...config.visibleFields, fuelingPotential: c } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-foreground/90 tracking-wide">Show Fueling Frequency</span>
                    <Switch checked={config.visibleFields.fuelingFrequency} onCheckedChange={c => setConfig({ ...config, visibleFields: { ...config.visibleFields, fuelingFrequency: c } })} />
                  </div>
                </div>
              </div>

              {/* Outcome Actions Mapping */}
              <div>
                <h2 className="font-heading font-bold text-base tracking-tight border-b border-border pb-3 mb-4">Outcome Actions</h2>
                <div className="bg-card/30 border border-border p-5 rounded-xl space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Map call outcomes to specific sections of the form that should appear when selected.
                  </p>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {config.options.callStatuses.map(status => (
                      <div key={status} className="flex flex-col gap-1.5 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                        <span className="text-[13px] font-semibold text-foreground/90">{status}</span>
                        <Select
                          value={config.actionMapping?.[status] || DEFAULT_CONFIG.actionMapping?.[status] || 'none'}
                          onValueChange={(val) => {
                            const newMapping = { 
                              ...(DEFAULT_CONFIG.actionMapping || {}),
                              ...(config.actionMapping || {}), 
                              [status]: val 
                            };
                            setConfig({ ...config, actionMapping: newMapping });
                          }}
                        >
                          <SelectTrigger className="h-8 bg-background text-[12px] font-medium shadow-sm w-full">
                            <SelectValue placeholder="Select section..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Default Form / None</SelectItem>
                            <SelectItem value="interested">Interested Section</SelectItem>
                            <SelectItem value="not_interested">Not Interested Section</SelectItem>
                            <SelectItem value="follow_up">Follow Up Section</SelectItem>
                            <SelectItem value="call_back">Call Back Section</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Array Editors */}
          <div className="space-y-5 mb-20">
            <h2 className="font-heading font-bold text-base tracking-tight border-b border-border pb-3">Dropdown Options</h2>
            <ArrayEditor label="Target OMCs" items={config.options.omcs} onChange={v => setConfig({ ...config, options: { ...config.options, omcs: v } })} />
            <ArrayEditor label="Primary Call Outcomes" items={config.options.callStatuses} onChange={v => setConfig({ ...config, options: { ...config.options, callStatuses: v } })} />
            <ArrayEditor label="Interested Statuses" items={config.options.interestedStatuses} onChange={v => setConfig({ ...config, options: { ...config.options, interestedStatuses: v } })} />
            <ArrayEditor label="Available Plans" items={config.options.plans} onChange={v => setConfig({ ...config, options: { ...config.options, plans: v } })} />
            <ArrayEditor label="Not Interested Reasons" items={config.options.notInterestedReasons} onChange={v => setConfig({ ...config, options: { ...config.options, notInterestedReasons: v } })} />
          </div>

        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-xl bg-card border border-emerald-500/30 p-4 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-3"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <div className="mb-0.5 text-[13px] font-semibold text-foreground">Success</div>
            <div className="text-[12px] text-muted-foreground">{toastMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
