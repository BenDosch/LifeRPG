export type Difficulty = 'easy' | 'medium' | 'hard';
export type Importance = 'very_high' | 'high' | 'medium' | 'low';

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 25,
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#ADFF2F',
  medium: '#FFD700',
  hard: '#FF6347',
};

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  very_high: 'Very High',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export interface Project {
  id: string;           // UUID v4
  name: string;
  difficulty: Difficulty;
  importance: Importance;
  skills: string[];
  parentId: string | null;
  createdAt: string;    // ISO string
  completedAt: string | null;
  levelAtCompletion: number | null;
}

export interface Profile {
  name: string;
  title: string;
  points: number;               // total XP
  threshold: number;            // next level threshold (starts 100, +100 per level)
  momentum: number;             // 0-100
  momentumLastUpdated: string;  // 'YYYY-MM-DD'
}

export interface LogEntry {
  id: string;
  projectId: string;
  projectName: string;
  difficulty: Difficulty;
  xpAwarded: number;
  skills: string[];
  completedAt: string;  // ISO string
  levelAtCompletion: number;
}
