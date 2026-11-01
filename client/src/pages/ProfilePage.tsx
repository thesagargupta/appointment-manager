import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_TIMEZONE } from '../utils/date';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <dl className="card divide-y divide-slate-100 px-4">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { admin, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <section className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-3xl font-semibold uppercase text-brand-700" aria-hidden>
          {admin?.email.charAt(0)}
        </span>
        <div className="min-w-0 max-w-full">
          <p className="truncate text-lg font-semibold text-slate-900">{admin?.email}</p>
          <p className="text-sm text-slate-500">Administrator</p>
        </div>
      </section>

      <Group title="Account">
        <Row label="Email" value={admin?.email ?? '—'} />
        <Row label="Role" value="Administrator" />
      </Group>

      <Group title="Application">
        <Row label="Name" value="Appointment Manager" />
        <Row label="Time zone" value={APP_TIMEZONE} />
      </Group>

      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void logout();
        }}
        className="btn flex min-h-12 w-full rounded-xl border border-red-200 bg-white text-base text-red-600 active:bg-red-50"
      >
        {signingOut ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LogOut className="h-5 w-5" aria-hidden />}
        Logout
      </button>
    </div>
  );
}
