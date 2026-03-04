import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Project, Difficulty, Importance, XP_BY_DIFFICULTY, LogEntry } from '../types';
import { useProfileStore } from './profileStore';
import { calcLevel } from '../utils/xp';

interface ProjectInput {
  name: string;
  difficulty: Difficulty;
  importance: Importance;
  skills: string[];
  parentId?: string | null;
}

interface ProjectState {
  projects: Project[];
  log: LogEntry[];

  addProject: (input: ProjectInput) => Project;
  updateProject: (id: string, input: Partial<ProjectInput>) => void;
  deleteProject: (id: string) => void;
  completeProject: (id: string) => { xpAwarded: number; skills: string[] };
  uncompleteProject: (id: string) => void;

  // Selectors
  getProject: (id: string) => Project | undefined;
  getRootProjects: () => Project[];
  getChildren: (parentId: string) => Project[];
  getAllSkills: () => string[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      log: [],

      addProject: (input) => {
        const project: Project = {
          id: uuidv4(),
          name: input.name,
          difficulty: input.difficulty,
          importance: input.importance,
          skills: input.skills,
          parentId: input.parentId ?? null,
          createdAt: new Date().toISOString(),
          completedAt: null,
          levelAtCompletion: null,
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      updateProject: (id, input) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...input } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter(
            (p) => p.id !== id && p.parentId !== id
          ),
        }));
      },

      completeProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project || project.completedAt) return { xpAwarded: 0, skills: [] };

        const profileStore = useProfileStore.getState();
        const xpAwarded = XP_BY_DIFFICULTY[project.difficulty];
        const { newLevel } = profileStore.awardXP(xpAwarded);
        profileStore.resetMomentum();

        const completedAt = new Date().toISOString();
        const levelAtCompletion = newLevel;

        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, completedAt, levelAtCompletion } : p
          ),
          log: [
            {
              id: uuidv4(),
              projectId: id,
              projectName: project.name,
              difficulty: project.difficulty,
              xpAwarded,
              skills: project.skills,
              completedAt,
              levelAtCompletion,
            },
            ...s.log,
          ],
        }));

        return { xpAwarded, skills: project.skills };
      },

      uncompleteProject: (id) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, completedAt: null, levelAtCompletion: null } : p
          ),
        }));
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      getRootProjects: () => get().projects.filter((p) => p.parentId === null),

      getChildren: (parentId) =>
        get().projects.filter((p) => p.parentId === parentId),

      getAllSkills: () => {
        const skills = new Set<string>();
        get().projects.forEach((p) => p.skills.forEach((s) => skills.add(s)));
        return Array.from(skills).sort();
      },
    }),
    {
      name: 'liferpg-projects',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
