import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types';
import { applyXP, calcLevel } from '../utils/xp';
import { applyMomentumDecay } from '../utils/momentum';
import { todayString } from '../utils/date';

interface ProfileState extends Profile {
  setName: (name: string) => void;
  setTitle: (title: string) => void;
  awardXP: (xpGained: number) => { didLevelUp: boolean; newLevel: number };
  resetMomentum: () => void;
  applyMomentumDecay: (today?: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      name: 'Hero',
      title: 'Adventurer',
      points: 0,
      threshold: 100,
      momentum: 0,
      momentumLastUpdated: todayString(),

      setName: (name) => set({ name }),
      setTitle: (title) => set({ title }),

      awardXP: (xpGained) => {
        const { points, threshold } = get();
        const result = applyXP(points, threshold, xpGained);
        set({ points: result.points, threshold: result.threshold });
        return { didLevelUp: result.didLevelUp, newLevel: result.newLevel };
      },

      resetMomentum: () => set({ momentum: 100, momentumLastUpdated: todayString() }),

      applyMomentumDecay: (today = todayString()) => {
        const { momentum, momentumLastUpdated } = get();
        const result = applyMomentumDecay(momentum, momentumLastUpdated, today);
        if (result.updated) {
          set({ momentum: result.momentum, momentumLastUpdated: today });
        }
      },
    }),
    {
      name: 'liferpg-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function useLevel() {
  return useProfileStore((s) => calcLevel(s.threshold));
}

export function useXpProgress() {
  return useProfileStore((s) => ({
    progress: s.points - (s.threshold - 100),
    total: 100,
    points: s.points,
    threshold: s.threshold,
  }));
}
