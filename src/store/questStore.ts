import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Quest, LogEntry, RepeatSchedule, QuestNotification } from '../types';
import { useCharacterStore } from './characterStore';
import { useUIStore, LevelUpEntry, QuestCompleteEvent } from './uiStore';
import { calcLevel, calcXP } from '../utils/xp';
import { getSkillLevels, getClassLevels } from '../utils/skillLevels';
import { HERO_CLASSES, getClassDef, DEFAULT_SKILLS } from '../data/heroClasses';
import { checkClassRequirements } from '../utils/classRequirements';
import { isQuestAvailable } from '../utils/repeat';
import { advanceDueDate } from '../utils/dueDate';
import { Platform } from 'react-native';
import {
  getQuestsCollectionRef,
  getQuestRef,
  getLogCollectionRef,
  getLogEntryRef,
  getSkillsRef,
  firestoreSetDoc,
  firestoreGetDoc,
  firestoreGetDocs,
  firestoreDeleteDoc,
  firestoreBatch,
} from '../lib/firestore';
import { getFirebaseFirestore } from '../lib/firebase';

interface QuestInput {
  name: string;
  details?: string;
  difficulty: number;   // 1–100
  urgency: number;   // 1–100
  skills: string[];
  parentId?: string | null;
  repeatable?: boolean;
  repeatSchedule?: RepeatSchedule;
  goldReward?: number;
  hydrationReward?: number;
  energyReward?: number;
  hydrationCost?: number;
  energyCost?: number;
  autoCompleteOnSubQuests?: boolean;
  dueDate?: string | null;
  dueTime?: string | null;
  dueDateSchedule?: RepeatSchedule | null;
  notification?: QuestNotification | null;
  icon?: string | null;
  iconColor?: string | null;
  classQuest?: string | null;
}

interface SkillsData {
  skillIcons: Record<string, string>;
  skillColors: Record<string, string>;
  standaloneSkills: string[];
  skillGroups: Record<string, string[]>;
  groupIcons: Record<string, string>;
  groupColors: Record<string, string>;
}

interface QuestState {
  quests: Quest[];
  log: LogEntry[];
  skillIcons: Record<string, string>;
  skillColors: Record<string, string>;
  standaloneSkills: string[];
  skillGroups: Record<string, string[]>;
  groupIcons: Record<string, string>;
  groupColors: Record<string, string>;

  addQuest: (input: QuestInput) => Quest;
  updateQuest: (id: string, input: Partial<QuestInput>) => void;
  deleteQuest: (id: string) => void;
  completeQuest: (id: string) => { xpAwarded: number; goldAwarded: number; skills: string[]; needsNextDueDate: boolean; parentNeedsNextDueDate?: string };
  skipQuest: (id: string) => { needsNextDueDate: boolean };
  uncompleteQuest: (id: string) => void;
  resetQuest: (id: string) => void;
  setSkillIcon: (skillName: string, icon: string | null) => void;
  setSkillColor: (skillName: string, color: string | null) => void;
  addStandaloneSkill: (name: string) => void;
  renameSkill: (oldName: string, newName: string) => void;
  deleteSkill: (name: string) => void;
  addSkillGroup: (name: string) => void;
  deleteSkillGroup: (name: string) => void;
  renameSkillGroup: (oldName: string, newName: string) => void;
  setGroupIcon: (groupName: string, icon: string | null) => void;
  setGroupColor: (groupName: string, color: string | null) => void;
  addSkillToGroup: (groupName: string, skillName: string) => void;
  removeSkillFromGroup: (groupName: string, skillName: string) => void;

  // Selectors
  getQuest: (id: string) => Quest | undefined;
  getRootQuests: () => Quest[];
  getChildren: (parentId: string) => Quest[];
  getAllSkills: () => string[];

  // Firestore hydration
  loadQuestDataFromFirestore: (userId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUid(): string | undefined {
  const { useAuthStore } = require('./authStore');
  return useAuthStore.getState().user?.uid;
}

function getSkillsSnapshot(s: QuestState): SkillsData {
  return {
    skillIcons: s.skillIcons,
    skillColors: s.skillColors,
    standaloneSkills: s.standaloneSkills,
    skillGroups: s.skillGroups,
    groupIcons: s.groupIcons,
    groupColors: s.groupColors,
  };
}

async function saveQuestToFirestore(userId: string, quest: Quest): Promise<void> {
  try {
    const ref = await getQuestRef(userId, quest.id);
    await firestoreSetDoc(ref, quest);
  } catch (e) {
    console.warn('[questStore] Quest write failed:', e);
  }
}

async function saveSkillsToFirestore(userId: string, skillsData: SkillsData): Promise<void> {
  try {
    const ref = await getSkillsRef(userId);
    await firestoreSetDoc(ref, skillsData, { merge: true });
  } catch (e) {
    console.warn('[questStore] Skills write failed:', e);
  }
}

async function addLogEntryToFirestore(userId: string, entry: LogEntry): Promise<void> {
  try {
    const ref = await getLogEntryRef(userId, entry.id);
    await firestoreSetDoc(ref, entry);
  } catch (e) {
    console.warn('[questStore] Log entry write failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useQuestStore = create<QuestState>()((set, get) => ({
  quests: [],
  log: [],
  skillIcons: {},
  skillColors: {},
  standaloneSkills: DEFAULT_SKILLS,
  groupIcons: {},
  groupColors: {},
  skillGroups: {
    Mental: ['Critical Thinking', 'Discipline', 'Focus', 'Logic', 'Mathematics', 'Memory', 'Philosophy', 'Reading', 'Research', 'Study', 'Writing'],
    Physical: ['Agility', 'Balance', 'Core Strength', 'Endurance', 'Flexibility', 'Meditation', 'Nutrition', 'Strength Training'],
    Social: ['Finance', 'Negotiation', 'Networking', 'Persuasion'],
  },

  // ------------------------------------------------------------------
  // Firestore hydration
  // ------------------------------------------------------------------
  loadQuestDataFromFirestore: async (userId) => {
    try {
      const [questsColRef, logColRef, skillsRef] = await Promise.all([
        getQuestsCollectionRef(userId),
        getLogCollectionRef(userId),
        getSkillsRef(userId),
      ]);

      const [questDocs, logDocs, skillsSnap] = await Promise.all([
        firestoreGetDocs(questsColRef),
        firestoreGetDocs(logColRef),
        firestoreGetDoc(skillsRef),
      ]);

      const quests: Quest[] = questDocs.map((d) => d.data as Quest);
      const log: LogEntry[] = logDocs.map((d) => d.data as LogEntry);

      // Sort log descending by completedAt
      log.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      if (skillsSnap.exists && skillsSnap.data) {
        const sd = skillsSnap.data as Partial<SkillsData>;
        set({
          quests,
          log,
          standaloneSkills: sd.standaloneSkills ?? get().standaloneSkills,
          skillGroups: sd.skillGroups ?? get().skillGroups,
          skillIcons: sd.skillIcons ?? {},
          skillColors: sd.skillColors ?? {},
          groupIcons: sd.groupIcons ?? {},
          groupColors: sd.groupColors ?? {},
        });
      } else {
        set({ quests, log });
        // First sign-up: write default skills to Firestore
        const s = get();
        await saveSkillsToFirestore(userId, getSkillsSnapshot(s));
      }
    } catch (e) {
      console.warn('[questStore] Firestore load failed:', e);
    }
  },

  // ------------------------------------------------------------------
  // Quest CRUD
  // ------------------------------------------------------------------
  addQuest: (input) => {
    const quest: Quest = {
      id: uuidv4(),
      name: input.name,
      details: input.details ?? '',
      difficulty: input.difficulty,
      urgency: input.urgency,
      skills: input.skills,
      parentId: input.parentId ?? null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      levelAtCompletion: null,
      repeatable: input.repeatable ?? false,
      repeatSchedule: input.repeatSchedule ?? { type: 'unlimited' },
      lastCompletedAt: null,
      goldReward: input.goldReward ?? 0,
      hydrationReward: input.hydrationReward ?? 0,
      energyReward: input.energyReward ?? 0,
      hydrationCost: input.hydrationCost ?? 0,
      energyCost: input.energyCost ?? 0,
      autoCompleteOnSubQuests: input.autoCompleteOnSubQuests ?? false,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      dueDateSchedule: input.dueDateSchedule ?? null,
      notification: input.notification ?? null,
      icon: input.icon ?? null,
      iconColor: input.iconColor ?? null,
      classQuest: input.classQuest ?? null,
    };
    set((s) => ({ quests: [...s.quests, quest] }));

    // If this sub-quest is repeatable, ensure the parent is too
    if (quest.parentId && quest.repeatable) {
      const parent = get().quests.find((q) => q.id === quest.parentId);
      if (parent && !parent.repeatable) {
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === quest.parentId
              ? { ...q, repeatable: true, repeatSchedule: { type: 'unlimited' } }
              : q
          ),
        }));
        // Write updated parent too
        const uid = getUid();
        if (uid) {
          const updatedParent = get().quests.find((q) => q.id === quest.parentId);
          if (updatedParent) saveQuestToFirestore(uid, updatedParent);
        }
      }
    }

    const uid = getUid();
    if (uid) saveQuestToFirestore(uid, quest);

    return quest;
  },

  updateQuest: (id, input) => {
    set((s) => ({
      quests: s.quests.map((p) =>
        p.id === id ? { ...p, ...input } : p
      ),
    }));

    // If repeatability changed, sync parent
    if ('repeatable' in input) {
      const quest = get().quests.find((q) => q.id === id);
      if (quest?.parentId) {
        const parent = get().quests.find((q) => q.id === quest.parentId);
        if (parent && !parent.repeatable) {
          const anyRepeatableSub = get().quests.some(
            (q) => q.parentId === quest.parentId && q.repeatable
          );
          if (anyRepeatableSub) {
            set((s) => ({
              quests: s.quests.map((q) =>
                q.id === quest.parentId
                  ? { ...q, repeatable: true, repeatSchedule: { type: 'unlimited' } }
                  : q
              ),
            }));
            const uid = getUid();
            if (uid) {
              const updatedParent = get().quests.find((q) => q.id === quest.parentId);
              if (updatedParent) saveQuestToFirestore(uid, updatedParent);
            }
          }
        }
      }
    }

    const uid = getUid();
    if (uid) {
      const updated = get().quests.find((q) => q.id === id);
      if (updated) saveQuestToFirestore(uid, updated);
    }
  },

  deleteQuest: (id) => {
    const toDelete = get().quests.filter((p) => p.id === id || p.parentId === id);
    set((s) => ({
      quests: s.quests.filter((p) => p.id !== id && p.parentId !== id),
    }));

    const uid = getUid();
    if (uid) {
      // Batch delete quest + all sub-quests
      (async () => {
        try {
          const batch = await firestoreBatch();
          for (const q of toDelete) {
            const ref = await getQuestRef(uid, q.id);
            batch.delete(ref);
          }
          await batch.commit();
        } catch (e) {
          console.warn('[questStore] Batch delete failed:', e);
        }
      })();
    }
  },

  completeQuest: (id) => {
    const quest = get().quests.find((p) => p.id === id);
    if (!quest || quest.completedAt) return { xpAwarded: 0, goldAwarded: 0, skills: [], needsNextDueDate: false };

    const characterStore = useCharacterStore.getState();
    const xpAwarded = calcXP(quest.difficulty, quest.urgency);
    const goldAwarded = quest.goldReward ?? 0;

    // Snapshot levels BEFORE this completion so we can diff them after
    const logBefore = get().log;
    const skillsBefore = getSkillLevels(logBefore);
    const classesBefore = getClassLevels(logBefore);
    const oldPlayerLevel = calcLevel(characterStore.threshold);

    const { newLevel, didLevelUp: playerDidLevelUp } = characterStore.awardXP(xpAwarded);
    if (goldAwarded > 0) characterStore.addGold(goldAwarded);
    if (quest.hydrationReward > 0) characterStore.gainHydration(quest.hydrationReward);
    if (quest.energyReward > 0) characterStore.gainEnergy(quest.energyReward);
    if (quest.hydrationCost > 0) characterStore.spendHydration(quest.hydrationCost);
    if (quest.energyCost > 0) characterStore.spendEnergy(quest.energyCost);

    const completedAt = new Date().toISOString();
    const levelAtCompletion = newLevel;

    // Determine next due date for repeatable quests
    const nextDueDate =
      quest.repeatable && quest.dueDate && quest.dueDateSchedule
        ? advanceDueDate(quest.dueDateSchedule, new Date(completedAt))
        : null;
    const needsNextDueDate =
      quest.repeatable && !!quest.dueDate && !quest.dueDateSchedule;

    const newLogEntry: LogEntry = {
      id: uuidv4(),
      questId: id,
      questName: quest.name,
      difficulty: quest.difficulty,
      urgency: quest.urgency,
      xpAwarded,
      skills: quest.skills,
      completedAt,
      levelAtCompletion,
      equippedClass: (quest.classQuest ?? characterStore.heroClass) || undefined,
    };

    set((s) => ({
      quests: quest.repeatable
        ? s.quests.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              lastCompletedAt: completedAt,
              ...(nextDueDate ? { dueDate: nextDueDate } : {}),
            };
          })
        : s.quests.map((p) =>
            p.id === id ? { ...p, completedAt, levelAtCompletion } : p
          ),
      log: [newLogEntry, ...s.log],
    }));

    // Fire-and-forget Firestore writes
    const uid = getUid();
    if (uid) {
      const updatedQuest = get().quests.find((q) => q.id === id);
      if (updatedQuest) saveQuestToFirestore(uid, updatedQuest);
      addLogEntryToFirestore(uid, newLogEntry);
    }

    // Diff levels after the new log entry is committed
    const skillsAfter = getSkillLevels(get().log);
    const classesAfter = getClassLevels(get().log);
    const levelUpEntries: LevelUpEntry[] = [];

    if (playerDidLevelUp) {
      levelUpEntries.push({
        type: 'player',
        name: characterStore.name || 'Player',
        previousLevel: oldPlayerLevel,
        newLevel,
        icon: 'trophy-outline',
        color: '#FFD700',
      });
    }
    for (const [skill, lvl] of Object.entries(skillsAfter)) {
      const prev = skillsBefore[skill] ?? 0;
      if (lvl > prev) {
        levelUpEntries.push({
          type: 'skill',
          name: skill,
          previousLevel: prev,
          newLevel: lvl,
          icon: get().skillIcons[skill] || undefined,
          color: get().skillColors[skill] || '#a855f7',
        });
      }
    }
    for (const [cls, lvl] of Object.entries(classesAfter)) {
      const prev = classesBefore[cls] ?? 0;
      if (lvl > prev) {
        const classDef = getClassDef(cls, useCharacterStore.getState().customClasses);
        levelUpEntries.push({
          type: 'class',
          name: cls,
          previousLevel: prev,
          newLevel: lvl,
          icon: classDef?.icon || 'shield-outline',
          color: classDef?.color || '#94a3b8',
        });
      }
    }
    // Detect classes that became unlockable for the first time due to this completion
    const logAfter = get().log;
    const freshProfile = useCharacterStore.getState();
    const allClasses = [...HERO_CLASSES, ...freshProfile.customClasses];
    for (const cls of allClasses) {
      if (cls.requirements.length === 0) continue;
      if (freshProfile.unlockedClasses.includes(cls.name)) continue;
      if (freshProfile.heroClass === cls.name) continue;
      const qualifiedBefore = checkClassRequirements(cls, skillsBefore, oldPlayerLevel, logBefore);
      const qualifiedAfter = checkClassRequirements(cls, skillsAfter, newLevel, logAfter);
      if (!qualifiedBefore && qualifiedAfter) {
        levelUpEntries.push({
          type: 'unlock',
          name: cls.name,
          previousLevel: 0,
          newLevel: 0,
          icon: cls.icon,
          color: cls.color,
        });
      }
    }

    // Auto-complete parent if all sub-quests are now done
    let parentNeedsNextDueDate: string | undefined;
    if (quest.parentId) {
      const updated = get().quests;
      const parent = updated.find((p) => p.id === quest.parentId);
      if (parent && parent.autoCompleteOnSubQuests && !parent.completedAt) {
        const siblings = updated.filter((p) => p.parentId === parent.id);
        const allDone = siblings.every((s) =>
          s.repeatable
            ? !!s.lastCompletedAt && !isQuestAvailable(s, parent)
            : !!s.completedAt
        );
        if (allDone) {
          const parentResult = get().completeQuest(parent.id);
          if (parentResult.needsNextDueDate) parentNeedsNextDueDate = parent.id;
        }
      }
    }

    // Trigger quest-complete popup (level-up entries are deferred until popup is dismissed)
    useUIStore.getState().triggerQuestComplete({
      questName: quest.name,
      questIcon: quest.icon,
      questIconColor: quest.iconColor,
      xpAwarded,
      goldAwarded,
      hydrationReward: quest.hydrationReward,
      energyReward: quest.energyReward,
      hydrationCost: quest.hydrationCost,
      energyCost: quest.energyCost,
      skills: quest.skills,
      xpClass: (quest.classQuest ?? characterStore.heroClass) || undefined,
      pendingLevelUpEntries: levelUpEntries,
      pendingNextDueDateId: needsNextDueDate ? id : (parentNeedsNextDueDate ?? null),
    } satisfies QuestCompleteEvent);

    return { xpAwarded, goldAwarded, skills: quest.skills, needsNextDueDate, parentNeedsNextDueDate };
  },

  skipQuest: (id) => {
    const quest = get().quests.find((p) => p.id === id);
    if (!quest || !quest.repeatable || !quest.dueDate) return { needsNextDueDate: false };

    if (quest.dueDateSchedule) {
      const nextDueDate = advanceDueDate(quest.dueDateSchedule, new Date());
      set((s) => ({
        quests: s.quests.map((p) => p.id === id ? { ...p, dueDate: nextDueDate } : p),
      }));
      const uid = getUid();
      if (uid) {
        const updated = get().quests.find((q) => q.id === id);
        if (updated) saveQuestToFirestore(uid, updated);
      }
      return { needsNextDueDate: false };
    }

    // No auto-schedule — caller must prompt user for next date
    return { needsNextDueDate: true };
  },

  uncompleteQuest: (id) => {
    set((s) => ({
      quests: s.quests.map((p) =>
        p.id === id ? { ...p, completedAt: null, levelAtCompletion: null } : p
      ),
    }));
    const uid = getUid();
    if (uid) {
      const updated = get().quests.find((q) => q.id === id);
      if (updated) saveQuestToFirestore(uid, updated);
    }
  },

  resetQuest: (id) => {
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id === id) {
          return { ...q, completedAt: null, levelAtCompletion: null };
        }
        if (q.parentId === id) {
          return { ...q, completedAt: null, levelAtCompletion: null, lastCompletedAt: null };
        }
        return q;
      }),
    }));
    const uid = getUid();
    if (uid) {
      const affected = get().quests.filter((q) => q.id === id || q.parentId === id);
      for (const q of affected) saveQuestToFirestore(uid, q);
    }
  },

  // ------------------------------------------------------------------
  // Skills
  // ------------------------------------------------------------------
  setSkillIcon: (skillName, icon) => {
    set((s) => {
      const updated = { ...s.skillIcons };
      if (icon === null) { delete updated[skillName]; } else { updated[skillName] = icon; }
      return { skillIcons: updated };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  setSkillColor: (skillName, color) => {
    set((s) => {
      const updated = { ...s.skillColors };
      if (color === null) { delete updated[skillName]; } else { updated[skillName] = color; }
      return { skillColors: updated };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  addStandaloneSkill: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      if (s.standaloneSkills.includes(trimmed)) return s;
      return { standaloneSkills: [...s.standaloneSkills, trimmed] };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  renameSkill: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    set((state) => {
      const standaloneSkills = state.standaloneSkills.map((n) => (n === oldName ? trimmed : n));
      const skillIcons = { ...state.skillIcons };
      if (oldName in skillIcons) { skillIcons[trimmed] = skillIcons[oldName]; delete skillIcons[oldName]; }
      const skillColors = { ...state.skillColors };
      if (oldName in skillColors) { skillColors[trimmed] = skillColors[oldName]; delete skillColors[oldName]; }
      const quests = state.quests.map((q) => ({ ...q, skills: q.skills.map((n) => (n === oldName ? trimmed : n)) }));
      const log = state.log.map((e) => ({ ...e, skills: e.skills.map((n) => (n === oldName ? trimmed : n)) }));
      const skillGroups: Record<string, string[]> = {};
      for (const [group, skills] of Object.entries(state.skillGroups)) {
        skillGroups[group] = skills.map((n) => (n === oldName ? trimmed : n));
      }
      return { standaloneSkills, skillIcons, skillColors, quests, log, skillGroups };
    });
    const charState = useCharacterStore.getState();
    useCharacterStore.setState({
      customClasses: charState.customClasses.map((cls) => ({
        ...cls,
        requirements: cls.requirements.map((req) =>
          req.type === 'skill' && req.skill === oldName ? { ...req, skill: trimmed } : req
        ),
      })),
    });
    const uid = getUid();
    if (uid) {
      // Write all affected quests and skills
      const s = get();
      saveSkillsToFirestore(uid, getSkillsSnapshot(s));
      // Write quests that had the skill
      for (const q of s.quests) {
        if (q.skills.includes(trimmed)) saveQuestToFirestore(uid, q);
      }
    }
  },

  deleteSkill: (name) => {
    // Capture affected quest IDs BEFORE the set() mutation so we can write only those to Firestore.
    const affectedQuestIds = new Set(
      get().quests.filter((q) => q.skills.includes(name)).map((q) => q.id)
    );

    set((state) => {
      const standaloneSkills = state.standaloneSkills.filter((n) => n !== name);
      const skillIcons = { ...state.skillIcons };
      delete skillIcons[name];
      const skillColors = { ...state.skillColors };
      delete skillColors[name];
      const quests = state.quests.map((q) => ({ ...q, skills: q.skills.filter((n) => n !== name) }));
      const log = state.log.map((e) => ({ ...e, skills: e.skills.filter((n) => n !== name) }));
      const skillGroups: Record<string, string[]> = {};
      for (const [group, skills] of Object.entries(state.skillGroups)) {
        skillGroups[group] = skills.filter((n) => n !== name);
      }
      return { standaloneSkills, skillIcons, skillColors, quests, log, skillGroups };
    });
    const charState = useCharacterStore.getState();
    useCharacterStore.setState({
      customClasses: charState.customClasses.map((cls) => ({
        ...cls,
        requirements: cls.requirements.filter(
          (req) => !(req.type === 'skill' && req.skill === name)
        ),
      })),
    });
    const uid = getUid();
    if (uid) {
      const s = get();
      saveSkillsToFirestore(uid, getSkillsSnapshot(s));
      // Write only the quests that previously contained the deleted skill
      for (const q of s.quests) {
        if (affectedQuestIds.has(q.id)) saveQuestToFirestore(uid, q);
      }
    }
  },

  addSkillGroup: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((s) => {
      if (trimmed in s.skillGroups) return s;
      return { skillGroups: { ...s.skillGroups, [trimmed]: [] } };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  deleteSkillGroup: (name) => {
    set((s) => {
      const { [name]: _, ...rest } = s.skillGroups;
      const groupIcons = { ...s.groupIcons }; delete groupIcons[name];
      const groupColors = { ...s.groupColors }; delete groupColors[name];
      return { skillGroups: rest, groupIcons, groupColors };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  renameSkillGroup: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    set((s) => {
      if (!(oldName in s.skillGroups) || trimmed in s.skillGroups) return s;
      const { [oldName]: skills, ...restGroups } = s.skillGroups;
      const groupIcons = { ...s.groupIcons };
      if (oldName in groupIcons) { groupIcons[trimmed] = groupIcons[oldName]; delete groupIcons[oldName]; }
      const groupColors = { ...s.groupColors };
      if (oldName in groupColors) { groupColors[trimmed] = groupColors[oldName]; delete groupColors[oldName]; }
      return { skillGroups: { ...restGroups, [trimmed]: skills }, groupIcons, groupColors };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  setGroupIcon: (groupName, icon) => {
    set((s) => {
      const groupIcons = { ...s.groupIcons };
      if (icon === null) { delete groupIcons[groupName]; } else { groupIcons[groupName] = icon; }
      return { groupIcons };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  setGroupColor: (groupName, color) => {
    set((s) => {
      const groupColors = { ...s.groupColors };
      if (color === null) { delete groupColors[groupName]; } else { groupColors[groupName] = color; }
      return { groupColors };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  addSkillToGroup: (groupName, skillName) => {
    set((s) => {
      const existing = s.skillGroups[groupName];
      if (!existing || existing.includes(skillName)) return s;
      // Remove from any other group first
      const skillGroups: Record<string, string[]> = {};
      for (const [g, skills] of Object.entries(s.skillGroups)) {
        skillGroups[g] = g === groupName
          ? [...skills, skillName]
          : skills.filter((n) => n !== skillName);
      }
      return { skillGroups };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  removeSkillFromGroup: (groupName, skillName) => {
    set((s) => {
      const existing = s.skillGroups[groupName];
      if (!existing) return s;
      return { skillGroups: { ...s.skillGroups, [groupName]: existing.filter((n) => n !== skillName) } };
    });
    const uid = getUid();
    if (uid) saveSkillsToFirestore(uid, getSkillsSnapshot(get()));
  },

  // ------------------------------------------------------------------
  // Selectors
  // ------------------------------------------------------------------
  getQuest: (id) => get().quests.find((p) => p.id === id),

  getRootQuests: () => get().quests.filter((p) => p.parentId === null),

  getChildren: (parentId) =>
    get().quests.filter((p) => p.parentId === parentId),

  getAllSkills: () => {
    const skills = new Set<string>();
    get().quests.forEach((p) => p.skills.forEach((s) => skills.add(s)));
    get().standaloneSkills.forEach((s) => skills.add(s));
    return Array.from(skills).sort();
  },
}));

// ---------------------------------------------------------------------------
// Real-time listeners (Phase 6 – Multi-Device Sync)
// ---------------------------------------------------------------------------

let _questUnsubs: Array<() => void> = [];
let _questMountId = 0;

export function mountQuestListeners(userId: string): () => void {
  // Tear down any existing listeners before starting new ones (prevents leaks on rapid sign-in/sign-out)
  unmountQuestListeners();

  const mountId = ++_questMountId;

  (async () => {
    try {
      const db = await getFirebaseFirestore();

      if (mountId !== _questMountId) return;

      let questUnsub: (() => void) | null = null;
      let logUnsub: (() => void) | null = null;

      if (Platform.OS === 'web') {
        const { onSnapshot, collection } = await import('firebase/firestore');

        // Check again after the dynamic import in case unmount raced
        if (mountId !== _questMountId) return;

        const questsRef = collection(db as any, 'users', userId, 'quests');
        questUnsub = onSnapshot(questsRef, (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const quest = { ...change.doc.data(), id: change.doc.id } as Quest;
            if (change.type === 'added' || change.type === 'modified') {
              useQuestStore.setState((state) => ({
                quests: state.quests.some((q) => q.id === quest.id)
                  ? state.quests.map((q) => (q.id === quest.id ? quest : q))
                  : [...state.quests, quest],
              }));
            } else if (change.type === 'removed') {
              useQuestStore.setState((state) => ({
                quests: state.quests.filter((q) => q.id !== quest.id),
              }));
            }
          });
        });

        const logRef = collection(db as any, 'users', userId, 'log');
        logUnsub = onSnapshot(logRef, (snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const entry = { ...change.doc.data(), id: change.doc.id } as LogEntry;
            if (change.type === 'added') {
              useQuestStore.setState((state) => ({
                log: state.log.some((l) => l.id === entry.id)
                  ? state.log
                  : [entry, ...state.log],
              }));
            } else if (change.type === 'modified') {
              useQuestStore.setState((state) => ({
                log: state.log.map((l) => (l.id === entry.id ? entry : l)),
              }));
            } else if (change.type === 'removed') {
              useQuestStore.setState((state) => ({
                log: state.log.filter((l) => l.id !== entry.id),
              }));
            }
          });
        });
      } else {
        const questsRef = (db as any).collection('users').doc(userId).collection('quests');
        questUnsub = questsRef.onSnapshot((snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const quest = { ...change.doc.data(), id: change.doc.id } as Quest;
            if (change.type === 'added' || change.type === 'modified') {
              useQuestStore.setState((state) => ({
                quests: state.quests.some((q) => q.id === quest.id)
                  ? state.quests.map((q) => (q.id === quest.id ? quest : q))
                  : [...state.quests, quest],
              }));
            } else if (change.type === 'removed') {
              useQuestStore.setState((state) => ({
                quests: state.quests.filter((q) => q.id !== quest.id),
              }));
            }
          });
        });

        const logRef = (db as any).collection('users').doc(userId).collection('log');
        logUnsub = logRef.onSnapshot((snapshot: any) => {
          snapshot.docChanges().forEach((change: any) => {
            const entry = { ...change.doc.data(), id: change.doc.id } as LogEntry;
            if (change.type === 'added') {
              useQuestStore.setState((state) => ({
                log: state.log.some((l) => l.id === entry.id)
                  ? state.log
                  : [entry, ...state.log],
              }));
            } else if (change.type === 'modified') {
              useQuestStore.setState((state) => ({
                log: state.log.map((l) => (l.id === entry.id ? entry : l)),
              }));
            } else if (change.type === 'removed') {
              useQuestStore.setState((state) => ({
                log: state.log.filter((l) => l.id !== entry.id),
              }));
            }
          });
        });
      }

      _questUnsubs = [questUnsub, logUnsub].filter(Boolean) as Array<() => void>;
    } catch (e) {
      console.warn('[questStore] mountQuestListeners failed:', e);
    }
  })();

  return () => unmountQuestListeners();
}

export function unmountQuestListeners(): void {
  // Invalidate any in-flight async setup by bumping the mount id
  _questMountId++;
  _questUnsubs.forEach((u) => u());
  _questUnsubs = [];
}
