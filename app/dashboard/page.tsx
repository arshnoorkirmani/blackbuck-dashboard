"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TLDashboard } from "@/components/dashboard/TLDashboard";
import { AgentDashboard } from "@/components/dashboard/AgentDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import { AlertCircle } from "lucide-react";
import { AgentDetailsDialog } from "@/components/dashboard/modals/AgentDetailsDialog";
import { CustomerListDialog } from "@/components/dashboard/modals/CustomerListDialog";
import { TopAgentSearch } from "@/components/dashboard/TopAgentSearch";

function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { data, isLoading: dataLoading, error } = useDashboardQuery("dashboard");
  const [selectedSearchAgent, setSelectedSearchAgent] = useState<any>(null);

  // ✅ ALL hooks must be declared unconditionally before any early returns (React Rules of Hooks)
  const { agentsDataMap, allTxns } = useMemo(() => {
    let agents: any[] = [];
    let txns: any[] = [];

    if (data?.allTeams) {
      agents = data.allTeams.flatMap((t: any) => t.agents || []).filter((a: any) => a.status !== "Inactive");
      txns = agents.flatMap((a: any) => a.customers?.all || []);
    } else if (data?.team?.agents) {
      agents = data.team.agents.filter((a: any) => a.status !== "Inactive");
      txns = agents.flatMap((a: any) => a.customers?.all || []);
    } else if (data?.agent) {
      agents = [data.agent];
      txns = data.agent.customers?.all || [];
    }

    return { agentsDataMap: agents, allTxns: txns };
  }, [data]);

  // ── Conditional returns AFTER all hooks ──────────────────────────────────
  if (sessionStatus === "loading" || dataLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 h-full flex items-center justify-center">
        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error instanceof Error ? error.message : "Failed to load dashboard data"}</p>
        </div>
      </div>
    );
  }

  const role = data?.role ?? (session as any)?.role ?? "AGENT";

  // Find the agent's team for context when searching a specific agent
  const resolveAgentTeam = (agentEmail: string) => {
    if (data?.allTeams) {
      return data.allTeams.find((t: any) => t.agents?.some((a: any) => a.email === agentEmail));
    }
    return data?.team;
  };

  const overridenData = selectedSearchAgent
    ? { agent: selectedSearchAgent, team: resolveAgentTeam(selectedSearchAgent.email) }
    : data;

  return (
    <div className="flex flex-col min-h-screen">
      <TopAgentSearch
        agents={agentsDataMap}
        currentUserEmail={session?.user?.email ?? undefined}
        selectedAgent={selectedSearchAgent}
        onSelectAgent={setSelectedSearchAgent}
      />

      <div className="flex-1">
        {selectedSearchAgent ? (
          <AgentDashboard data={overridenData} />
        ) : (
          <>
            {role === "ADMIN" && <AdminDashboard data={data} />}
            {role === "TL" && <TLDashboard data={data} />}
            {role === "AGENT" && <AgentDashboard data={data} />}
          </>
        )}
      </div>

      <AgentDetailsDialog agentsDataMap={agentsDataMap} />
      <CustomerListDialog transactions={allTxns} />
    </div>
  );
}
