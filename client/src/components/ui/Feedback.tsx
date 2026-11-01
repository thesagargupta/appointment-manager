import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="rounded-full bg-red-50 p-3 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <p className="font-medium text-slate-900">Something went wrong</p>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="rounded-full bg-slate-100 p-3 text-slate-500">{icon}</span>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        {children && <p className="mt-1 text-sm text-slate-500">{children}</p>}
      </div>
    </div>
  );
}
