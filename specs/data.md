# Data & Stores

LifeRPG uses four Zustand stores. Three persist to AsyncStorage; one is intentionally transient. All state is local to the device — there is no backend, sync, or user account.

---

## Persistence Overview

| Store | Persistence Key | Persisted |
|---|---|---|
| Quest Store | `liferpg-projects` | Yes |
| Character Store | `liferpg-profile` | Yes |
| Shop Store | `liferpg-shop` | Yes |
| UI Store | — | No |

On first launch, stores hydrate from AsyncStorage. Until hydration completes, the app renders nothing (splash screen is held). After hydration, the splash screen is hidden and the app renders normally.

---

## Quest Store (`src/store/questStore.ts`)

### State

**Quests**: An array of Quest objects. Each quest is a flat record in the array; hierarchy is represented by `parentId` references, not nesting.

**Log**: An array of LogEntry objects. Each entry is an immutable snapshot created at quest completion time. The log is append-only during normal use (uncomplete/reset actions add compensating entries or modify state but do not delete log entries). Skill XP and class XP are both derived entirely from this log.

**Skill configuration**:
- `standaloneSkills`: Ordered array of skill names not assigned to any group.
- `skillGroups`: A map of group name → array of skill names in that group.
- `skillIcons`: A map of skill name → Ionicons icon name.
- `skillColors`: A map of skill name → hex color string.
- `groupIcons`: A map of group name → Ionicons icon name.
- `groupColors`: A map of group name → hex color string.

### Derived Data

The quest store exposes selector functions (not stored state) for:
- `getQuest(id)`: Retrieve a single quest by ID.
- `getRootQuests()`: All quests with no `parentId`.
- `getChildren(parentId)`: All direct sub-quests of a given quest.
- `getAllSkills()`: Combined list of all skill names across standalone and groups.

Skill XP, skill levels, and class XP/levels are computed in utility functions (`src/utils/skillLevels.ts`, `src/utils/classLevels.ts`) by scanning the log array. They are not cached in the store.

---

## Character Store (`src/store/characterStore.ts`)

### State

**Identity**: Player name and currently equipped hero class name.

**XP/Level**: Lifetime XP points and the threshold for the next level. Level is derived from threshold, not stored directly.

**Gold**: Current gold balance as a non-negative integer.

**Energy**: Current energy percentage (0–100), timestamp of last update, decay enabled flag, and decay rate in minutes per day.

**Hydration**: Current hydration percentage (0–120), timestamp of last update, water unit preference (imperial/metric), and daily servings goal.

**Classes**:
- `customClasses`: Array of custom HeroClassDef objects created by the player.
- `unlockedClasses`: Array of class name strings the player has met requirements for.

**UI**: `colorScheme` (`'dark'` or `'light'`).

### Derived Hooks

- `useLevel()`: Reads `threshold` from the store and returns the current player level integer.
- `useXpProgress()`: Returns an object with the XP progress within the current level, the level's XP range, and the raw points/threshold values.

---

## Shop Store (`src/store/shopStore.ts`)

### State

**Items**: Array of ShopItem objects — the shop catalog. Each item has its full definition including cost, effects, quantity, and visual config. When an item's finite quantity reaches 0, it remains in the array but is marked out of stock.

**Inventory**: Array of InventoryItem objects — the player's owned items. When the player buys an item they already own, the existing entry's quantity is incremented rather than creating a duplicate entry.

---

## UI Store (`src/store/uiStore.ts`)

### State

The UI store holds two categories of state: quest list filters and modal event payloads.

**Filters** (reset on app restart):
- Search query string
- Urgency tier filter
- Difficulty tier filter
- Due date filter (overdue / today / tomorrow / this week)
- Skill name filter
- Show completed toggle
- Sort order (due date / urgency / difficulty)

**Modal events**: Transient payloads set by the quest completion flow and cleared when modals dismiss:
- Quest complete event: carries all rewards data for the Quest Complete modal.
- Level up event: carries an array of level-up entries for the Level Up modal.
- Quest due date ID: the ID of a quest needing a manual due date prompt.
- Class picker open flag.

---

## Key Types

### Quest

Flat record representing a single task. Contains all scheduling, reward, cost, and visual fields. Hierarchy is expressed via `parentId`; sub-quests are stored alongside root quests in the same flat array.

### RepeatSchedule

A union type describing when a repeatable quest becomes available again. Variants: `unlimited`, `hours` (with `every` count), `days`, `weeks`, `months` (all with `every` count), `weekdays` (with `days` array of 0–6 integers).

### LogEntry

Immutable snapshot of a quest completion event. Captures the quest name, difficulty, urgency, skills, XP awarded, player level at time of completion, and the equipped class name. This is the source of truth for all derived progression data.

### HeroClassDef

Definition of a hero class. Contains identity fields (name, description, icon, color) and a requirements array. Each requirement is a typed object specifying what must be true: a skill at a minimum level, the player at a minimum level, another class at a minimum level, or a quests-completed count with optional tier filters.

### ShopItem

Catalog entry for a purchasable item. Contains display info, gold cost, finite or infinite quantity, and energy/hydration effect percentages.

### InventoryItem

A record of items owned by the player. Contains the item ID (matching the shop catalog), name, current quantity, effects, and a last-acquired timestamp.

### Tier

An enum-like string union: `'easy' | 'medium' | 'hard' | 'very_hard'`. Used for displaying and filtering difficulty and urgency. The raw 1–100 numbers are stored on quests; the tier is derived on the fly via `getTier(value)`.

### LevelUpEntry

A record describing a single level-up event. Carries the type (`player`, `skill`, `class`, `class_unlock`), the entity name (for skill/class), the previous and new level numbers, and optional icon/color for display.

### QuestCompleteEvent

A payload set in the UI store when a quest is completed. Contains the quest name, all reward/cost amounts (XP, gold, energy, hydration), the skills that received XP, and the array of pending LevelUpEntry objects to show after the Quest Complete modal dismisses.

---

## Zustand + React 18 Web Requirement

**Critical**: Every selector that returns a new object or array on each call must be wrapped with `useShallow` from `zustand/react/shallow`. This applies to:
- Any selector returning an object literal: `useStore(useShallow(s => ({ a: s.a, b: s.b })))`
- Any selector returning a filtered/mapped array: `useStore(useShallow(s => s.items.filter(...)))`
- Full-state selectors: `useStore(useShallow(s => s))`

Without `useShallow`, React 18's `useSyncExternalStore` sees a new reference on every render and triggers an infinite re-render loop. This is a web-specific issue and does not manifest on native, making it easy to miss.
