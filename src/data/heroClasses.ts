import { HeroClassDef } from '../types';

/** Look up a class by name from predefined + custom lists. */
export function getClassDef(name: string, customClasses: HeroClassDef[]): HeroClassDef | undefined {
  return HERO_CLASSES.find((c) => c.name === name) ?? customClasses.find((c) => c.name === name);
}

export const HERO_CLASSES: HeroClassDef[] = [
  {
    id: 'adventurer',
    name: 'Adventurer',
    description: 'The starting path. All roads are open to those who begin.',
    color: '#94a3b8',
    icon: 'compass-outline',
    requirements: [],
  },
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Forged through physical discipline and relentless endurance.',
    color: '#ef4444',
    icon: 'shield-outline',
    requirements: [
      { type: 'skill', skill: 'Fitness', level: 3 },
      { type: 'skill', skill: 'Discipline', level: 2 },
    ],
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Knowledge is the sharpest weapon of all.',
    color: '#3b82f6',
    icon: 'book-outline',
    requirements: [
      { type: 'skill', skill: 'Reading', level: 3 },
      { type: 'skill', skill: 'Learning', level: 2 },
    ],
  },
  {
    id: 'coder',
    name: 'Coder',
    description: 'Commands the language of machines with precision.',
    color: '#22c55e',
    icon: 'code-slash-outline',
    requirements: [
      { type: 'skill', skill: 'Coding', level: 5 },
    ],
  },
  {
    id: 'monk',
    name: 'Monk',
    description: 'Masters the mind before mastering the world.',
    color: '#f59e0b',
    icon: 'flower-outline',
    requirements: [
      { type: 'skill', skill: 'Meditation', level: 3 },
      { type: 'skill', skill: 'Health', level: 2 },
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Turns imagination and vision into lasting reality.',
    color: '#ec4899',
    icon: 'color-palette-outline',
    requirements: [
      { type: 'skill', skill: 'Writing', level: 3 },
      { type: 'skill', skill: 'Art', level: 2 },
    ],
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    description: 'Turns effort into opportunity and opportunity into gold.',
    color: '#FFD700',
    icon: 'trending-up-outline',
    requirements: [
      { type: 'skill', skill: 'Finance', level: 3 },
      { type: 'skill', skill: 'Productivity', level: 3 },
    ],
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Balanced in body, mind, and unwavering purpose.',
    color: '#a855f7',
    icon: 'star-outline',
    requirements: [
      { type: 'skill', skill: 'Fitness', level: 5 },
      { type: 'skill', skill: 'Discipline', level: 5 },
      { type: 'skill', skill: 'Reading', level: 3 },
    ],
  },
];
