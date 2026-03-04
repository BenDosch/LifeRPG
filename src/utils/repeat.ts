import { Quest } from '../types';

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns midnight (local time) of the given date — strips the time component. */
function localMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns the timestamp at which the parent quest was last completed,
 * checking both completedAt (non-repeatable) and lastCompletedAt (repeatable).
 */
function parentCompletedAt(parent: Quest): string | null {
  return parent.repeatable ? parent.lastCompletedAt : parent.completedAt;
}

/**
 * @param quest       The quest to check.
 * @param parentQuest The parent quest, if any — required for the "unlimited sub-quest" rule.
 */
export function isQuestAvailable(quest: Quest, parentQuest?: Quest | null): boolean {
  if (!quest.repeatable) return !quest.completedAt;
  if (!quest.lastCompletedAt) return true;

  const last = new Date(quest.lastCompletedAt);
  const now = new Date();
  const { repeatSchedule: s } = quest;

  if (s.type === 'unlimited') {
    // Sub-quest rule: an unlimited repeatable sub-quest is locked after completion
    // until its parent quest has been completed (resetting the cycle).
    if (parentQuest && quest.lastCompletedAt) {
      const pCompleted = parentCompletedAt(parentQuest);
      if (!pCompleted) return false;                   // parent not yet completed
      return pCompleted >= quest.lastCompletedAt;      // parent completed at same time or after sub-quest
    }
    return true;
  }

  // Hours: elapsed-time based (not calendar)
  if (s.type === 'hours') {
    const next = new Date(last.getTime() + s.every * 60 * 60 * 1000);
    return now >= next;
  }

  // Days/Weeks/Months: calendar-day based
  if (s.type === 'days') {
    const lastDay = localMidnight(last);
    const nextDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + s.every);
    return now >= nextDay;
  }

  if (s.type === 'weeks') {
    const lastDay = localMidnight(last);
    const nextDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + s.every * 7);
    return now >= nextDay;
  }

  if (s.type === 'months') {
    const lastDay = localMidnight(last);
    const nextDay = new Date(lastDay.getFullYear(), lastDay.getMonth() + s.every, lastDay.getDate());
    return now >= nextDay;
  }

  if (s.type === 'weekdays') {
    const todayDay = now.getDay();
    if (!s.days.includes(todayDay)) return false;
    return !sameDay(last, now);
  }

  return true;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function nextAvailableText(quest: Quest, parentQuest?: Quest | null): string | null {
  if (!quest.repeatable) return null;
  if (!quest.lastCompletedAt) return null;
  if (isQuestAvailable(quest, parentQuest)) return null;

  const last = new Date(quest.lastCompletedAt);
  const now = new Date();
  const { repeatSchedule: s } = quest;

  if (s.type === 'unlimited') {
    // Locked by parent-completion rule
    if (parentQuest) return 'Available after parent quest completes';
    return null;
  }

  if (s.type === 'hours') {
    const next = new Date(last.getTime() + s.every * 60 * 60 * 1000);
    const msLeft = next.getTime() - now.getTime();
    const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
    const minsLeft = Math.ceil((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    if (hoursLeft === 0) return `Available in ${minsLeft}m`;
    if (minsLeft === 0) return `Available in ${hoursLeft}h`;
    return `Available in ${hoursLeft}h ${minsLeft}m`;
  }

  if (s.type === 'days' || s.type === 'weeks' || s.type === 'months') {
    const lastDay = localMidnight(last);
    const nowDay = localMidnight(now);
    let next: Date;
    if (s.type === 'days') next = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + s.every);
    else if (s.type === 'weeks') next = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + s.every * 7);
    else next = new Date(lastDay.getFullYear(), lastDay.getMonth() + s.every, lastDay.getDate());

    const daysLeft = Math.round((next.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 1) return 'Available tomorrow';
    if (daysLeft < 14) return `Available in ${daysLeft} days`;
    const weeksLeft = Math.round(daysLeft / 7);
    if (weeksLeft < 8) return `Available in ${weeksLeft} week${weeksLeft !== 1 ? 's' : ''}`;
    const monthsLeft = Math.round(daysLeft / 30);
    return `Available in ${monthsLeft} month${monthsLeft !== 1 ? 's' : ''}`;
  }

  if (s.type === 'weekdays') {
    const todayDay = now.getDay();
    if (!s.days.includes(todayDay)) {
      const sorted = [...s.days].sort((a, b) => a - b);
      const nextDay = sorted.find((d) => d > todayDay) ?? sorted[0];
      return `Available on ${DAY_NAMES[nextDay]}`;
    }
    return 'Available tomorrow';
  }

  return null;
}
