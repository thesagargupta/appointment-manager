import { DateTime } from 'luxon';

/** Interprets a local date (yyyy-MM-dd) and time (HH:mm) in `zone`; returns the UTC instant or null if invalid. */
export function toUtcDate(date: string, time: string, zone: string): Date | null {
  const dt = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone });
  return dt.isValid ? dt.toUTC().toJSDate() : null;
}

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
