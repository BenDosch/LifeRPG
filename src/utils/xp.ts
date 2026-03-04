/**
 * Calculate XP awarded for a quest.
 * Max is 50 (difficulty=100, urgency=100). Minimum is 1.
 */
export function calcXP(difficulty: number, urgency: number): number {
  return Math.max(1, Math.round(50 * (difficulty / 100) * (urgency / 100)));
}

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
