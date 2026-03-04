import { HeroClassDef, LogEntry, getTier } from '../types';
import { getClassLevel } from './classLevels';

/**
 * Returns true if the player currently meets all requirements for the given class.
 * skillLevels and playerLevel are passed in pre-computed for performance.
 * log is required for classLevel and questsCompleted checks.
 */
export function checkClassRequirements(
  classDef: HeroClassDef,
  skillLevels: Record<string, number>,
  playerLevel: number,
  log: LogEntry[]
): boolean {
  return classDef.requirements.every((req) => {
    switch (req.type) {
      case 'skill':
        return (skillLevels[req.skill] ?? 0) >= req.level;
      case 'playerLevel':
        return playerLevel >= req.level;
      case 'classLevel':
        return getClassLevel(log, req.className) >= req.level;
      case 'questsCompleted': {
        const qualifying = log.filter(
          (e) =>
            (req.allowedDifficulties.length === 0 ||
              req.allowedDifficulties.length === 4 ||
              req.allowedDifficulties.includes(getTier(e.difficulty))) &&
            (req.allowedUrgencies.length === 0 ||
              req.allowedUrgencies.length === 4 ||
              req.allowedUrgencies.includes(getTier(e.urgency)))
        );
        return qualifying.length >= req.count;
      }
      default: {
        const legacy = req as any;
        return legacy.skill ? (skillLevels[legacy.skill] ?? 0) >= (legacy.level ?? 1) : true;
      }
    }
  });
}
