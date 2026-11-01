import type { Response } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  opts: { status?: number; pagination?: Pagination } = {},
) {
  res.status(opts.status ?? 200).json({ success: true, message, data, ...(opts.pagination && { pagination: opts.pagination }) });
}
