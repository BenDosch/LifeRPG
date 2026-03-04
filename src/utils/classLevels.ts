import { LogEntry } from '../types';

const XP_PER_LEVEL = 100;

/** Total XP earned by a class (only from quests completed while it was equipped). */
export function getClassXP(log: LogEntry[], className: string): number {
  return log
    .filter((e) => e.equippedClass === className)
    .reduce((sum, e) => sum + e.xpAwarded, 0);
}

/** Current level of a class based on accumulated XP. */
export function getClassLevel(log: LogEntry[], className: string): number {
  return Math.floor(getClassXP(log, className) / XP_PER_LEVEL);
}

/** XP progress within the current class level (0–99). */
export function getClassXpProgress(log: LogEntry[], className: string): number {
  return getClassXP(log, className) % XP_PER_LEVEL;
}
