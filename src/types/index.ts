export type Tier = 'easy' | 'medium' | 'hard' | 'very_hard';

export const TIER_LABELS: Record<Tier, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Very Hard',
};

export const URGENCY_LABELS: Record<Tier, string> = {
  easy: 'Low',
  medium: 'Medium',
  hard: 'High',
  very_hard: 'Critical',
};

export const TIER_COLORS: Record<Tier, string> = {
  easy: '#ADFF2F',
  medium: '#FFD700',
  hard: '#FF6347',
  very_hard: '#e879f9',
};

export function getTier(value: number): Tier {
  if (value <= 25) return 'easy';
  if (value <= 50) return 'medium';
  if (value <= 75) return 'hard';
  return 'very_hard';
}

export function getTierLabel(value: number): string {
  return TIER_LABELS[getTier(value)];
}

export function getUrgencyLabel(value: number): string {
  return URGENCY_LABELS[getTier(value)];
}

export function getTierColor(value: number): string {
  return TIER_COLORS[getTier(value)];
}

export type RepeatSchedule =
  | { type: 'unlimited' }
  | { type: 'hours'; every: number }
  | { type: 'days'; every: number }
  | { type: 'weeks'; every: number }
  | { type: 'months'; every: number }
  | { type: 'weekdays'; days: number[] }; // 0=Sun … 6=Sat

export interface Quest {
  id: string;           // UUID v4
  name: string;
  details: string;
  difficulty: number;   // 1–100
  urgency: number;   // 1–100
  skills: string[];
  parentId: string | null;
  createdAt: string;    // ISO string
  completedAt: string | null;
  levelAtCompletion: number | null;
  repeatable: boolean;
  repeatSchedule: RepeatSchedule;
  lastCompletedAt: string | null;
  goldReward: number;      // gold awarded on completion
  hydrationReward: number; // hydration added on completion
  energyReward: number;    // energy added on completion
  hydrationCost: number;   // hydration subtracted on completion
  energyCost: number;      // energy subtracted on completion
  autoCompleteOnSubQuests: boolean; // auto-completes when all sub-quests are done
  dueDate: string | null;           // ISO date YYYY-MM-DD
  dueTime: string | null;           // optional time HH:MM
  dueDateSchedule: RepeatSchedule | null; // auto-advance due date on completion
  icon: string | null;
  iconColor: string | null;
  classQuest: string | null; // class name whose XP pool receives completion XP (null = equipped class)
}

export interface Character {
  name: string;
  heroClass: string;
  points: number;               // total XP
  threshold: number;            // next level threshold (starts 100, +100 per level)
  gold: number;                 // total gold accumulated
  hydration: number;            // 0-100 (percentage of daily goal)
  hydrationLastUpdated: string; // ISO timestamp
  energy: number;               // 0-100
  energyLastUpdated: string;    // ISO timestamp
  waterUnit: 'imperial' | 'metric'; // oz vs ml
  dailyWaterServings: number;   // number of servings = 100%; 1 serving = 8oz or 240ml
  energyDecayEnabled: boolean;  // if false, energy only changes via quest costs
  energyMinutesPerDay: number;  // total minutes for energy to drain from 100% to 0%
}

export interface LogEntry {
  id: string;
  questId: string;
  questName: string;
  difficulty: number;   // 1–100 snapshot at completion
  urgency: number;   // 1–100 snapshot at completion
  xpAwarded: number;
  skills: string[];
  completedAt: string;  // ISO string
  levelAtCompletion: number;
  equippedClass?: string; // class equipped at time of completion
}

export type HeroClassRequirement =
  | { type: 'skill'; skill: string; level: number }
  | { type: 'playerLevel'; level: number }
  | { type: 'classLevel'; className: string; level: number }
  | { type: 'questsCompleted'; count: number; allowedDifficulties: Tier[]; allowedUrgencies: Tier[] };

export interface HeroClassDef {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string; // Ionicons glyph name
  requirements: HeroClassRequirement[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;             // gold price
  quantity: number | null;  // null = infinite
  energyEffect: number;     // % change on use (positive = gain, negative = loss)
  hydrationEffect: number;  // % change on use
  icon: string | null;
  iconColor: string | null;
  createdAt: string;        // ISO
}

export interface InventoryItem {
  id: string;               // UUID (stable per unique item name)
  name: string;
  quantity: number;
  energyEffect: number;
  hydrationEffect: number;
  lastAcquiredAt: string;   // ISO, updated on each purchase
}
