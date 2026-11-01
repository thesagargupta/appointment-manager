import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { AppointmentTable, AppointmentTableSkeleton } from '../components/appointments/AppointmentTable';
import { StatsCards } from '../components/appointments/StatsCards';
import { EmptyState, ErrorState } from '../components/ui/Feedback';
import { useAppointments, useStats } from '../hooks/useAppointments';

const UPCOMING_FILTERS = { status: 'All', search: '', page: 1 } as const;

export default function DashboardPage() {
  const stats = useStats();
  const upcoming = useAppointments(UPCOMING_FILTERS, 5);

  return (
    <>
      <StatsCards stats={stats.data} isLoading={stats.isPending} isError={stats.isError} onRetry={() => void stats.refetch()} />
      <section className="card overflow-hidden" aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 id="upcoming-heading" className="font-semibold text-slate-900">Upcoming appointments</h2>
          <Link to="/appointments" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>
        </div>
        {upcoming.isPending ? (
          <AppointmentTableSkeleton rows={3} />
        ) : upcoming.isError ? (
          <ErrorState message="Could not load appointments." onRetry={() => void upcoming.refetch()} />
        ) : upcoming.data.items.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments yet">
            Add your first appointment from the Appointments page.
          </EmptyState>
        ) : (
          <AppointmentTable items={upcoming.data.items} onStatusChange={() => undefined} readOnly />
        )}
      </section>
    </>
  );
}
