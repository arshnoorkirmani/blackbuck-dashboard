'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, User, Users, Mail, Hash, 
  ArrowRight, Clock, X, Command 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentRow } from '@/lib/types/dashboard';

interface SearchModalProps {
  agents: AgentRow[];
  onSelect: (agentId: string) => void;
  trigger?: React.ReactNode;
}

export function SearchModal({ agents, onSelect, trigger }: SearchModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredAgents = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return agents.filter(a => 
      a.emailId.toLowerCase().includes(q) || 
      a.empId.toLowerCase().includes(q) ||
      a.tlName.toLowerCase().includes(q)
    ).slice(0, 8); // Limit suggestions for UX
  }, [agents, debouncedQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredAgents]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredAgents.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredAgents.length) % Math.max(1, filteredAgents.length));
    } else if (e.key === 'Enter' && filteredAgents[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredAgents[selectedIndex].emailId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal h-11 border-primary/20 bg-background/50 hover:bg-background/80 transition-all">
            <Search className="mr-2 h-4 w-4" />
            <span>Search Agent...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border bg-background/95 backdrop-blur-md shadow-2xl rounded-2xl">
        <DialogHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
                <Command className="size-4.5 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-base font-bold tracking-tight">Agent Discovery Center</DialogTitle>
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-none mt-1">
                   Search across {agents.length || 0} active members
                </p>
             </div>
          </div>
        </DialogHeader>

        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              autoFocus
              placeholder="Start typing Email, Employee ID, or TL name..."
              className="pl-11 h-12 text-sm bg-muted/30 border-border border-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 rounded-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="mt-4 min-h-[300px] flex flex-col">
            {!debouncedQuery ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center opacity-40">
                <Users className="size-10 mb-3 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-widest leading-none">Global Agent Cache Ready</p>
                <p className="text-[11px] mt-2 font-medium">Type to begin filtering our sales network...</p>
              </div>
            ) : filteredAgents.length > 0 ? (
              <div className="space-y-1">
                 <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Top Suggestions</p>
                {filteredAgents.map((agent, i) => (
                  <button
                    key={agent.empId}
                    onClick={() => handleSelect(agent.emailId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl group transition-all duration-200 border ${
                      i === selectedIndex 
                        ? 'bg-primary/15 border-primary/40 shadow-lg' 
                        : 'bg-transparent border-transparent hover:bg-primary/10 hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center size-9 rounded-lg transition-colors shadow-sm ${
                        i === selectedIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                      }`}>
                        <User className="size-4" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{agent.emailId.split('@')[0]}</span>
                          <Badge variant="outline" className="text-[9px] px-1 h-3.5 font-bold uppercase border-border/50 opacity-60">#{agent.empId}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-muted-foreground">
                           <Mail className="size-2.5 opacity-50" /> {agent.emailId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="hidden sm:block">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none mb-1">Team Leader</p>
                        <p className="text-[11px] font-bold text-foreground tracking-tight">{agent.tlName || '—'}</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center">
                <X className="size-8 mb-3 text-red-500/40" />
                <p className="text-xs font-bold text-foreground uppercase tracking-widest leading-none">Identity Check Failed</p>
                <p className="text-[11px] mt-2 text-muted-foreground font-medium italic">No member matches found for "{debouncedQuery}" in current cache.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted/30 border-t border-border p-3 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
           <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="bg-muted border border-border/50 rounded px-1.5 py-0.5">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-muted border border-border/50 rounded px-1.5 py-0.5">Enter</kbd> Select Agent</span>
           </div>
           <div className="flex items-center gap-1"><kbd className="bg-muted border border-border/50 rounded px-1.5 py-0.5">Esc</kbd> Close</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
