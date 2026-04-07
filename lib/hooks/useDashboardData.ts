import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { isWithinInterval, parseISO, isValid } from 'date-fns';
import type { AgentRow, SalesRow } from '@/lib/types/dashboard';

export function useFilteredData() {
  const { mainData, globalFilters } = useSelector((state: RootState) => state.dashboard);

  const filteredAgents = useMemo(() => {
    if (!mainData) return [];
    let r = mainData.agents;

    if (globalFilters.tl.length > 0)       r = r.filter(a => globalFilters.tl.includes(a.tlName));
    if (globalFilters.agent.length > 0)    r = r.filter(a => globalFilters.agent.includes(a.emailId));
    if (globalFilters.tenure.length > 0)   r = r.filter(a => globalFilters.tenure.includes(a.tenure));
    if (globalFilters.location.length > 0) r = r.filter(a => globalFilters.location.includes(a.location));
    if (globalFilters.grade.length > 0)    r = r.filter(a => globalFilters.grade.includes(a.grade));

    // Campaign filter (based on raw sales)
    if (globalFilters.campaign.length > 0) {
      const agentsInCampaign = new Set(
        mainData.rawSales
          .filter(s => globalFilters.campaign.includes(s.channel))
          .map(s => s.agentEmail.toLowerCase())
      );
      r = r.filter(a => agentsInCampaign.has(a.emailId.toLowerCase()));
    }

    return r;
  }, [mainData, globalFilters]);

  const filteredSales = useMemo(() => {
    if (!mainData) return [];
    let r = mainData.rawSales;

    if (globalFilters.tl.length > 0)       r = r.filter(s => globalFilters.tl.includes(s.tlName));
    if (globalFilters.agent.length > 0)    r = r.filter(s => globalFilters.agent.includes(s.agentEmail));
    if (globalFilters.location.length > 0) r = r.filter(s => globalFilters.location.includes(s.location));
    if (globalFilters.campaign.length > 0) r = r.filter(s => globalFilters.campaign.includes(s.channel));

    if (globalFilters.dateRange.from && globalFilters.dateRange.to) {
      const start = new Date(globalFilters.dateRange.from);
      const end = new Date(globalFilters.dateRange.to);
      r = r.filter(s => {
        const d = parseISO(s.planDate);
        return isValid(d) && isWithinInterval(d, { start, end });
      });
    }

    return r;
  }, [mainData, globalFilters]);

  return { filteredAgents, filteredSales, filters: globalFilters };
}

export function useTeamData(tlName?: string) {
  const { mainData } = useSelector((state: RootState) => state.dashboard);
  
  return useMemo(() => {
    if (!mainData || !tlName) return [];
    return mainData.agents.filter(a => a.tlName === tlName);
  }, [mainData, tlName]);
}

export function useAgentData(agentId?: string) {
  const { mainData } = useSelector((state: RootState) => state.dashboard);

  return useMemo(() => {
    if (!mainData || !agentId) return { agent: null, sales: [] };
    const lowerId = agentId.toLowerCase();
    const agent = mainData.agents.find(
      a => a.empId.toLowerCase() === lowerId || a.emailId.toLowerCase() === lowerId
    ) ?? null;

    const sales = agent 
      ? mainData.rawSales.filter(s => s.agentEmail.toLowerCase() === agent.emailId.toLowerCase())
      : [];

    return { agent, sales };
  }, [mainData, agentId]);
}
