import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchDashboardData, fetchDashboardFromSheets } from '@/lib/store/dashboardSlice';
import type { DashboardMainData, UserRole } from '@/lib/types/dashboard';

/**
 * PRODUCTION-GRADE DASHBOARD QUERY
 * Uses TanStack Query for caching and auto-refresh.
 * Synces with Redux to maintain compatibility with existing state-driven components.
 */
export function useDashboardQuery(view: string = 'dashboard') {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard', view],
    queryFn: async () => {
      // We pull through the thunk to reuse existing logic, but return the data for the query
      // This is a bridge strategy to ensure Redux state is also updated.
      const resultAction = await dispatch(fetchDashboardData(view));
      if (fetchDashboardData.fulfilled.match(resultAction)) {
        return resultAction.payload;
      }
      throw new Error(resultAction.payload as string || 'Failed to fetch dashboard');
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Background refresh every 10 minutes
    refetchOnWindowFocus: true,
  });

  // Manual refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const resultAction = await dispatch(fetchDashboardFromSheets([]));
      if (fetchDashboardFromSheets.fulfilled.match(resultAction)) {
        return resultAction.payload;
      }
      throw new Error(resultAction.payload as string || 'Sync failed');
    },
    onSuccess: (newData) => {
      // Invalidate and update the query data
      queryClient.setQueryData(['dashboard', view], newData);
      // Also potentially invalidate other views
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...query,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
