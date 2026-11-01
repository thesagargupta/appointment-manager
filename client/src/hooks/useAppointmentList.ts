import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { STATUSES, type AppointmentFilters, type AppointmentStatus, type StatusFilter } from '../types';
import { useAppointments, useStats } from './useAppointments';
import { useDebounce } from './useDebounce';

export const MAX_SEARCH = 100;

function parseFilters(params: URLSearchParams): AppointmentFilters {
  const status = params.get('status');
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    status: STATUSES.includes(status as AppointmentStatus) ? (status as StatusFilter) : 'All',
    search: (params.get('q') ?? '').slice(0, MAX_SEARCH),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

// Remembered so switching tabs and coming back to Appointments restores the filters the user had.
let lastQuery = '';
export const getLastAppointmentsQuery = () => lastQuery;

/**
 * Filter state (kept in the URL so it survives refresh/back), debounced search, and the list/stats queries.
 * Shared by the desktop table page and the mobile card page.
 */
export function useAppointmentList() {
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  useEffect(() => {
    const qs = params.toString();
    lastQuery = qs ? `?${qs}` : '';
  }, [params]);

  const update = useCallback(
    (changes: Partial<AppointmentFilters>) =>
      setParams(
        (prev) => {
          const next = { ...parseFilters(prev), ...changes };
          const out = new URLSearchParams();
          if (next.status !== 'All') out.set('status', next.status);
          if (next.search) out.set('q', next.search);
          if (next.page > 1) out.set('page', String(next.page));
          return out;
        },
        { replace: true },
      ),
    [setParams],
  );

  // Apply the debounced search; changing it resets pagination.
  useEffect(() => {
    if (debouncedSearch !== filters.search) update({ search: debouncedSearch, page: 1 });
  }, [debouncedSearch, filters.search, update]);

  const appointments = useAppointments(filters);
  const stats = useStats();
  const data = appointments.data;

  // If the current page disappears (e.g. the last item on it was filtered out), step back.
  useEffect(() => {
    if (data && data.items.length === 0 && filters.page > 1 && data.pagination.totalPages >= 1) {
      update({ page: data.pagination.totalPages });
    }
  }, [data, filters.page, update]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    update({ search: '', page: 1 });
  }, [update]);

  return {
    filters,
    update,
    searchInput,
    setSearchInput,
    clearSearch,
    hasFilters: filters.status !== 'All' || filters.search !== '',
    appointments,
    stats,
  };
}
