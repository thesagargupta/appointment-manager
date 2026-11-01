import { DateTime } from 'luxon';

export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata';

const inZone = (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }).setZone(APP_TIMEZONE);

export const formatDate = (iso: string) => inZone(iso).toFormat('dd LLL yyyy');
export const formatTime = (iso: string) => inZone(iso).toFormat('hh:mm a');
export const formatDateTime = (iso: string) => inZone(iso).toFormat('dd LLL yyyy, hh:mm a');
export const todayLong = () => DateTime.now().setZone(APP_TIMEZONE).toFormat('cccc, d LLLL yyyy');
/** yyyy-MM-dd for today in the configured timezone (for <input type="date">). */
export const todayInputValue = () => DateTime.now().setZone(APP_TIMEZONE).toFormat('yyyy-MM-dd');
export const formatDateLong = (iso: string) => inZone(iso).toFormat('cccc, dd LLLL');
export const greeting = () => {
  const hour = DateTime.now().setZone(APP_TIMEZONE).hour;
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};
