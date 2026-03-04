export function applyEnergyDecay(
  energy: number,
  lastUpdated: string,
  now: string,
  minutesPerDay: number = 960
): { energy: number; updated: boolean } {
  const msElapsed = new Date(now).getTime() - new Date(lastUpdated).getTime();
  if (msElapsed <= 0) return { energy, updated: false };
  const minutesElapsed = msElapsed / (1000 * 60);
  const decayPerMinute = 100 / minutesPerDay;
  const decayed = Math.max(0, energy - minutesElapsed * decayPerMinute);
  return { energy: decayed, updated: true };
}
