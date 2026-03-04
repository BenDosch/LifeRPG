import { create } from 'zustand';
import { Tier } from '../types';

export type SortOrder = 'urgency' | 'due_date' | 'difficulty';
export type DueDateFilter = 'overdue' | 'today' | 'tomorrow' | 'this_week';

export interface LevelUpEntry {
  type: 'player' | 'skill' | 'class' | 'unlock';
  name: string;
  previousLevel: number;
  newLevel: number;
  icon?: string;
  color?: string;
}

export interface QuestCompleteEvent {
  questName: string;
  questIcon: string | null;
  questIconColor: string | null;
  xpAwarded: number;
  goldAwarded: number;
  hydrationReward: number;
  energyReward: number;
  hydrationCost: number;
  energyCost: number;
  skills: string[];
  xpClass: string | undefined;
  pendingLevelUpEntries: LevelUpEntry[];
  pendingNextDueDateId: string | null;
}

interface UIState {
  searchQuery: string;
  urgencyFilter: Tier | null;
  difficultyFilter: Tier | null;
  dueDateFilter: DueDateFilter | null;
  skillFilter: string | null;
  showCompleted: boolean;
  sortOrder: SortOrder;

  setSearchQuery: (q: string) => void;
  setUrgencyFilter: (f: Tier | null) => void;
  setDifficultyFilter: (f: Tier | null) => void;
  setDueDateFilter: (f: DueDateFilter | null) => void;
  setSkillFilter: (f: string | null) => void;
  setShowCompleted: (v: boolean) => void;
  setSortOrder: (order: SortOrder) => void;
  clearFilters: () => void;

  levelUpEvent: LevelUpEntry[] | null;
  triggerLevelUp: (entries: LevelUpEntry[]) => void;
  clearLevelUp: () => void;

  questCompleteEvent: QuestCompleteEvent | null;
  triggerQuestComplete: (event: QuestCompleteEvent) => void;
  clearQuestComplete: () => void;

  questDueDateId: string | null;
  clearQuestDueDateId: () => void;

  classPickerOpen: boolean;
  openClassPicker: () => void;
  closeClassPicker: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  searchQuery: '',
  urgencyFilter: null,
  difficultyFilter: null,
  dueDateFilter: null,
  skillFilter: null,
  showCompleted: false,
  sortOrder: 'due_date',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setUrgencyFilter: (urgencyFilter) => set({ urgencyFilter }),
  setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),
  setDueDateFilter: (dueDateFilter) => set({ dueDateFilter }),
  setSkillFilter: (skillFilter) => set({ skillFilter }),
  setShowCompleted: (showCompleted) => set({ showCompleted }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  clearFilters: () =>
    set({
      searchQuery: '',
      urgencyFilter: null,
      difficultyFilter: null,
      dueDateFilter: null,
      skillFilter: null,
    }),

  levelUpEvent: null,
  triggerLevelUp: (entries) =>
    set((s) => ({ levelUpEvent: [...(s.levelUpEvent ?? []), ...entries] })),
  clearLevelUp: () => set({ levelUpEvent: null }),

  questCompleteEvent: null,
  // Last-write wins on rewards; level-up entries are accumulated across recursive completions
  triggerQuestComplete: (event) =>
    set((s) => ({
      questCompleteEvent: {
        ...event,
        pendingLevelUpEntries: [
          ...(s.questCompleteEvent?.pendingLevelUpEntries ?? []),
          ...event.pendingLevelUpEntries,
        ],
        pendingNextDueDateId:
          s.questCompleteEvent?.pendingNextDueDateId ?? event.pendingNextDueDateId,
      },
    })),
  clearQuestComplete: () =>
    set((s) => {
      const event = s.questCompleteEvent;
      if (!event) return {};
      return {
        questCompleteEvent: null,
        ...(event.pendingLevelUpEntries.length > 0
          ? { levelUpEvent: event.pendingLevelUpEntries }
          : {}),
        ...(event.pendingNextDueDateId
          ? { questDueDateId: event.pendingNextDueDateId }
          : {}),
      };
    }),

  questDueDateId: null,
  clearQuestDueDateId: () => set({ questDueDateId: null }),

  classPickerOpen: false,
  openClassPicker: () => set({ classPickerOpen: true }),
  closeClassPicker: () => set({ classPickerOpen: false }),
}));
