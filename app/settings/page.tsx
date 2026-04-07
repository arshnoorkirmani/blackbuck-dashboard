"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw } from "lucide-react";
import defaultConfig from "@/defaultConfig.json";

export default function SettingsPage() {
  const [sheetUrl, setSheetUrl] = useState(defaultConfig.sheetUrl || "");
  const [tabs, setTabs] = useState({ ...defaultConfig.tabs });
  const [planPoints, setPlanPoints] = useState<Record<string, number>>({ ...defaultConfig.planPoints });
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({ ...defaultConfig.planPrices });
  const [saved, setSaved] = useState(false);

  const [visibility, setVisibility] = useState({
    agentCanSeeTeamRank: true,
    agentCanSeeOtherAgents: false,
    tlCanSeeAllTeams: false,
    showPayoutToAgent: true,
    showEligibilityBadge: true,
  });

  const handleSave = async () => {
    // Wire to /api/config POST
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-300 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure data source, plan structure and access controls</p>
        </div>
        <Button onClick={handleSave} size="sm" className="gap-1.5">
          {saved ? <><RefreshCw size={13} className="animate-spin" /> Saved!</> : <><Save size={13} /> Save Changes</>}
        </Button>
      </div>

      <Tabs defaultValue="sheet">
        <TabsList className="mb-6">
          <TabsTrigger value="sheet">Data Source</TabsTrigger>
          <TabsTrigger value="plans">Plan Config</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        {/* Data Source */}
        <TabsContent value="sheet" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-foreground text-sm mb-1">Google Sheet URL</h2>
              <p className="text-[12px] text-muted-foreground">The Google Sheet containing all sales data</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sheet-url">Sheet URL</Label>
              <Input
                id="sheet-url"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-foreground text-sm mb-1">Tab Names</h2>
              <p className="text-[12px] text-muted-foreground">Exact sheet tab names (case-sensitive)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(tabs) as (keyof typeof tabs)[]).map(key => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`tab-${key}`} className="capitalize text-[12px]">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  <Input
                    id={`tab-${key}`}
                    value={tabs[key]}
                    onChange={e => setTabs(prev => ({ ...prev, [key]: e.target.value }))}
                    className="font-mono text-xs h-8"
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Plan Config */}
        <TabsContent value="plans" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-foreground text-sm mb-1">Plan Points</h2>
              <p className="text-[12px] text-muted-foreground">Sale points assigned per plan type — used for target &amp; DRR calculation</p>
            </div>
            <div className="space-y-4">
              {(Object.entries(planPoints)).map(([plan, val]) => (
                <div key={plan} className="flex items-center gap-4">
                  <Badge variant="outline" className="font-mono text-[10px] w-40 justify-center shrink-0">{plan}</Badge>
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-[12px] text-muted-foreground w-14 shrink-0">Points</Label>
                    <Input
                      type="number"
                      value={val}
                      onChange={e => setPlanPoints(prev => ({ ...prev, [plan]: Number(e.target.value) }))}
                      className="w-20 h-8 font-mono text-sm"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[12px] text-muted-foreground w-10 shrink-0">Price</Label>
                    <Input
                      type="number"
                      value={planPrices[plan] ?? 0}
                      onChange={e => setPlanPrices(prev => ({ ...prev, [plan]: Number(e.target.value) }))}
                      className="w-24 h-8 font-mono text-sm"
                      min={0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-foreground text-sm mb-1">Data Visibility</h2>
              <p className="text-[12px] text-muted-foreground">Control what each role can see on the dashboard</p>
            </div>
            <div className="space-y-4">
              {(Object.entries(visibility) as [keyof typeof visibility, boolean][]).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                    </p>
                  </div>
                  <Switch
                    checked={val}
                    onCheckedChange={v => setVisibility(prev => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
