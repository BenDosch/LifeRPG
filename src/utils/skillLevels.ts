import { LogEntry } from '../types';

export const XP_PER_LEVEL = 100;

/** Returns a map of skill name → current level, computed from the quest log. */
export function getSkillLevels(log: LogEntry[]): Record<string, number> {
  const xpMap: Record<string, number> = {};
  for (const entry of log) {
    for (const skill of entry.skills) {
      xpMap[skill] = (xpMap[skill] ?? 0) + entry.xpAwarded;
    }
  }
  const levels: Record<string, number> = {};
  for (const [skill, xp] of Object.entries(xpMap)) {
    levels[skill] = Math.floor(xp / XP_PER_LEVEL);
  }
  return levels;
}

/** Returns a map of class name → current level, computed from the quest log. */
export function getClassLevels(log: LogEntry[]): Record<string, number> {
  const xpMap: Record<string, number> = {};
  for (const entry of log) {
    if (entry.equippedClass) {
      xpMap[entry.equippedClass] = (xpMap[entry.equippedClass] ?? 0) + entry.xpAwarded;
    }
  }
  const levels: Record<string, number> = {};
  for (const [cls, xp] of Object.entries(xpMap)) {
    levels[cls] = Math.floor(xp / XP_PER_LEVEL);
  }
  return levels;
}
