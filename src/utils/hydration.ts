const DECAY_PER_MINUTE = 100 / (24 * 60); // drains fully in 24 hours

/**
 * Apply hydration decay based on ISO timestamps.
 * Returns the new hydration value (always applies, even tiny deltas).
 */
export function applyHydrationDecay(
  hydration: number,
  lastUpdated: string,
  now: string
): { hydration: number; updated: boolean } {
  const msElapsed = new Date(now).getTime() - new Date(lastUpdated).getTime();
  if (msElapsed <= 0) return { hydration, updated: false };
  const minutesElapsed = msElapsed / (1000 * 60);
  const decayed = Math.max(0, hydration - minutesElapsed * DECAY_PER_MINUTE);
  return { hydration: decayed, updated: true };
}
