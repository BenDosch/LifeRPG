import { RepeatSchedule } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Advance a due date forward from `from` by the given schedule. */
export function advanceDueDate(schedule: RepeatSchedule, from: Date): string {
  if (schedule.type === 'hours') {
    return fmt(new Date(from.getTime() + schedule.every * 60 * 60 * 1000));
  }
  if (schedule.type === 'days') {
    return fmt(new Date(from.getTime() + schedule.every * 24 * 60 * 60 * 1000));
  }
  if (schedule.type === 'weeks') {
    return fmt(new Date(from.getTime() + schedule.every * 7 * 24 * 60 * 60 * 1000));
  }
  if (schedule.type === 'months') {
    const next = new Date(from);
    next.setMonth(next.getMonth() + schedule.every);
    return fmt(next);
  }
  if (schedule.type === 'weekdays') {
    // Find the next occurrence of any listed weekday after `from`
    const next = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    while (!schedule.days.includes(next.getDay())) {
      next.setTime(next.getTime() + 24 * 60 * 60 * 1000);
    }
    return fmt(next);
  }
  // unlimited — shouldn't be used as a due date schedule, advance by 1 day as fallback
  return fmt(new Date(from.getTime() + 24 * 60 * 60 * 1000));
}

/** Return tomorrow's date as YYYY-MM-DD. */
export function tomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return fmt(d);
}
