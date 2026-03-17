# Data & Stores

LifeRPG uses four Zustand stores. Three persist to Firestore via a write-through pattern; one is intentionally transient. All data lives under the authenticated user's Firestore document tree — there is no local-only state and no AsyncStorage.

---

## Persistence Overview

| Store | Firestore path | Type | Persisted |
|---|---|---|---|
| Quest Store (quests) | `users/{uid}/quests/{questId}` | subcollection | Yes |
| Quest Store (log) | `users/{uid}/log/{logId}` | subcollection | Yes |
| Quest Store (skills) | `users/{uid}/skills` | document | Yes |
| Character Store | `users/{uid}/character` | document | Yes |
| Shop Store (items) | `users/{uid}/shopItems/{itemId}` | subcollection | Yes |
| Shop Store (inventory) | `users/{uid}/inventory/{itemId}` | subcollection | Yes |
| Auth Store | — (Firebase SDK) | — | Yes (Firebase-managed) |
| UI Store | — | — | No |

On sign-in, all three data stores are hydrated in parallel via `getDocs`/`getDoc` calls before the splash screen is hidden. On first sign-up (no existing documents), stores write their default values to Firestore. The UI store is reset on every app launch.

---

## Authentication (`src/store/authStore.ts`)

Not persisted in Zustand — the Firebase SDK owns session persistence natively.

### State

| Field | Type | Description |
|---|---|---|
| `user` | `AuthUser \| null` | Currently signed-in user, or null if unauthenticated |
| `loading` | `boolean` | True while auth state is resolving on launch |

### AuthUser Type

```typescript
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
```

### Actions

| Action | Description |
|---|---|
| `signInWithEmail(email, password)` | Sign in with email/password |
| `signUpWithEmail(email, password)` | Create a new account |
| `signInWithGoogle()` | Sign in via Google OAuth (popup on web, native flow on mobile) |
| `signOut()` | Sign out; tears down all Firestore listeners before calling Firebase signOut |

The root layout subscribes to `onAuthStateChanged` and updates `user` / `loading` accordingly. All data screens are gated behind `user !== null`.

---

## Quest Store (`src/store/questStore.ts`)

### State

**Quests**: An array of Quest objects. Each quest is a flat record in the array; hierarchy is represented by `parentId` references, not nesting. In Firestore, each quest is an individual document in the `quests` subcollection, keyed by `quest.id`.

**Log**: An array of LogEntry objects. Each entry is an immutable snapshot created at quest completion time. The log is append-only during normal use. Skill XP and class XP are both derived entirely from this log. In Firestore, each log entry is an individual document in the `log` subcollection.

**Skill configuration** (stored as a single `skills` document in Firestore):
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

### Firestore Sync

- **Hydration**: `loadQuestDataFromFirestore(userId)` fetches quests subcollection, log subcollection, and skills document in parallel on sign-in.
- **Write-through**: Every action that mutates quests, log, or skill config writes the affected document(s) to Firestore immediately after updating local state (fire-and-forget).
- **Delete**: `deleteQuest` uses a Firestore batch to atomically delete the quest and all its sub-quest documents.
- **Real-time sync** (Phase 6): `onSnapshot` listeners on the quests and log subcollections keep the local store up to date with changes from other devices.

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

**Notifications**:
- `energyNotification`: `{ enabled: boolean; threshold: number }` — energy threshold alert config.
- `hydrationNotification`: `{ enabled: boolean; threshold: number }` — hydration threshold alert config.
- `timezone`: IANA timezone string (e.g. `'America/New_York'`), auto-detected on sign-in.

**UI**: `colorScheme` (`'dark'` or `'light'`).

### Derived Hooks

- `useLevel()`: Reads `threshold` from the store and returns the current player level integer.
- `useXpProgress()`: Returns an object with the XP progress within the current level, the level's XP range, and the raw points/threshold values.

### Firestore Sync

- **Hydration**: `loadCharacterFromFirestore(userId)` reads the `users/{uid}/character` document on sign-in.
- **Write-through**: Every action appends a `setDoc(characterRef, { ...changes }, { merge: true })` call after updating local state (fire-and-forget). The `merge: true` flag prevents overwriting concurrent writes from other devices.
- **Real-time sync** (Phase 6): `onSnapshot(characterRef)` merges incoming changes into local state.

---

## Shop Store (`src/store/shopStore.ts`)

### State

**Items**: Array of ShopItem objects — the shop catalog. In Firestore, each item is a document in the `shopItems` subcollection keyed by `item.id`.

**Inventory**: Array of InventoryItem objects — the player's owned items. In Firestore, each entry is a document in the `inventory` subcollection keyed by `item.id`. When the player buys an item they already own, the existing entry's quantity is incremented rather than creating a duplicate.

### Firestore Sync

- **Hydration**: `loadShopDataFromFirestore(userId)` fetches `shopItems` and `inventory` subcollections in parallel on sign-in.
- **Write-through**: `addItem`/`updateItem` write to `shopItems/{id}`; `deleteItem` deletes from `shopItems` and removes from `inventory` if owned; `purchaseItem` updates `shopItems/{id}` quantity and upserts `inventory/{id}`; `useInventoryItem` updates or deletes `inventory/{id}`.
- **Real-time sync** (Phase 6): `onSnapshot` listeners on both subcollections keep local state current.

---

## UI Store (`src/store/uiStore.ts`)

### State

The UI store holds two categories of state: quest list filters and modal event payloads. It is intentionally not persisted — this remains true in the Firebase architecture. All filter and modal state resets on every app launch.

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

Flat record representing a single task. Contains all scheduling, reward, cost, visual, and notification fields. Hierarchy is expressed via `parentId`; sub-quests are stored alongside root quests in the same flat array (and the same Firestore subcollection).

Notable field: `notification: QuestNotification | null` — the FCM notification config for this quest's due date reminder.

### QuestNotification

```typescript
type QuestNotification =
  | { type: 'time_of_day'; hour: number; minute: number }  // fire at this hour:minute on dueDate
  | { type: 'before_due'; minutesBefore: number };         // fire N minutes before dueDate + dueTime
```

`time_of_day` requires only `dueDate`. `before_due` requires both `dueDate` and `dueTime`.

### RepeatSchedule

A union type describing when a repeatable quest becomes available again. Variants: `unlimited`, `hours` (with `every` count), `days`, `weeks`, `months` (all with `every` count), `weekdays` (with `days` array of 0–6 integers).

### LogEntry

Immutable snapshot of a quest completion event. Captures the quest name, difficulty, urgency, skills, XP awarded, player level at time of completion, and the equipped class name. This is the source of truth for all derived progression data.

### HeroClassDef

Definition of a hero class. Contains identity fields (name, description, icon, color) and a requirements array. Each requirement is a typed object specifying what must be true: a skill at a minimum level, the player at a minimum level, another class at a minimum level, or a quests-completed count with optional tier filters.

### AuthUser

```typescript
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
```

Wraps the Firebase user object. Used as the `user` field in `authStore`.

### FcmToken

```typescript
interface FcmToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: number;   // Unix timestamp (ms)
  lastSeenAt: number;  // Unix timestamp (ms)
}
```

Stored in `users/{uid}/fcmTokens/{tokenHash}`. Upserted on app launch; stale tokens (>60 days) are pruned by a scheduled Cloud Function.

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

## Zustand + Firestore Pattern

**Critical**: Every selector that returns a new object or array on each call must be wrapped with `useShallow` from `zustand/react/shallow`. This applies to:
- Any selector returning an object literal: `useStore(useShallow(s => ({ a: s.a, b: s.b })))`
- Any selector returning a filtered/mapped array: `useStore(useShallow(s => s.items.filter(...)))`
- Full-state selectors: `useStore(useShallow(s => s))`

Without `useShallow`, React 18's `useSyncExternalStore` sees a new reference on every render and triggers an infinite re-render loop. This is a web-specific issue and does not manifest on native, making it easy to miss.

**Write-through pattern**: Every store action that mutates state must also write the change to Firestore immediately after calling `set()`. Writes are fire-and-forget (not awaited) to keep actions synchronous from the caller's perspective. The userId is obtained via `useAuthStore.getState().user?.uid` — if null (signed out mid-session), the write is skipped.

**Hydration sequence**: auth resolves → `Promise.all([loadCharacter, loadQuestData, loadShopData])` → all three stores populated → splash screen hidden → real-time listeners mounted.
