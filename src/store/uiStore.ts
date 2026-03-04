import { create } from 'zustand';
import { Importance, Difficulty } from '../types';

interface UIState {
  searchQuery: string;
  importanceFilter: Importance | null;
  difficultyFilter: Difficulty | null;
  skillFilter: string | null;
  showCompleted: boolean;
  selectedParentId: string | null;
  sidebarVisible: boolean;

  setSearchQuery: (q: string) => void;
  setImportanceFilter: (f: Importance | null) => void;
  setDifficultyFilter: (f: Difficulty | null) => void;
  setSkillFilter: (f: string | null) => void;
  setShowCompleted: (v: boolean) => void;
  setSelectedParentId: (id: string | null) => void;
  setSidebarVisible: (v: boolean) => void;
  toggleSidebar: () => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  searchQuery: '',
  importanceFilter: null,
  difficultyFilter: null,
  skillFilter: null,
  showCompleted: false,
  selectedParentId: null,
  sidebarVisible: false,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setImportanceFilter: (importanceFilter) => set({ importanceFilter }),
  setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),
  setSkillFilter: (skillFilter) => set({ skillFilter }),
  setShowCompleted: (showCompleted) => set({ showCompleted }),
  setSelectedParentId: (selectedParentId) => set({ selectedParentId }),
  setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  clearFilters: () =>
    set({
      searchQuery: '',
      importanceFilter: null,
      difficultyFilter: null,
      skillFilter: null,
    }),
}));
