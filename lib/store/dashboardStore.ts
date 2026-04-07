import { create } from "zustand";
import { DateRange } from "react-day-picker";

export interface GlobalFilters {
  dateRange: DateRange | undefined;
  location: string[];
  locationSearch: string;
  tlName: string[];
  tlSearch: string;
  agentId: string[];
  agentSearch: string;
  grade: string[];
  eligibility: string[];
  achievementBucket: string[];
  planType: string[];
  conversionBucket: string[];
  rankRange: string[];
  payoutRange: string[];
}

interface DashboardState {
  globalFilters: GlobalFilters;
  setGlobalFilters: (filters: Partial<GlobalFilters>) => void;
  clearFilters: () => void;
  // Modal states
  selectedAgentId: string | null;
  openAgentModal: (agentId: string) => void;
  closeAgentModal: () => void;
  
  customerModalContext: { type: string; filter?: any } | null;
  openCustomerModal: (context: { type: string; filter?: any }) => void;
  closeCustomerModal: () => void;
  
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
}

const defaultFilters: GlobalFilters = {
  dateRange: undefined,
  location: [],
  locationSearch: "",
  tlName: [],
  tlSearch: "",
  agentId: [],
  agentSearch: "",
  grade: [],
  eligibility: [],
  achievementBucket: [],
  planType: [],
  conversionBucket: [],
  rankRange: [],
  payoutRange: [],
};

export const useDashboardStore = create<DashboardState>((set) => ({
  globalFilters: defaultFilters,
  setGlobalFilters: (filters) =>
    set((state) => ({
      globalFilters: { ...state.globalFilters, ...filters },
    })),
  clearFilters: () => set({ globalFilters: defaultFilters }),
  
  selectedAgentId: null,
  openAgentModal: (agentId) => set({ selectedAgentId: agentId }),
  closeAgentModal: () => set({ selectedAgentId: null }),

  customerModalContext: null,
  openCustomerModal: (context) => set({ customerModalContext: context }),
  closeCustomerModal: () => set({ customerModalContext: null }),

  selectedTeamId: null,
  setSelectedTeamId: (teamId) => set({ selectedTeamId: teamId }),
}));
