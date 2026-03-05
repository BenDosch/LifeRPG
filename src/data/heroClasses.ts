import { HeroClassDef } from '../types';


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
    id: 'neophyte scholar',
    name: 'Neophyte Scholar',
    description: 'The first steps into a life of learning. Curiosity is the only requirement.',
    color: '#3b82f6',
    icon: 'book-outline',
    requirements: [
      { type: 'skill', skill: 'Reading', level: 1 },
      { type: 'skill', skill: 'Writing', level: 1 },
    ],
  },
  {
    id: 'apprentice scholar',
    name: 'Apprentice Scholar',
    description: 'A student of the world, sharpening the mind through study and reflection.',
    color: '#3b82f6',
    icon: 'book-outline',
    requirements: [
      { type: 'skill', skill: 'Reading', level: 5 },
      { type: 'skill', skill: 'Writing', level: 5 },
      { type: 'skill', skill: 'Research', level: 2 },
      { type: 'skill', skill: 'Critical Thinking', level: 2 },
      { type: 'classLevel', className: 'Neophyte Scholar', level: 10 },
    ],
  },
  {
    id: 'journeyman scholar',
    name: 'Journeyman Scholar',
    description: 'A learned mind capable of deep inquiry and original thought.',
    color: '#3b82f6',
    icon: 'book-outline',
    requirements: [
      { type: 'skill', skill: 'Reading', level: 10 },
      { type: 'skill', skill: 'Writing', level: 10 },
      { type: 'skill', skill: 'Research', level: 6 },
      { type: 'skill', skill: 'Critical Thinking', level: 6 },
      { type: 'skill', skill: 'Discipline', level: 3 },
      { type: 'classLevel', className: 'Apprentice Scholar', level: 10 },
    ],
  },
  {
    id: 'master scholar',
    name: 'Master Scholar',
    description: 'A true sage. Knowledge, wisdom, and discipline forged into one.',
    color: '#3b82f6',
    icon: 'book-outline',
    requirements: [
      { type: 'skill', skill: 'Reading', level: 20 },
      { type: 'skill', skill: 'Writing', level: 20 },
      { type: 'skill', skill: 'Research', level: 15 },
      { type: 'skill', skill: 'Critical Thinking', level: 15 },
      { type: 'skill', skill: 'Discipline', level: 8 },
      { type: 'classLevel', className: 'Journeyman Scholar', level: 10 },
    ],
  },
  {
    id: 'neophyte merchant',
    name: 'Neophyte Merchant',
    description: 'A fledgling trader learning the value of things — and of people.',
    color: '#10b981',
    icon: 'storefront-outline',
    requirements: [
      { type: 'skill', skill: 'Negotiation', level: 1 },
      { type: 'skill', skill: 'Finance', level: 1 },
    ],
  },
  {
    id: 'apprentice merchant',
    name: 'Apprentice Merchant',
    description: 'Building a reputation through honest deals and sharp instincts.',
    color: '#10b981',
    icon: 'storefront-outline',
    requirements: [
      { type: 'skill', skill: 'Negotiation', level: 5 },
      { type: 'skill', skill: 'Finance', level: 5 },
      { type: 'skill', skill: 'Persuasion', level: 2 },
      { type: 'skill', skill: 'Networking', level: 2 },
      { type: 'classLevel', className: 'Neophyte Merchant', level: 10 },
    ],
  },
  {
    id: 'journeyman merchant',
    name: 'Journeyman Merchant',
    description: 'A shrewd dealmaker with a growing network and a mind for opportunity.',
    color: '#10b981',
    icon: 'storefront-outline',
    requirements: [
      { type: 'skill', skill: 'Negotiation', level: 10 },
      { type: 'skill', skill: 'Finance', level: 10 },
      { type: 'skill', skill: 'Persuasion', level: 6 },
      { type: 'skill', skill: 'Networking', level: 6 },
      { type: 'skill', skill: 'Discipline', level: 3 },
      { type: 'classLevel', className: 'Apprentice Merchant', level: 10 },
    ],
  },
  {
    id: 'master merchant',
    name: 'Master Merchant',
    description: 'A titan of trade. Empires of wealth built on trust, strategy, and relentless ambition.',
    color: '#10b981',
    icon: 'storefront-outline',
    requirements: [
      { type: 'skill', skill: 'Negotiation', level: 20 },
      { type: 'skill', skill: 'Finance', level: 20 },
      { type: 'skill', skill: 'Persuasion', level: 15 },
      { type: 'skill', skill: 'Networking', level: 15 },
      { type: 'skill', skill: 'Discipline', level: 15 },
      { type: 'classLevel', className: 'Journeyman Merchant', level: 10 },
    ],
  },
  {
    id: 'neophyte warrior',
    name: 'Neophyte Warrior',
    description: 'Raw strength and will. The forge has not yet shaped the steel.',
    color: '#ef4444',
    icon: 'fitness-outline',
    requirements: [
      { type: 'skill', skill: 'Strength Training', level: 1 },
      { type: 'skill', skill: 'Endurance', level: 1 },
    ],
  },
  {
    id: 'apprentice warrior',
    name: 'Apprentice Warrior',
    description: 'Building the body and the habit of hardship. Pain is the teacher.',
    color: '#ef4444',
    icon: 'fitness-outline',
    requirements: [
      { type: 'skill', skill: 'Strength Training', level: 5 },
      { type: 'skill', skill: 'Endurance', level: 5 },
      { type: 'skill', skill: 'Agility', level: 2 },
      { type: 'skill', skill: 'Nutrition', level: 2 },
      { type: 'classLevel', className: 'Neophyte Warrior', level: 10 },
    ],
  },
  {
    id: 'journeyman warrior',
    name: 'Journeyman Warrior',
    description: 'A proven fighter. Strength of body and mind earned through relentless effort.',
    color: '#ef4444',
    icon: 'fitness-outline',
    requirements: [
      { type: 'skill', skill: 'Strength Training', level: 10 },
      { type: 'skill', skill: 'Endurance', level: 10 },
      { type: 'skill', skill: 'Agility', level: 6 },
      { type: 'skill', skill: 'Nutrition', level: 6 },
      { type: 'skill', skill: 'Discipline', level: 3 },
      { type: 'classLevel', className: 'Apprentice Warrior', level: 10 },
    ],
  },
  {
    id: 'master warrior',
    name: 'Master Warrior',
    description: 'Unbreakable. A living weapon tempered by years of sacrifice and sweat.',
    color: '#ef4444',
    icon: 'fitness-outline',
    requirements: [
      { type: 'skill', skill: 'Strength Training', level: 20 },
      { type: 'skill', skill: 'Endurance', level: 20 },
      { type: 'skill', skill: 'Agility', level: 15 },
      { type: 'skill', skill: 'Nutrition', level: 15 },
      { type: 'skill', skill: 'Discipline', level: 15 },
      { type: 'classLevel', className: 'Journeyman Warrior', level: 10 },
    ],
  },
  {
    id: 'neophyte yogi',
    name: 'Neophyte Yogi',
    description: 'Beginner on the journey of mastering the self before mastering the world.',
    color: '#f59e0b',
    icon: 'flower-outline',
    requirements: [
      { type: 'skill', skill: 'Meditation', level: 1 },
      { type: 'skill', skill: 'Flexibility', level: 1 },
    ],
  },
  {
    id: 'apprentice yogi',
    name: 'Apprentice Yogi',
    description: 'Future master of the mind and body',
    color: '#f59e0b',
    icon: 'flower-outline',
    requirements: [
      { type: 'skill', skill: 'Meditation', level: 5 },
      { type: 'skill', skill: 'Flexibility', level: 5 },
      { type: 'skill', skill: 'Balance', level: 2 },
      { type: 'skill', skill: 'Core Strength', level: 2 },
      { type: 'classLevel', className: 'Neophyte Yogi', level: 10 },
    ],
  },
  {
    id: 'journeyman yogi',
    name: 'Journeyman Yogi',
    description: 'A step away from becoming master of the mind, body, and world.',
    color: '#f59e0b',
    icon: 'flower-outline',
    requirements: [
      { type: 'skill', skill: 'Meditation', level: 10 },
      { type: 'skill', skill: 'Flexibility', level: 10 },
      { type: 'skill', skill: 'Balance', level: 6 },
      { type: 'skill', skill: 'Core Strength', level: 6 },
      { type: 'skill', skill: 'Discipline', level: 3 },
      { type: 'classLevel', className: 'Apprentice Yogi', level: 10 },
    ],
  },
  {
    id: 'master yogi',
    name: 'Master Yogi',
    description: 'Master of the mind, body, and world.',
    color: '#f59e0b',
    icon: 'flower-outline',
    requirements: [
      { type: 'skill', skill: 'Meditation', level: 20 },
      { type: 'skill', skill: 'Flexibility', level: 20 },
      { type: 'skill', skill: 'Balance', level: 15 },
      { type: 'skill', skill: 'Core Strength', level: 15 },
      { type: 'skill', skill: 'Discipline', level: 15 },
      { type: 'classLevel', className: 'Journeyman Yogi', level: 10 },
    ],
  },
];

/** All unique skill names referenced across every predefined hero class requirement. */
export const DEFAULT_SKILLS: string[] = Array.from(
  new Set(
    HERO_CLASSES.flatMap((c) =>
      c.requirements
        .filter((r): r is Extract<typeof r, { type: 'skill' }> => r.type === 'skill')
        .map((r) => r.skill)
    )
  )
).sort();

