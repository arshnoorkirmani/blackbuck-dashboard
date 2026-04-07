import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { setFilters } from '@/lib/store/dashboardSlice';

const STORAGE_KEY = 'bb_dashboard_saved_filters';

export interface SavedFilter {
  id: string;
  name: string;
  filters: RootState['dashboard']['globalFilters'];
  createdAt: string;
}

export function useSavedFilters() {
  const dispatch = useDispatch<AppDispatch>();
  const currentFilters = useSelector((state: RootState) => state.dashboard.globalFilters);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
  }, []);

  const saveFilter = useCallback((name: string) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };
    const updated = [newFilter, ...savedFilters];
    setSavedFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [currentFilters, savedFilters]);

  const loadFilter = useCallback((filter: SavedFilter) => {
    dispatch(setFilters(filter.filters));
  }, [dispatch]);

  const deleteFilter = useCallback((id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedFilters]);

  return {
    savedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
  };
}
