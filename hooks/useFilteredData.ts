import { useMemo } from "react";
import { useDashboardStore } from "@/lib/store/dashboardStore";

export function useFilteredAgents(allAgents: any[]) {
  const { globalFilters } = useDashboardStore();

  return useMemo(() => {
    if (!allAgents || !Array.isArray(allAgents)) return [];

    return allAgents.filter((a) => {
      // 1. Search filters
      const nameMatch =
        !globalFilters.agentSearch ||
        a.empId?.toLowerCase().includes(globalFilters.agentSearch.toLowerCase()) ||
        a.email?.toLowerCase().includes(globalFilters.agentSearch.toLowerCase());

      const tlMatch =
        !globalFilters.tlSearch ||
        a.tlName?.toLowerCase().includes(globalFilters.tlSearch.toLowerCase());

      const locMatch =
        !globalFilters.locationSearch ||
        a.location?.toLowerCase().includes(globalFilters.locationSearch.toLowerCase());

      // 2. Chip / Multi-select array filters
      const locationChip =
        globalFilters.location.length === 0 || globalFilters.location.includes(a.location);

      const computedElig = a.performance?.eligibility ?? a.eligibility ?? "Not Eligible";
      const eligChip =
        globalFilters.eligibility.length === 0 || globalFilters.eligibility.includes(computedElig);

      const computedGrade = a.performance?.grade ?? a.grade ?? "D";
      const gradeChip =
        globalFilters.grade.length === 0 || globalFilters.grade.includes(computedGrade);

      // Achievement Bucket logic
      const achVal = parseFloat(a.performance?.achPercent ?? a.achPercent ?? "0");
      const achChip =
        globalFilters.achievementBucket.length === 0 ||
        globalFilters.achievementBucket.some((bucket) => {
          if (bucket === "0-25%") return achVal >= 0 && achVal <= 25;
          if (bucket === "25-50%") return achVal > 25 && achVal <= 50;
          if (bucket === "50-75%") return achVal > 50 && achVal <= 75;
          if (bucket === "75-100%") return achVal > 75 && achVal <= 100;
          if (bucket === "100%+") return achVal > 100;
          return false;
        });

      // Payout Bucket logic
      const payoutVal = parseFloat(a.performance?.finalPayout ?? a.finalPayout ?? "0");
      const payoutChip =
        globalFilters.payoutRange.length === 0 ||
        globalFilters.payoutRange.some((bucket) => {
          if (bucket === "₹0") return payoutVal === 0;
          if (bucket === "₹1-1000") return payoutVal > 0 && payoutVal <= 1000;
          if (bucket === "₹1001-5000") return payoutVal > 1000 && payoutVal <= 5000;
          if (bucket === "₹5001+") return payoutVal > 5000;
          return false;
        });

      // Plan Types logic (does the agent sell any of these plans?)
      const planChip =
        globalFilters.planType.length === 0 ||
        (a.customers?.all || []).some((tx: any) => globalFilters.planType.includes(tx.planType));

      return (
        nameMatch &&
        tlMatch &&
        locMatch &&
        locationChip &&
        eligChip &&
        gradeChip &&
        achChip &&
        payoutChip &&
        planChip
      );
    });
  }, [allAgents, globalFilters]);
}
