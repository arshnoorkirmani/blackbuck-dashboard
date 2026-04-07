"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TopAgentSearchProps {
  agents: any[];
  currentUserEmail?: string;
  onSelectAgent: (agent: any | null) => void;
  selectedAgent: any | null;
}

export function TopAgentSearch({ agents, currentUserEmail, onSelectAgent, selectedAgent }: TopAgentSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize input with current user's email if no agent is selected
  useEffect(() => {
    if (!selectedAgent && currentUserEmail && !query) {
      setQuery(currentUserEmail);
    }
  }, [currentUserEmail, selectedAgent]);

  // Sync query when carefully selecting an agent
  useEffect(() => {
    if (selectedAgent) {
      setQuery(`${selectedAgent.empId} - ${selectedAgent.email}`);
    }
  }, [selectedAgent]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAgents = useMemo(() => {
    if (!query) return agents.slice(0, 10);
    const q = query.toLowerCase();
    return agents.filter(a => 
      a.email?.toLowerCase().includes(q) || 
      a.empId?.toLowerCase().includes(q) || 
      a.name?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, agents]);

  const handleSelect = (agent: any) => {
    onSelectAgent(agent);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onSelectAgent(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredAgents.length > 0 && isOpen) {
      handleSelect(filteredAgents[0]);
    }
  };

  return (
    <div className="relative z-50 w-full max-w-md mx-auto mb-6 pt-6 px-4" ref={wrapperRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search size={16} className="text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (selectedAgent) onSelectAgent(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search agent by name, email or ID..."
          className="pl-10 pr-10 h-10 rounded-xl bg-card border-border shadow-sm text-sm font-medium focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/60 focus:bg-background"
        />
        {(query || selectedAgent) && (
          <button 
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && filteredAgents.length > 0 && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 z-[100]">
          <div className="px-4 py-1.5 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggestions</p>
          </div>
          {filteredAgents.map((agent, i) => (
            <button
              key={agent.empId ?? i}
              onClick={() => handleSelect(agent)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-all text-left group/item"
            >
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{agent.empId}</p>
                  <span className="text-xs text-muted-foreground">—</span>
                  <p className="text-sm font-medium text-foreground/80 truncate">{agent.name || "Unknown Agent"}</p>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{agent.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block">
                  {agent.achPercent || agent.performance?.achPercent || "0%"}
                </p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 mt-1 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-center text-muted-foreground font-medium">Press <kbd className="px-1.5 py-0.5 bg-card border rounded text-xs font-mono">Enter</kbd> to select the first result</p>
          </div>
        </div>
      )}
      {isOpen && query && filteredAgents.length === 0 && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-card border border-border rounded-xl shadow-lg p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="size-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No matches found</p>
          <p className="text-xs text-muted-foreground mt-1">Try searching with a different Employee ID or Email</p>
        </div>
      )}
    </div>
  );
}
