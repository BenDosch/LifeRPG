# LifeRPG

**Turn your real life into an RPG.** LifeRPG is a productivity app that gamifies your daily tasks, habits, and personal growth. Complete quests to earn XP and Gold, level up your character, develop real-world skills, and unlock hero classes — all while tracking your energy and hydration in real time.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [App Overview](#app-overview)
- [HUD — Energy & Hydration](#hud--energy--hydration)
- [Quests](#quests)
- [Character](#character)
- [Attributes & Skills](#attributes--skills)
- [Activity Log](#activity-log)
- [Store](#store)
- [Data & Reset](#data--reset)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

```bash
git clone https://github.com/your-username/LifeRPG.git
cd LifeRPG
npm install
```

---

## Running the App

| Command | Description |
|---|---|
| `npm start` | Start the Expo dev server (scan QR with Expo Go) |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in browser at `localhost:8081` |
| `npm run build:web` | Export a static web build to `/dist` |
| `npm run deploy` | Build and deploy to GitHub Pages |

---

## App Overview

LifeRPG is organised into four tabs:

| Tab | Purpose |
|---|---|
| **Quests** | Create, manage, and complete your quests |
| **Character** | View your level, class, attributes, and skills |
| **Log** | See a history of every completed quest |
| **Store** | Buy and use items with your earned Gold |

A persistent **HUD bar** sits at the top of every screen showing your Energy and Hydration levels in real time.

---

## HUD — Energy & Hydration

### ⚡ Energy

- Represents your current energy level (0–100%).
- **Decays passively over time** based on your configured active hours. By default, energy drains from 100% to 0% over 960 minutes (16 hours).
- Energy decay can be **disabled** in Settings for fully manual control.
- Tap **Full Rest** to instantly restore energy to 100%.
- Quests can **cost** or **reward** energy on completion.
- Color gradient: red (depleted) → yellow → green (full).

### 💧 Hydration

- Represents your daily hydration progress (0–100%, can exceed 100% if you drink beyond your goal).
- **Decays passively** — drains fully over 24 hours regardless of settings.
- Tap **Drank ~8oz** (or ~240ml in metric mode) to log one serving of water.
- Each tap adds `100 ÷ dailyServings` percent to your hydration.
- Quests can **cost** or **reward** hydration on completion.
- Color gradient: red (dehydrated) → blue (well hydrated).

### Fix Energy / Hydration

Go to **Character → Settings → Fix Energy and/or Hydration** to manually correct both values if they don't reflect your real-world state (e.g. after sleeping or forgetting to log). A modal opens with two interactive vertical sliders:

- ⚡ **Flash slider** (bolt icon) — drag to set energy %. Color shifts red → green matching the HUD bar.
- 💧 **Water drop slider** — drag to set hydration %. Color shifts red → blue matching the HUD bar.

Confirming writes both values immediately with a fresh timestamp so passive decay does not instantly override your correction.

---

## Quests

Quests are the core gameplay loop. Each quest maps to a real-world task or habit.

### Creating a Quest

Tap **+** on the Quests tab to open the quest form:

| Field | Description |
|---|---|
| **Icon** | Optional icon with custom color. Tap the icon square to the left of the name field to browse hundreds of icons. |
| **Quest Name** | Short label for the task |
| **Details** | Optional longer description |
| **Difficulty** | Arc slider 1–100 — affects XP earned |
| **Urgency** | Arc slider 1–100 — affects XP earned |
| **Skills** | Tag skills this quest develops |
| **Gold Reward** | Flat gold awarded on completion |
| **Energy Effect** | Optional energy gain (+) or cost (−) on completion |
| **Hydration Effect** | Optional hydration gain (+) or cost (−) on completion |
| **Repeatable** | Whether the quest resets after completion |
| **Due Date / Time** | Optional deadline |
| **Class Quest** | Direct XP to a specific class instead of your equipped one |

### Difficulty & Urgency

| Range | Difficulty | Urgency | Color |
|---|---|---|---|
| 1–25 | Easy | Low | Yellow-green |
| 26–50 | Medium | Medium | Gold |
| 51–75 | Hard | High | Tomato |
| 76–100 | Very Hard | Critical | Fuchsia |

### XP Calculation

```
XP = round(100 × (difficulty / 100) × (urgency / 100))
```

- **Maximum:** 100 XP (both sliders at max)
- **Minimum:** 1 XP
- A live XP preview updates as you adjust the sliders

### Repeatable Quests

Toggle **Repeatable** on to allow a quest to be completed multiple times. Choose a repeat cadence:

| Schedule | Behaviour |
|---|---|
| Unlimited | Available any time, as many times as you want |
| Every N hours | Cooldown of N hours between completions |
| Every N days | Resets on a rolling N-day cycle |
| Every N weeks | Resets on a rolling N-week cycle |
| Every N months | Resets on a rolling N-month cycle |
| Specific weekdays | Only available on selected days of the week |

### Sub-Quests

Any quest can have nested child quests. Tap the **branch icon** on a quest row to add a sub-quest beneath it. Enable **Auto-complete on sub-quests** on the parent to have it automatically complete when all children are finished.

### Due Dates

Set a **Due Date** and optionally a **Due Time**. Enable **Auto-advance due date** to automatically push the deadline forward by a configured schedule each time the quest is completed — ideal for recurring deadlines.

### Class Quests

By default, quest XP goes to your equipped hero class. Enable **Class Quest** and pick a specific class to direct XP there — useful for working toward unlocking a class you haven't equipped yet.

### Quest Filters

Filter the quest list by:

- **Status:** All / Active / Completed
- **Difficulty tier:** Easy / Medium / Hard / Very Hard
- **Urgency tier:** Low / Medium / High / Critical
- **Skill tag**

---

## Character

### Player Level

Your player level is calculated from total accumulated XP across all completed quests.

- Level 0 → 1 costs **100 XP**
- Each subsequent level costs **(level + 1) × 100 XP** more than the last
- Your XP within the current level and the next threshold are shown on a progress bar at the top of the Character screen

### Hero Classes

Your **Hero Class** defines your identity and progression focus. XP from completed quests also contributes to your currently equipped class level (100 XP per class level).

Tap your class banner to open the **Class Picker**. Each class shows its requirements with ✓ / ✗ indicators.

#### Requirement Types

| Type | Example |
|---|---|
| Skill at level N | "Reading Level 5" |
| Class Level N | "Neophyte Scholar Level 10" |
| Player Level N | "Player Level 20" |
| Quests completed | "10 Hard quests completed" |

### Predefined Classes

LifeRPG ships with **17 predefined hero classes** across 5 paths. Every path follows the same four tiers: **Neophyte → Apprentice → Journeyman → Master**.

#### 🧭 Adventurer *(silver — starter)*
No requirements. Everyone begins here.

#### 📘 Scholar Path *(blue)*
Focus: Reading, Writing, Research, Critical Thinking.

| Tier | Class | Key Requirements |
|---|---|---|
| 1 | Neophyte Scholar | Reading 1, Writing 1 |
| 2 | Apprentice Scholar | Reading 5, Writing 5, Research 2, Critical Thinking 2, Neophyte Scholar Lv 10 |
| 3 | Journeyman Scholar | Reading 10, Writing 10, Research 6, Critical Thinking 6, Discipline 3, Apprentice Scholar Lv 10 |
| 4 | Master Scholar | Reading 20, Writing 20, Research 15, Critical Thinking 15, Discipline 8, Journeyman Scholar Lv 10 |

#### 🏪 Merchant Path *(green)*
Focus: Negotiation, Finance, Persuasion, Networking.

| Tier | Class | Key Requirements |
|---|---|---|
| 1 | Neophyte Merchant | Negotiation 1, Finance 1 |
| 2 | Apprentice Merchant | Negotiation 5, Finance 5, Persuasion 2, Networking 2, Neophyte Merchant Lv 10 |
| 3 | Journeyman Merchant | Negotiation 10, Finance 10, Persuasion 6, Networking 6, Discipline 3, Apprentice Merchant Lv 10 |
| 4 | Master Merchant | Negotiation 20, Finance 20, Persuasion 15, Networking 15, Discipline 15, Journeyman Merchant Lv 10 |

#### ⚔️ Warrior Path *(red)*
Focus: Strength Training, Endurance, Agility, Nutrition.

| Tier | Class | Key Requirements |
|---|---|---|
| 1 | Neophyte Warrior | Strength Training 1, Endurance 1 |
| 2 | Apprentice Warrior | Strength Training 5, Endurance 5, Agility 2, Nutrition 2, Neophyte Warrior Lv 10 |
| 3 | Journeyman Warrior | Strength Training 10, Endurance 10, Agility 6, Nutrition 6, Discipline 3, Apprentice Warrior Lv 10 |
| 4 | Master Warrior | Strength Training 20, Endurance 20, Agility 15, Nutrition 15, Discipline 15, Journeyman Warrior Lv 10 |

#### 🌸 Yogi Path *(amber)*
Focus: Meditation, Flexibility, Balance, Core Strength.

| Tier | Class | Key Requirements |
|---|---|---|
| 1 | Neophyte Yogi | Meditation 1, Flexibility 1 |
| 2 | Apprentice Yogi | Meditation 5, Flexibility 5, Balance 2, Core Strength 2, Neophyte Yogi Lv 10 |
| 3 | Journeyman Yogi | Meditation 10, Flexibility 10, Balance 6, Core Strength 6, Discipline 3, Apprentice Yogi Lv 10 |
| 4 | Master Yogi | Meditation 20, Flexibility 20, Balance 15, Core Strength 15, Discipline 15, Journeyman Yogi Lv 10 |

### Custom Classes

Tap **Manage Classes** to create, edit, or delete your own hero classes with any name, color, icon, and requirement set.

---

## Attributes & Skills

The lower section of the Character tab is titled **Attributes and Skills**. Collapsible **Attribute groups** appear first, followed by ungrouped skills below.

### Attribute Groups

Three default attributes come pre-configured:

| Attribute | Default Skills |
|---|---|
| **Mental** | Critical Thinking, Discipline, Focus, Logic, Mathematics, Memory, Philosophy, Reading, Research, Study, Writing |
| **Physical** | Agility, Balance, Core Strength, Endurance, Flexibility, Meditation, Nutrition, Strength Training |
| **Social** | Finance, Negotiation, Networking, Persuasion |

Each attribute header shows:

- **Icon badge** — Custom icon and color with the attribute level number below the icon. Tap to open the customisation modal (icon, color, and name).
- **Attribute name** — Colored in the attribute's theme color
- **XP progress bar** — Fills with the attribute color toward the next level
- **XP label** — `X / 1000 XP to next level`
- **Skill count** with **−** and **+** buttons to remove or add skills
- **🗑 Delete button** — Removes the attribute after confirmation

#### Attribute Levels

```
Attribute Level = floor(combined skill XP in group / 1000)
```

One level per 1,000 combined XP from all skills in the group. No cap.

#### Managing Attributes

| Action | How |
|---|---|
| Collapse / Expand | Tap the attribute row. All default to collapsed. |
| Add a skill | Tap **+** → pick from the list. The skill leaves any other attribute it was in. |
| Remove a skill | Tap **−** → pick which skill to ungroup. |
| Rename / change icon or color | Tap the **icon badge** to open the customise modal. |
| Delete | Tap **🗑** → confirm. All skills in the group become ungrouped. |
| Create new | Tap **+ New Attribute**. Attributes are always sorted alphabetically. |

### Skills

Skills are developed by tagging quests. Every XP point a quest awards is applied to each tagged skill.

```
Skill Level = floor(skill XP / 100)   — 100 XP per level
```

Each skill row shows:

| Element | Description |
|---|---|
| **Icon badge** | Custom icon + color + level number. Tap to open the icon/color/rename/delete picker. |
| **Skill name** | |
| **XP bar** | Progress within the current level |
| **XP label** | `X / 100 XP to next level` |
| **Count** | Number of quest completions that contributed |

#### Default Skills

Pre-loaded from class requirements:

> Agility, Balance, Core Strength, Critical Thinking, Discipline, Endurance, Finance, Flexibility, Focus, Logic, Mathematics, Meditation, Memory, Negotiation, Networking, Nutrition, Persuasion, Philosophy, Reading, Research, Strength Training, Study, Writing

Add any custom skill with **+ Add Skill**. Skills also appear automatically the first time a quest with that skill tag is completed.

### Settings

| Setting | Description |
|---|---|
| **Energy Decay** | Toggle passive energy drain on/off |
| **Active Hours** | Hours + minutes per day over which energy drains fully |
| **Daily Water Goal** | Serving count and unit (imperial oz / metric ml) |
| **Light Mode** | Toggle between dark and light appearance |
| **Fix Energy and/or Hydration** | Manually correct energy and hydration to accurate real-world values |

---

## Activity Log

The **Log** tab shows every completed quest in reverse chronological order. Each entry displays:

- Quest name and icon
- Completion timestamp
- XP awarded
- Difficulty and urgency tiers
- Skills exercised
- Hero class active at time of completion

> The log is the **single source of truth** for all progression. Skill levels, class levels, and player XP are all computed from log entries in real time.

---

## Store

### Shop Items

Create custom rewards to purchase with your earned Gold. Tap **+** in the Shop tab:

| Field | Description |
|---|---|
| **Icon + Name** | Visual identifier for the item |
| **Description** | Optional flavour text |
| **Cost** | Gold price |
| **Quantity** | Finite stock or unlimited supply |
| **Energy Effect** | % energy change on use (−100 to +100) |
| **Hydration Effect** | % hydration change on use (−100 to +100) |

Your current Gold balance is shown at the top of the Store screen. Tap a card to edit or delete it.

### Inventory

Purchased items appear in your **Inventory**:

- Tap **Use** to consume one unit and apply its energy/hydration effects immediately
- Items with 0 remaining are removed automatically

---

## Data & Reset

### Persistence

All data is stored **locally on your device** using AsyncStorage via the Zustand persist middleware. No account, login, or internet connection is required.

### Reset All Progress

**Character → Data → Reset All Progress** will permanently:

- Delete all quests and log entries
- Reset XP, Gold, and player level to zero
- Restore the default skills and attribute groups
- Clear the shop and inventory

> ⚠️ This cannot be undone. A confirmation dialog is shown before proceeding.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/) | Cross-platform mobile & web framework |
| [Expo Router](https://expo.github.io/router/) | File-based navigation |
| [Zustand](https://zustand-demo.pmnd.rs/) | Global state management with AsyncStorage persistence |
| [@expo/vector-icons](https://icons.expo.fyi/) (Ionicons) | All icons throughout the app |
| [NativeWind](https://www.nativewind.dev/) | Tailwind CSS utility classes for React Native |
| [react-timekeeper](https://github.com/catc/react-timekeeper) | Web clock time picker |
| TypeScript | Full type safety across the entire codebase |

---

## Project Structure

```
app/
  (tabs)/
    index.tsx           # Quests tab
    character.tsx       # Character, attributes & settings tab
    log.tsx             # Activity log tab
    store.tsx           # Store & inventory tab
  modals/
    quest-form.tsx      # Quest create / edit modal
    shop-item-form.tsx  # Shop item create / edit modal
  skills.tsx            # Skills management screen

src/
  components/
    character/          # ClassFormModal, ClassPickerModal
    forms/              # QuestForm, ShopItemForm, SkillInput
    hud/                # EnergyBar, HydrationBar, XpBar, HudBar
    quests/             # QuestList, QuestItem, FilterBar, SideList
    shared/             # ArcSlider, SliderInput, FlashSlider,
                        # WaterDropSlider, ConfirmDialog, DateInput,
                        # TimeInput, SelectPicker, LevelUpModal,
                        # QuestCompleteModal, SkillChip, Tooltip
    shop/               # ShopItemCard, InventoryItemCard
    skills/             # IconPickerModal, SkillList
  data/
    heroClasses.ts      # 17 predefined hero classes + DEFAULT_SKILLS
  hooks/
    useEnergyDecay.ts      # Passive energy drain interval hook
    useHydrationDecay.ts   # Passive hydration drain interval hook
    useSkillAutocomplete.ts
  store/
    characterStore.ts   # Name, class, XP, Gold, energy, hydration, settings
    questStore.ts       # Quests, log, skills, skillGroups, groupIcons, groupColors
    shopStore.ts        # Shop items, inventory, purchase logic
    uiStore.ts          # UI state (class picker open/closed)
  theme/
    index.ts            # Color tokens for dark and light mode
    ThemeContext.tsx     # Theme provider and useTheme hook
  types/
    index.ts            # All TypeScript interfaces and enums
  utils/
    xp.ts               # XP calculation and level math
    skillLevels.ts      # Skill and class level derivation from log
    classLevels.ts      # Class XP progress helpers
    classRequirements.ts # Requirement unlock checking
    energy.ts           # Energy decay math
    hydration.ts        # Hydration decay math
    repeat.ts           # Repeatable quest availability logic
    dueDate.ts          # Due date auto-advance logic
    date.ts             # Date formatting helpers
```

