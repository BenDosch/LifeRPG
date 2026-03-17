import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Character, HeroClassDef } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { applyXP, calcLevel } from '../utils/xp';
import { applyHydrationDecay } from '../utils/hydration';
import { applyEnergyDecay } from '../utils/energy';
import { Platform } from 'react-native';
import {
  getCharacterRef,
  firestoreSetDoc,
  firestoreGetDoc,
} from '../lib/firestore';
import { getFirebaseFirestore } from '../lib/firebase';

interface CharacterState extends Character {
  customClasses: HeroClassDef[];
  colorScheme: 'dark' | 'light';
  setColorScheme: (scheme: 'dark' | 'light') => void;
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
  setEnergyNotification: (config: { enabled: boolean; threshold: number }) => void;
  setHydrationNotification: (config: { enabled: boolean; threshold: number }) => void;
  setTimezone: (tz: string) => void;
  // Firestore hydration
  loadCharacterFromFirestore: (userId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Serialisable character fields (everything we persist to Firestore)
// ---------------------------------------------------------------------------
function getCharacterData(s: CharacterState) {
  return {
    name: s.name,
    heroClass: s.heroClass,
    points: s.points,
    threshold: s.threshold,
    gold: s.gold,
    hydration: s.hydration,
    hydrationLastUpdated: s.hydrationLastUpdated,
    energy: s.energy,
    energyLastUpdated: s.energyLastUpdated,
    waterUnit: s.waterUnit,
    dailyWaterServings: s.dailyWaterServings,
    energyDecayEnabled: s.energyDecayEnabled,
    energyMinutesPerDay: s.energyMinutesPerDay,
    customClasses: s.customClasses,
    unlockedClasses: s.unlockedClasses,
    colorScheme: s.colorScheme,
    energyNotification: s.energyNotification,
    hydrationNotification: s.hydrationNotification,
    timezone: s.timezone,
  };
}

async function saveCharacterToFirestore(userId: string): Promise<void> {
  try {
    const ref = await getCharacterRef(userId);
    const data = getCharacterData(useCharacterStore.getState());
    await firestoreSetDoc(ref, data, { merge: true });
  } catch (e) {
    console.warn('[characterStore] Firestore write failed:', e);
  }
}

function fireAndForgetSave(userId: string | undefined) {
  if (userId) saveCharacterToFirestore(userId);
}

export const useCharacterStore = create<CharacterState>()((set, get) => ({
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
  colorScheme: 'dark' as const,
  energyNotification: { enabled: false, threshold: 20 },
  hydrationNotification: { enabled: false, threshold: 30 },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  // ------------------------------------------------------------------
  // Firestore hydration
  // ------------------------------------------------------------------
  loadCharacterFromFirestore: async (userId) => {
    try {
      const ref = await getCharacterRef(userId);
      const { exists, data } = await firestoreGetDoc(ref);
      if (exists && data) {
        set({ ...data });
      } else {
        // First sign-up — persist defaults
        await saveCharacterToFirestore(userId);
      }
    } catch (e) {
      console.warn('[characterStore] Firestore load failed:', e);
    }
  },

  // ------------------------------------------------------------------
  // Actions (local mutation + fire-and-forget Firestore write)
  // ------------------------------------------------------------------
  setName: (name) => {
    set({ name });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setColorScheme: (scheme) => {
    set({ colorScheme: scheme });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setHeroClass: (heroClass) => {
    set({ heroClass });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setWaterUnit: (unit) => {
    set({ waterUnit: unit });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setDailyWaterServings: (servings) => {
    set({ dailyWaterServings: Math.max(1, servings) });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setEnergyDecayEnabled: (enabled) => {
    set({ energyDecayEnabled: enabled });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setEnergyMinutesPerDay: (minutes) => {
    set({ energyMinutesPerDay: Math.min(1440, Math.max(1, minutes)) });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  addGold: (amount) => {
    set((s) => ({ gold: s.gold + amount }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  fullRest: () => {
    set({ energy: 100, energyLastUpdated: new Date().toISOString() });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  gainHydration: (amount) => {
    set((s) => ({ hydration: Math.min(120, s.hydration + amount) }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  gainEnergy: (amount) => {
    set((s) => ({ energy: Math.min(100, s.energy + amount) }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  spendHydration: (amount) => {
    set((s) => ({ hydration: Math.max(0, s.hydration - amount) }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  spendEnergy: (amount) => {
    set((s) => ({ energy: Math.max(0, s.energy - amount) }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  unlockClass: (name) => {
    set((s) => ({
      unlockedClasses: s.unlockedClasses.includes(name)
        ? s.unlockedClasses
        : [...s.unlockedClasses, name],
    }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  lockClass: (name) => {
    set((s) => ({ unlockedClasses: s.unlockedClasses.filter((n) => n !== name) }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  addCustomClass: (input) => {
    const cls: HeroClassDef = { ...input, id: uuidv4() };
    set((s) => ({ customClasses: [...s.customClasses, cls] }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  updateCustomClass: (id, input) => {
    set((s) => ({
      customClasses: s.customClasses.map((c) =>
        c.id === id ? { ...c, ...input } : c
      ),
    }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  deleteCustomClass: (id) => {
    set((s) => ({ customClasses: s.customClasses.filter((c) => c.id !== id) }));
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setEnergyNotification: (config) => {
    set({ energyNotification: config });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setHydrationNotification: (config) => {
    set({ hydrationNotification: config });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  setTimezone: (tz) => {
    set({ timezone: tz });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  awardXP: (xpGained) => {
    const { points, threshold } = get();
    const result = applyXP(points, threshold, xpGained);
    set({ points: result.points, threshold: result.threshold });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
    return { didLevelUp: result.didLevelUp, newLevel: result.newLevel };
  },

  drinkWater: () => {
    const now = new Date().toISOString();
    const { hydration, hydrationLastUpdated, dailyWaterServings } = get();
    const { hydration: current } = applyHydrationDecay(hydration, hydrationLastUpdated, now);
    const gain = 100 / dailyWaterServings;
    set({ hydration: Math.min(120, current + gain), hydrationLastUpdated: now });
    const { useAuthStore } = require('./authStore');
    fireAndForgetSave(useAuthStore.getState().user?.uid);
  },

  applyHydrationDecay: (now = new Date().toISOString()) => {
    const { hydration, hydrationLastUpdated } = get();
    const result = applyHydrationDecay(hydration, hydrationLastUpdated, now);
    if (result.updated) {
      set({ hydration: result.hydration, hydrationLastUpdated: now });
      const { useAuthStore } = require('./authStore');
      fireAndForgetSave(useAuthStore.getState().user?.uid);
    }
  },

  applyEnergyDecay: (now = new Date().toISOString()) => {
    const { energy, energyLastUpdated, energyMinutesPerDay, energyDecayEnabled } = get();
    if (!energyDecayEnabled) return;
    const result = applyEnergyDecay(energy, energyLastUpdated, now, energyMinutesPerDay);
    if (result.updated) {
      set({ energy: result.energy, energyLastUpdated: now });
      const { useAuthStore } = require('./authStore');
      fireAndForgetSave(useAuthStore.getState().user?.uid);
    }
  },
}));

// ---------------------------------------------------------------------------
// Real-time listener (Phase 6 – Multi-Device Sync)
// ---------------------------------------------------------------------------

let _characterUnsub: (() => void) | null = null;

// Incremented each time mountCharacterListener is called; lets the async IIFE detect stale setups.
let _characterMountId = 0;

export function mountCharacterListener(userId: string): () => void {
  // Tear down any existing listener before starting a new one (prevents leaks on rapid sign-in/sign-out)
  unmountCharacterListener();

  // Capture the id for this particular mount so the async IIFE can detect if unmount raced ahead
  const mountId = ++_characterMountId;

  // Kick off async setup; keep module-level ref so unmount always works
  (async () => {
    try {
      const db = await getFirebaseFirestore();

      // If unmountCharacterListener() was called while we were awaiting getFirebaseFirestore(), bail out
      if (mountId !== _characterMountId) return;

      if (Platform.OS === 'web') {
        const { onSnapshot, doc } = await import('firebase/firestore');

        // Check again after the dynamic import
        if (mountId !== _characterMountId) return;

        const ref = doc(db as any, 'users', userId, 'character', 'data');
        _characterUnsub = onSnapshot(ref, (snapshot: any) => {
          if (snapshot.exists()) {
            useCharacterStore.setState({ ...snapshot.data() });
          }
        });
      } else {
        const ref = (db as any).collection('users').doc(userId).collection('character').doc('data');
        _characterUnsub = ref.onSnapshot((snapshot: any) => {
          if (snapshot.exists) {
            useCharacterStore.setState({ ...snapshot.data() });
          }
        });
      }
    } catch (e) {
      console.warn('[characterStore] mountCharacterListener failed:', e);
    }
  })();

  return () => unmountCharacterListener();
}

export function unmountCharacterListener(): void {
  // Invalidate any in-flight async setup by bumping the mount id
  _characterMountId++;
  _characterUnsub?.();
  _characterUnsub = null;
}

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
