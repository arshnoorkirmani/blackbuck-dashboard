"use client";

import { useState, useEffect } from "react";
import { useDashboardStore } from "@/lib/store/dashboardStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, X, RotateCcw, Search, Calendar, MapPin, Users, User, Tag, CheckCircle, TrendingUp, Award, Medal, Wallet } from "lucide-react";

// Filter categories with icons
const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Month", value: "lastMonth" },
  { label: "All Time", value: "all" },
];

const PLAN_TYPES = ["BONUS", "SUPER BONUS", "SUPER BONUS PLUS"];
const ELIGIBILITY_OPTIONS = ["Eligible", "Not Eligible"];
const ACHIEVEMENT_BUCKETS = ["0-25%", "25-50%", "50-75%", "75-100%", "100%+"];
const CONVERSION_BUCKETS = ["Below 10K", "Converted Above 10K", "Converted Above 50K"];
const AGENT_GRADES = ["A+", "A", "B", "C", "D"];
const RANK_RANGES = ["Top 10", "11-50", "51-100", "100+"];
const PAYOUT_RANGES = ["₹0", "₹1-1000", "₹1001-5000", "₹5001+"];

function FilterLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={13} className="text-muted-foreground" />
      <span className="text-xs font-bold text-foreground uppercase tracking-widest">{label}</span>
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function GlobalFilterPanel({ triggerBtn }: { triggerBtn?: React.ReactNode }) {
  const { globalFilters, setGlobalFilters, clearFilters } = useDashboardStore();
  
  // Local state for buffered inputs
  const [agentSearch, setAgentSearch] = useState(globalFilters.agentSearch);
  const [tlSearch, setTlSearch] = useState(globalFilters.tlSearch);
  const [locationSearch, setLocationSearch] = useState(globalFilters.locationSearch);

  // Sync local state when store changes (e.g. on reset)
  useEffect(() => {
    setAgentSearch(globalFilters.agentSearch);
    setTlSearch(globalFilters.tlSearch);
    setLocationSearch(globalFilters.locationSearch);
  }, [globalFilters.agentSearch, globalFilters.tlSearch, globalFilters.locationSearch]);

  const activeFiltersCount =
    globalFilters.location.length +
    globalFilters.tlName.length +
    globalFilters.agentId.length +
    globalFilters.planType.length +
    globalFilters.achievementBucket.length +
    globalFilters.conversionBucket.length +
    globalFilters.eligibility.length +
    globalFilters.grade.length +
    globalFilters.rankRange.length +
    globalFilters.payoutRange.length +
    (globalFilters.dateRange ? 1 : 0) +
    (globalFilters.agentSearch ? 1 : 0) +
    (globalFilters.tlSearch ? 1 : 0) +
    (globalFilters.locationSearch ? 1 : 0);

  const handleApply = () => {
    setGlobalFilters({
      agentSearch,
      tlSearch,
      locationSearch,
    });
  };

  const handleClearAll = () => {
    clearFilters();
    setAgentSearch("");
    setTlSearch("");
    setLocationSearch("");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {triggerBtn || (
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2 h-9 px-4 text-xs font-bold uppercase tracking-wider border-border hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] bg-primary text-primary-foreground border-none">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl">
        {/* Header */}
        <SheetHeader className="px-6 py-6 border-b border-border shrink-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-black tracking-tight">System Filters</SheetTitle>
              <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest mt-1 opacity-70">
                {activeFiltersCount > 0 ? `${activeFiltersCount} ACTIVE SELECTIONS` : "REFINE YOUR VIEW"}
              </p>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground hover:text-destructive transition-colors">
                <RotateCcw size={12} />
                Reset
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-hide">

          {/* ── Date Range ── */}
          <div className="space-y-3">
            <FilterLabel icon={Calendar} label="Temporal Range" />
            <Select
              value={(globalFilters.dateRange as any) ?? "all"}
              onValueChange={(val) => setGlobalFilters({ dateRange: val === "all" ? undefined : (val as any) })}
            >
              <SelectTrigger className="h-10 text-sm font-medium bg-muted/30 border-border rounded-xl focus:ring-primary/20">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover/95 backdrop-blur-md">
                {DATE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-sm font-medium">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Agent Search ── */}
          <div className="space-y-3">
            <FilterLabel icon={User} label="EmpID / Name" />
            <div className="relative group">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search agent ID..."
                className="pl-10 h-10 text-sm font-medium bg-muted/30 border-border rounded-xl focus:ring-primary/20"
              />
              {agentSearch && (
                <button onClick={() => setAgentSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Team Leader ── */}
          <div className="space-y-3">
            <FilterLabel icon={Users} label="Leadership (TL)" />
            <div className="relative group">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={tlSearch}
                onChange={(e) => setTlSearch(e.target.value)}
                placeholder="Search TL name..."
                className="pl-10 h-10 text-sm font-medium bg-muted/30 border-border rounded-xl focus:ring-primary/20"
              />
              {tlSearch && (
                <button onClick={() => setTlSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Location ── */}
          <div className="space-y-3">
            <FilterLabel icon={MapPin} label="Geographic Data" />
            <div className="relative group mb-3">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="City or Zone..."
                className="pl-10 h-10 text-sm font-medium bg-muted/30 border-border rounded-xl focus:ring-primary/20"
              />
            </div>
            <ChipGroup
              options={globalFilters.location}
              selected={globalFilters.location}
              onChange={(val) => setGlobalFilters({ location: val })}
            />
          </div>

          {/* ── Performance Metrics ── */}
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <FilterLabel icon={TrendingUp} label="Achievement Tier" />
              <ChipGroup
                options={ACHIEVEMENT_BUCKETS}
                selected={globalFilters.achievementBucket}
                onChange={(val) => setGlobalFilters({ achievementBucket: val })}
              />
            </div>

            <div className="space-y-3">
              <FilterLabel icon={CheckCircle} label="Eligibility" />
              <ChipGroup
                options={ELIGIBILITY_OPTIONS}
                selected={globalFilters.eligibility}
                onChange={(val) => setGlobalFilters({ eligibility: val })}
              />
            </div>

            <div className="space-y-3">
              <FilterLabel icon={Award} label="Performance Grade" />
              <ChipGroup
                options={AGENT_GRADES}
                selected={globalFilters.grade}
                onChange={(val) => setGlobalFilters({ grade: val })}
              />
            </div>
          </div>

          {/* ── Financial Metrics ── */}
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <FilterLabel icon={Wallet} label="Payout Bracket" />
              <ChipGroup
                options={PAYOUT_RANGES}
                selected={globalFilters.payoutRange}
                onChange={(val) => setGlobalFilters({ payoutRange: val })}
              />
            </div>

            <div className="space-y-3">
              <FilterLabel icon={Tag} label="Subscription Plan" />
              <ChipGroup
                options={PLAN_TYPES}
                selected={globalFilters.planType}
                onChange={(val) => setGlobalFilters({ planType: val })}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-6 border-t border-border shrink-0 bg-muted/10 grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-11 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-muted/50" onClick={handleClearAll}>
            Clear All
          </Button>
          <Button className="h-11 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/25" onClick={handleApply}>
            Show Results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
