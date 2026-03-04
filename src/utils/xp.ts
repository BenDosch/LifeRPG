/**
 * Calculate current level from threshold.
 * Level = threshold / 100 (threshold starts at 100 and increases by 100 per level).
 */
export function calcLevel(threshold: number): number {
  return Math.floor(threshold / 100);
}

/**
 * Calculate XP progress within the current level.
 * Returns how many XP into the current level the player is.
 */
export function calcXpProgress(points: number, threshold: number): number {
  return points - (threshold - 100);
}

/**
 * Apply XP to current points/threshold.
 * Returns new state and whether a level-up occurred.
 */
export function applyXP(
  points: number,
  threshold: number,
  xpGained: number
): { points: number; threshold: number; didLevelUp: boolean; newLevel: number } {
  let newPoints = points + xpGained;
  let newThreshold = threshold;
  let didLevelUp = false;

  while (newPoints >= newThreshold) {
    newThreshold += 100;
    didLevelUp = true;
  }

  return {
    points: newPoints,
    threshold: newThreshold,
    didLevelUp,
    newLevel: calcLevel(newThreshold),
  };
}
