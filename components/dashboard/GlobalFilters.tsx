'use client';

import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { setFilters, clearFilters } from '@/lib/store/dashboardSlice';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSavedFilters } from '@/lib/hooks/useSavedFilters';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { 
  X, Filter, SlidersHorizontal, 
  Calendar as CalendarIcon, RotateCcw, 
  Lock, CheckCircle2, Bookmark, Save, Trash2, ChevronDown,
  Layout, Tag
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfWeek, startOfMonth } from 'date-fns';

export function GlobalFilters() {
  const dispatch = useDispatch<AppDispatch>();
  const { mainData, globalFilters, role } = useSelector((state: RootState) => state.dashboard);
  const { savedFilters, saveFilter, loadFilter, deleteFilter } = useSavedFilters();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const isAgent = role === 'AGENT';
  const isTL = role === 'TL';

  // ── Options Memoization ──────────────────────────────────────────────────
  // ... (keep existing options)
  const tlOptions = useMemo(() => {
    if (!mainData) return [];
    return [...new Set(mainData.agents.map(a => a.tlName).filter(Boolean))].sort().map(v => ({ label: v, value: v }));
  }, [mainData]);

  const agentOptions = useMemo(() => {
    if (!mainData) return [];
    let list = mainData.agents;
    if (globalFilters.tl.length > 0) {
      list = list.filter(a => globalFilters.tl.includes(a.tlName));
    }
    return list.map(a => ({ 
      label: `${a.empId} - ${a.emailId.split('@')[0]}`, 
      value: a.emailId 
    }));
  }, [mainData, globalFilters.tl]);

  const locationOptions = useMemo(() => {
    if (!mainData) return [];
    const locs = [...new Set(mainData.agents.map(a => a.location).filter(Boolean))].sort();
    return locs.map(v => ({ label: v, value: v }));
  }, [mainData]);

  const campaignOptions = useMemo(() => {
    if (!mainData) return [];
    const channels = [...new Set(mainData.rawSales.map(s => s.channel).filter(Boolean))].sort();
    return channels.map(v => ({ label: v, value: v }));
  }, [mainData]);

  const gradeOptions = useMemo(() => {
    if (!mainData) return [];
    const grades = [...new Set(mainData.agents.map(a => a.grade).filter(Boolean))].sort();
    return grades.map(v => ({ label: v, value: v }));
  }, [mainData]);

  // ── Filter Handlers ──────────────────────────────────────────────────────
  const updateFilter = (payload: Partial<typeof globalFilters>) => {
    dispatch(setFilters(payload));
  };

  const setPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    if (preset === 'today') updateFilter({ dateRange: { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } });
    else if (preset === 'week') updateFilter({ dateRange: { from: format(startOfWeek(today), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } });
    else if (preset === 'month') updateFilter({ dateRange: { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } });
    else updateFilter({ dateRange: { from: null, to: null } });
  };

  const handleSave = () => {
    if (newFilterName.trim()) {
      saveFilter(newFilterName.trim());
      setNewFilterName('');
      setSaveDialogOpen(false);
    }
  };

  const activeFiltersCount = [
    globalFilters.tl.length > 0, globalFilters.agent.length > 0,
    globalFilters.location.length > 0, globalFilters.campaign.length > 0,
    globalFilters.grade.length > 0, !!globalFilters.dateRange.from
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-4 shadow-xl transition-all duration-300 ring-1 ring-primary/5">
      <div className="flex flex-col gap-6">
        
        {/* Upper Belt: Meta Info & Quick Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${activeFiltersCount > 0 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                 Segment Explorer
                 {activeFiltersCount > 0 && (
                   <span className="flex items-center gap-1 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-1">
                     {activeFiltersCount} Active
                   </span>
                 )}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                {isAgent ? 'Personal Audit Mode Restricted' : 'Global Performance Scope Enabled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
             {/* Saved Views Dropdown */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 border-primary/20 bg-primary/5 text-primary">
                    <Bookmark className="size-3" /> Saved Views <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl">
                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between">
                    Your Presets
                    <Bookmark className="size-3 opacity-30" />
                  </div>
                  {savedFilters.length === 0 ? (
                    <div className="px-4 py-3 text-[10px] text-muted-foreground italic text-center">No saved views yet</div>
                  ) : (
                    savedFilters.map(filter => (
                      <DropdownMenuItem 
                        key={filter.id} 
                        className="flex items-center justify-between group cursor-pointer py-2.5"
                        onSelect={() => loadFilter(filter)}
                      >
                        <span className="text-xs font-bold">{filter.name}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteFilter(filter.id); }}
                          className="p-1 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer font-bold text-xs text-primary py-2.5">
                        <Save className="size-3.5" /> Save Current View
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold">
                          <Bookmark className="size-5 text-primary" /> Name This View
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">Give your filter combination a name for quick tactical recall later.</p>
                        <Input 
                          placeholder="e.g., Q1 North Region High Grade" 
                          value={newFilterName}
                          onChange={(e) => setNewFilterName(e.target.value)}
                          className="h-11 bg-muted/30 font-bold"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setSaveDialogOpen(false)} className="font-bold">Cancel</Button>
                        <Button onClick={handleSave} className="font-bold px-6">Save Preset</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuContent>
             </DropdownMenu>

             <div className="h-4 w-px bg-border mx-1" />

             <div className="flex rounded-lg border border-border bg-muted/30 p-1 mr-2 gap-0.5 overflow-hidden">
                {['today', 'week', 'month', 'all'].map((p) => (
                  <Button
                    key={p}
                    variant="ghost"
                    onClick={() => setPreset(p as any)}
                    className="h-7 px-3 text-[10px] font-black uppercase tracking-widest rounded-md text-muted-foreground hover:text-foreground hover:bg-background"
                  >
                    {p === 'all' ? 'Life' : p}
                  </Button>
                ))}
             </div>
             {activeFiltersCount > 0 && !isAgent && (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => dispatch(clearFilters())}
                className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive gap-1.5"
               >
                 <RotateCcw className="size-3" /> Reset
               </Button>
             )}
          </div>
        </div>

        {/* Lower Belt: Multi-Select Grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          
          {/* Team Lead Filter */}
          <FilterGroup label="Team / Portfolio" locked={isAgent}>
            <MultiSelect 
              options={tlOptions}
              selected={globalFilters.tl}
              onChange={(v) => updateFilter({ tl: v })}
              placeholder={isAgent ? "Portfolio Locked" : "Select Team Leads"}
              className="bg-background/50 border-border/50 h-9"
            />
          </FilterGroup>

          {/* Agent Filter */}
          <FilterGroup label="Agent Network" locked={isAgent}>
            <MultiSelect 
              options={agentOptions}
              selected={globalFilters.agent}
              onChange={(v) => updateFilter({ agent: v })}
              placeholder={isAgent ? "Identity Verified" : "Select Agents"}
              className="bg-background/50 border-border/50 h-9"
            />
          </FilterGroup>

          {/* Location Filter */}
          <FilterGroup label="Territory">
            <MultiSelect 
              options={locationOptions}
              selected={globalFilters.location}
              onChange={(v) => updateFilter({ location: v })}
              placeholder="All Locations"
              className="bg-background/50 border-border/50 h-9"
            />
          </FilterGroup>

          {/* Campaign / Channel Filter */}
          <FilterGroup label="Campaign Hook">
            <MultiSelect 
              options={campaignOptions}
              selected={globalFilters.campaign}
              onChange={(v) => updateFilter({ campaign: v })}
              placeholder="All Channels"
              className="bg-background/50 border-border/50 h-9"
            />
          </FilterGroup>

          {/* Grade Filter */}
          <FilterGroup label="Performance Tier">
            <MultiSelect 
              options={gradeOptions}
              selected={globalFilters.grade}
              onChange={(v) => updateFilter({ grade: v })}
              placeholder="All Grades"
              className="bg-background/50 border-border/50 h-9"
            />
          </FilterGroup>

        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children, locked }: { label: string; children: React.ReactNode; locked?: boolean }) {
  return (
    <div className="space-y-2 relative group">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center justify-between px-1">
        {label}
        {locked && <Lock className="size-3 text-primary/50" />}
      </label>
      <div className={locked ? "opacity-60 grayscale pointer-events-none" : ""}>
        {children}
      </div>
      {locked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none pointer-events-none">
           <Badge variant="secondary" className="bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-2 shadow-lg">
              Role Locked
           </Badge>
        </div>
      )}
    </div>
  );
}
