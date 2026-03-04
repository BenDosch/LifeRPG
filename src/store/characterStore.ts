import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, HeroClassDef } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { applyXP, calcLevel } from '../utils/xp';
import { applyHydrationDecay } from '../utils/hydration';
import { applyEnergyDecay } from '../utils/energy';

interface CharacterState extends Character {
  customClasses: HeroClassDef[];
  setName: (name: string) => void;
  setHeroClass: (heroClass: string) => void;
  awardXP: (xpGained: number) => { didLevelUp: boolean; newLevel: number };
  addGold: (amount: number) => void;
  drinkWater: () => void;
  setWaterUnit: (unit: 'imperial' | 'metric') => void;
  setDailyWaterServings: (servings: number) => void;
  setEnergyDecayEnabled: (enabled: boolean) => void;
  setEnergyMinutesPerDay: (minutes: number) => void;
  applyHydrationDecay: (now?: string) => void;
  applyEnergyDecay: (now?: string) => void;
  fullRest: () => void;
  gainHydration: (amount: number) => void;
  gainEnergy: (amount: number) => void;
  spendHydration: (amount: number) => void;
  spendEnergy: (amount: number) => void;
  unlockedClasses: string[];
  unlockClass: (name: string) => void;
  lockClass: (name: string) => void;
  addCustomClass: (input: Omit<HeroClassDef, 'id'>) => void;
  updateCustomClass: (id: string, input: Partial<Omit<HeroClassDef, 'id'>>) => void;
  deleteCustomClass: (id: string) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      name: 'Hero',
      heroClass: 'Adventurer',
      points: 0,
      threshold: 100,
      gold: 0,
      hydration: 100,
      hydrationLastUpdated: new Date().toISOString(),
      energy: 100,
      energyLastUpdated: new Date().toISOString(),
      waterUnit: 'imperial' as const,
      dailyWaterServings: 8,
      energyDecayEnabled: true,
      energyMinutesPerDay: 960,
      customClasses: [],
      unlockedClasses: [],

      setName: (name) => set({ name }),
      setHeroClass: (heroClass) => set({ heroClass }),
      setWaterUnit: (unit) => set({ waterUnit: unit }),
      setDailyWaterServings: (servings) => set({ dailyWaterServings: Math.max(1, servings) }),
      setEnergyDecayEnabled: (enabled) => set({ energyDecayEnabled: enabled }),
      setEnergyMinutesPerDay: (minutes) => set({ energyMinutesPerDay: Math.min(1440, Math.max(1, minutes)) }),
      addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
      fullRest: () => set({ energy: 100, energyLastUpdated: new Date().toISOString() }),
      gainHydration: (amount) => set((s) => ({ hydration: Math.min(120, s.hydration + amount) })),
      gainEnergy: (amount) => set((s) => ({ energy: Math.min(100, s.energy + amount) })),
      spendHydration: (amount) => set((s) => ({ hydration: Math.max(0, s.hydration - amount) })),
      spendEnergy: (amount) => set((s) => ({ energy: Math.max(0, s.energy - amount) })),

      unlockClass: (name) =>
        set((s) => ({
          unlockedClasses: s.unlockedClasses.includes(name)
            ? s.unlockedClasses
            : [...s.unlockedClasses, name],
        })),
      lockClass: (name) =>
        set((s) => ({ unlockedClasses: s.unlockedClasses.filter((n) => n !== name) })),

      addCustomClass: (input) => {
        const cls: HeroClassDef = { ...input, id: uuidv4() };
        set((s) => ({ customClasses: [...s.customClasses, cls] }));
      },

      updateCustomClass: (id, input) => {
        set((s) => ({
          customClasses: s.customClasses.map((c) =>
            c.id === id ? { ...c, ...input } : c
          ),
        }));
      },

      deleteCustomClass: (id) => {
        set((s) => ({ customClasses: s.customClasses.filter((c) => c.id !== id) }));
      },

      awardXP: (xpGained) => {
        const { points, threshold } = get();
        const result = applyXP(points, threshold, xpGained);
        set({ points: result.points, threshold: result.threshold });
        return { didLevelUp: result.didLevelUp, newLevel: result.newLevel };
      },

      drinkWater: () => {
        const now = new Date().toISOString();
        const { hydration, hydrationLastUpdated, dailyWaterServings } = get();
        const { hydration: current } = applyHydrationDecay(hydration, hydrationLastUpdated, now);
        const gain = 100 / dailyWaterServings;
        set({ hydration: Math.min(120, current + gain), hydrationLastUpdated: now });
      },

      applyHydrationDecay: (now = new Date().toISOString()) => {
        const { hydration, hydrationLastUpdated } = get();
        const result = applyHydrationDecay(hydration, hydrationLastUpdated, now);
        if (result.updated) {
          set({ hydration: result.hydration, hydrationLastUpdated: now });
        }
      },

      applyEnergyDecay: (now = new Date().toISOString()) => {
        const { energy, energyLastUpdated, energyMinutesPerDay, energyDecayEnabled } = get();
        if (!energyDecayEnabled) return;
        const result = applyEnergyDecay(energy, energyLastUpdated, now, energyMinutesPerDay);
        if (result.updated) {
          set({ energy: result.energy, energyLastUpdated: now });
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
  return useCharacterStore((s) => calcLevel(s.threshold));
}

export function useXpProgress() {
  return useCharacterStore(
    useShallow((s) => {
      const level = calcLevel(s.threshold);
      const levelXpNeeded = (level + 1) * 100;
      const levelXpStart = s.threshold - levelXpNeeded;
      return {
        progress: s.points - levelXpStart,
        total: levelXpNeeded,
        points: s.points,
        threshold: s.threshold,
      };
    })
  );
}
