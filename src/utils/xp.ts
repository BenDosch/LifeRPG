/**
 * Calculate XP awarded for a quest.
 * Max is 50 (difficulty=100, urgency=100). Minimum is 1.
 */
export function calcXP(difficulty: number, urgency: number): number {
  return Math.max(1, Math.round(100 * (difficulty / 100) * (urgency / 100)));
}

/**
 * Calculate current level from threshold.
 * Level 0→1 costs 100 XP, level N→N+1 costs (N+2)*100 XP.
 * Threshold after N level-ups = 100 + 200 + 300 + ... + (N+1)*100 accumulated.
 */
export function calcLevel(threshold: number): number {
  let level = 0;
  let t = 100;
  while (t < threshold) {
    t += (level + 2) * 100;
    level++;
  }
  return level;
}

/**
 * Calculate XP progress within the current level.
 * Returns how many XP into the current level the player is.
 */
export function calcXpProgress(points: number, threshold: number): number {
  const level = calcLevel(threshold);
  return points - (threshold - (level + 1) * 100);
}

/**
 * Apply XP to current points/threshold.
 * Each level-up from level N to N+1 increases threshold by (N+2)*100.
 * Returns new state and whether a level-up occurred.
 */
export function applyXP(
  points: number,
  threshold: number,
  xpGained: number
): { points: number; threshold: number; didLevelUp: boolean; newLevel: number } {
  let newPoints = points + xpGained;
  let newThreshold = threshold;
  let level = calcLevel(threshold);
  let didLevelUp = false;

  while (newPoints >= newThreshold) {
    newThreshold += (level + 2) * 100;
    level++;
    didLevelUp = true;
  }

  return {
    points: newPoints,
    threshold: newThreshold,
    didLevelUp,
    newLevel: level,
  };
}
