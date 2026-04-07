import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { DashboardMainData, AgentRow, SalesRow, UserRole } from "@/lib/types/dashboard";

// ─── State ────────────────────────────────────────────────────────────────────

interface DashboardState {
  mainData: DashboardMainData | null;
  isLoading: boolean;
  error: string | null;

  selectedAgentId: string | null;
  agentData: AgentRow | null;
  selectedAgentSales: SalesRow[]; // Raw individual records
  hasPermission: boolean;

  sheetUrls: string[];       // kept for "Sync Live Sheets" button
  role: UserRole | null;
  lastFetched: string | null; // ISO timestamp

  globalFilters: {
    tl: string[];
    agent: string[];
    tenure: string[];
    location: string[];
    grade: string[];
    campaign: string[];
    dateRange: { from: string | null; to: string | null };
  };
}

const initialFilters = {
  tl: [],
  agent: [],
  tenure: [],
  location: [],
  grade: [],
  campaign: [],
  dateRange: { from: null, to: null },
};

const initialState: DashboardState = {
  mainData: null,
  isLoading: false,
  error: null,
  selectedAgentId: null,
  agentData: null,
  selectedAgentSales: [],
  hasPermission: true,
  sheetUrls: [],
  role: null,
  lastFetched: null,
  globalFilters: initialFilters,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/**
 * Fetch dashboard data from /api/dashboard (uses MongoDB config + Google Sheets).
 */
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (view: string | undefined, { rejectWithValue }) => {
    try {
      const url = view ? `/api/dashboard?view=${view}` : "/api/dashboard";
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        return rejectWithValue(json.error ?? "Failed to fetch dashboard data");
      }
      return json as { data: DashboardMainData; role: UserRole; meta: { fetchedAt: string } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      return rejectWithValue(msg);
    }
  }
);

/**
 * Force-refresh dashboard data with cache-busting header.
 * `urls` param is kept for API compatibility with the existing dashboard page button.
 */
export const fetchDashboardFromSheets = createAsyncThunk(
  "dashboard/fetchDashboardFromSheets",
  async (_urls: string[], { rejectWithValue }) => {
    try {
      const res = await fetch("/api/dashboard", {
        cache: "no-store",
        headers: { "x-force-refresh": "1" },
      });
      const json = await res.json();
      if (!res.ok) {
        return rejectWithValue(json.error ?? "Failed to sync sheets");
      }
      return json as { data: DashboardMainData; role: UserRole; meta: { fetchedAt: string } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      return rejectWithValue(msg);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setSelectedAgent: (state, action: PayloadAction<string>) => {
      state.selectedAgentId = action.payload;
      const lowerId = action.payload.toLowerCase();
      
      // Find info
      state.agentData = state.mainData?.agents.find(
        (a) => a.empId.toLowerCase() === lowerId || a.emailId.toLowerCase() === lowerId
      ) ?? null;

      // Synchronize with global filters for cross-page consistency
      if (state.agentData) {
        state.globalFilters.agent = [state.agentData.emailId];
        state.globalFilters.tl = []; // Clear TL context when focusing on one agent
      }

      // Filter individual records
      const targetEmail = state.agentData?.emailId.toLowerCase();
      state.selectedAgentSales = state.mainData?.rawSales.filter(
        (s) => s.agentEmail.toLowerCase() === targetEmail
      ) ?? [];

      state.hasPermission =
        state.role === "ADMIN" ||
        state.role === "TL" ||
        state.agentData?.emailId.toLowerCase() === lowerId;
    },
    clearSelectedAgent: (state) => {
      state.selectedAgentId = null;
      state.agentData = null;
      state.selectedAgentSales = [];
      state.hasPermission = true;
      // Also clear the agent filter to return to aggregate view
      state.globalFilters.agent = [];
    },
    clearDashboardError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<DashboardState["globalFilters"]>>) => {
      state.globalFilters = { ...state.globalFilters, ...action.payload };
    },
    clearFilters: (state) => {
      state.globalFilters = initialFilters;
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: DashboardState) => {
      state.isLoading = true;
      state.error = null;
    };

    const handleFulfilled = (
      state: DashboardState,
      action: PayloadAction<{
        data: DashboardMainData;
        role: UserRole;
        meta: { fetchedAt: string };
      }>
    ) => {
      state.isLoading = false;
      state.mainData = action.payload.data;
      state.role = action.payload.role;
      state.lastFetched = action.payload.meta.fetchedAt;
      state.error = null;
    };

    const handleRejected = (state: DashboardState, action: PayloadAction<unknown>) => {
      state.isLoading = false;
      state.error = (action.payload as string) ?? "Unknown error";
    };

    builder
      .addCase(fetchDashboardData.pending, handlePending)
      .addCase(fetchDashboardData.fulfilled, handleFulfilled)
      .addCase(fetchDashboardData.rejected, handleRejected)
      .addCase(fetchDashboardFromSheets.pending, handlePending)
      .addCase(fetchDashboardFromSheets.fulfilled, handleFulfilled)
      .addCase(fetchDashboardFromSheets.rejected, handleRejected);
  },
});

export const { 
  setSelectedAgent, 
  clearSelectedAgent, 
  clearDashboardError, 
  setFilters, 
  clearFilters 
} = dashboardSlice.actions;
export default dashboardSlice.reducer;
