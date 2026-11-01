import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationInfo } from '../../types';

interface Props {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination: { page, limit, total, totalPages }, onPageChange }: Props) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 max-sm:hidden">
          Page {page} of {totalPages}
        </span>
        <button className="btn-secondary px-2.5" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="btn-secondary px-2.5" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
