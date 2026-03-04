const DECAY_PER_DAY = 15;

/**
 * Calculate days between two 'YYYY-MM-DD' date strings.
 */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();
  return Math.floor(Math.abs(dateB - dateA) / msPerDay);
}

/**
 * Calculate decayed momentum value.
 */
export function calcDecay(momentum: number, daysSince: number): number {
  return Math.max(0, momentum - daysSince * DECAY_PER_DAY);
}

/**
 * Apply momentum decay based on dates.
 * Returns new momentum and whether it was updated.
 */
export function applyMomentumDecay(
  momentum: number,
  lastUpdated: string,
  today: string
): { momentum: number; updated: boolean } {
  if (today === lastUpdated) {
    return { momentum, updated: false };
  }
  const days = daysBetween(lastUpdated, today);
  return { momentum: calcDecay(momentum, days), updated: true };
}
