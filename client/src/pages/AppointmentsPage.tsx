import { useCallback, useState } from 'react';
import { CalendarDays, Plus, RefreshCw, Search } from 'lucide-react';
import { AppointmentFormModal } from '../components/appointments/AppointmentFormModal';
import { AppointmentTable, AppointmentTableSkeleton } from '../components/appointments/AppointmentTable';
import { Pagination } from '../components/appointments/Pagination';
import { StatusFilterTabs } from '../components/appointments/StatusFilterTabs';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { MAX_SEARCH, useAppointmentList } from '../hooks/useAppointmentList';
import { useStatusChange } from '../hooks/useStatusChange';
import { getErrorMessage } from '../services/api';
import type { AppointmentStatus } from '../types';

export default function AppointmentsPage() {
  const { filters, update, searchInput, setSearchInput, hasFilters, appointments, stats } = useAppointmentList();
  const { change, updatingId } = useStatusChange();
  const [modalOpen, setModalOpen] = useState(false);
  const data = appointments.data;

  const handleStatusChange = useCallback((id: string, status: AppointmentStatus) => void change(id, status), [change]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">All appointments</h2>
          <p className="text-sm text-slate-500">Search, filter and manage customer appointments.</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Add Appointment
        </button>
      </div>

      <section className="card overflow-hidden" aria-label="Appointments">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <StatusFilterTabs value={filters.status} stats={stats.data} onChange={(status) => update({ status, page: 1 })} />
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                aria-label="Search by customer name"
                placeholder="Search by customer name"
                maxLength={MAX_SEARCH}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input pl-9"
              />
            </div>
            <button
              className="btn-secondary px-2.5"
              onClick={() => void Promise.all([appointments.refetch(), stats.refetch()])}
              aria-label="Refresh appointments"
              disabled={appointments.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${appointments.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {appointments.isPending ? (
          <AppointmentTableSkeleton />
        ) : appointments.isError && !data ? (
          <ErrorState message={getErrorMessage(appointments.error)} onRetry={() => void appointments.refetch()} />
        ) : data && data.items.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={hasFilters ? 'No matching appointments' : 'No appointments yet'}>
            {hasFilters ? 'Try a different search or status filter.' : 'Click “Add Appointment” to create the first one.'}
          </EmptyState>
        ) : (
          data && (
            <div className={appointments.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <AppointmentTable items={data.items} onStatusChange={handleStatusChange} updatingId={updatingId} />
              <Pagination pagination={data.pagination} onPageChange={(page) => update({ page })} />
            </div>
          )
        )}
      </section>

      <AppointmentFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
