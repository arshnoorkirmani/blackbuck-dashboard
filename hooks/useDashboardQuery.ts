import { useQuery } from "@tanstack/react-query";

export type DashboardView = "dashboard" | "team" | "analytics";

export function useDashboardQuery(view: DashboardView = "dashboard") {
  return useQuery({
    queryKey: ["dashboard", view],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (view !== "dashboard") {
        params.set("view", view);
      }
      
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { error: res.statusText };
        }
        throw new Error(errorData.error || "Failed to fetch dashboard data");
      }
      
      return res.json();
    },
    // Don't refetch too aggressively for dashboard data
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
  });
}
