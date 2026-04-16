"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type DirectoryView = "cards" | "table";
type ChartView = "chart" | "table";

type WorkspaceUiState = {
  mobileSidebarOpen: boolean;
  analyticsDirectoryView: DirectoryView;
  dashboardPerformanceView: ChartView;
  analyticsTrendView: ChartView;
  setMobileSidebarOpen: (open: boolean) => void;
  setAnalyticsDirectoryView: (view: DirectoryView) => void;
  setDashboardPerformanceView: (view: ChartView) => void;
  setAnalyticsTrendView: (view: ChartView) => void;
};

export const useWorkspaceUiStore = create<WorkspaceUiState>()(
  persist(
    (set) => ({
      mobileSidebarOpen: false,
      analyticsDirectoryView: "cards",
      dashboardPerformanceView: "chart",
      analyticsTrendView: "chart",
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setAnalyticsDirectoryView: (view) => set({ analyticsDirectoryView: view }),
      setDashboardPerformanceView: (view) => set({ dashboardPerformanceView: view }),
      setAnalyticsTrendView: (view) => set({ analyticsTrendView: view }),
    }),
    {
      name: "workspace-ui-store",
      partialize: (state) => ({
        analyticsDirectoryView: state.analyticsDirectoryView,
        dashboardPerformanceView: state.dashboardPerformanceView,
        analyticsTrendView: state.analyticsTrendView,
      }),
    }
  )
);
