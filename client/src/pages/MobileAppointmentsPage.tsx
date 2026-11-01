import { CalendarDays, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pagination } from '../components/appointments/Pagination';
import { AppointmentCard, AppointmentCardSkeleton } from '../components/mobile/AppointmentCard';
import { AppointmentSheet } from '../components/mobile/AppointmentSheet';
import { StatusChips } from '../components/mobile/StatusChips';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { useAppointmentList, MAX_SEARCH } from '../hooks/useAppointmentList';
import { useAppointmentSheet } from '../hooks/useAppointmentSheet';
import { getErrorMessage } from '../services/api';

export default function MobileAppointmentsPage() {
  const { filters, update, searchInput, setSearchInput, clearSearch, hasFilters, appointments, stats } = useAppointmentList();
  const { sheet, openDetails, openStatus, close, onStatusChange, busy } = useAppointmentSheet();
  const data = appointments.data;

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Search by customer name"
          placeholder="Search by customer name"
          maxLength={MAX_SEARCH}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input h-12 rounded-xl pl-11 pr-11 [&::-webkit-search-cancel-button]:hidden"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      <StatusChips value={filters.status} stats={stats.data} onChange={(status) => update({ status, page: 1 })} />

      {data && (
        <p className="text-sm text-slate-500" aria-live="polite">
          {data.pagination.total} {data.pagination.total === 1 ? 'appointment' : 'appointments'}
          {hasFilters && ' found'}
        </p>
      )}

      {appointments.isPending ? (
        <AppointmentCardSkeleton />
      ) : appointments.isError && !data ? (
        <div className="card">
          <ErrorState message={getErrorMessage(appointments.error)} onRetry={() => void appointments.refetch()} />
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title={hasFilters ? 'No matching appointments' : 'No appointments yet'}>
            {hasFilters ? 'Try a different search or status filter.' : 'Tap Add to create the first one.'}
          </EmptyState>
          {!hasFilters && (
            <div className="px-6 pb-6">
              <Link to="/new" className="btn-primary min-h-12 w-full">Add appointment</Link>
            </div>
          )}
        </div>
      ) : (
        data && (
          <div className={appointments.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <ul className="space-y-3">
              {data.items.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onOpen={openDetails} onMore={openStatus} />
              ))}
            </ul>
            <div className="card mt-3 overflow-hidden">
              <Pagination pagination={data.pagination} onPageChange={(page) => update({ page })} />
            </div>
          </div>
        )
      )}

      <AppointmentSheet sheet={sheet} busy={busy} onStatusChange={onStatusChange} onClose={close} />
    </>
  );
}
