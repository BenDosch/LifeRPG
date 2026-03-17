# Navigation

LifeRPG uses Expo Router (file-based routing) with a stack navigator at the root and a tab navigator for the main app experience. Modals are pushed onto the root stack. Global event-driven modals (level up, quest complete) are mounted at the root and shown programmatically via the UI store.

---

## Root Layout (`app/_layout.tsx`)

The root layout wraps the entire app. It is responsible for:

- Loading custom fonts (via `expo-font`)
- Hiding the splash screen once fonts are ready
- Wrapping children in `SafeAreaProvider` and `GestureHandlerRootView`
- Mounting decay watcher hooks: `useEnergyDecay` and `useHydrationDecay` (run continuously while app is open)
- Rendering global event-driven modals: `QuestCompleteModal`, `LevelUpModal`, `ClassPickerModal`
- Defining the root Stack navigator

**Important**: `import 'react-native-reanimated'` is placed at the top of this file on native only. The Reanimated Babel plugin must be last in `babel.config.js`.

### Root Stack Routes

| Route | Type | Description |
|---|---|---|
| `(tabs)` | Screen | The main tab navigator (nested) |
| `modals/quest-form` | Modal | Quest create/edit form |
| `modals/shop-item-form` | Modal | Shop item create/edit form |
| `skills` | Screen (push) | Skills management full-screen page |

---

## Tab Navigator (`app/(tabs)/_layout.tsx`)

The tab bar sits at the bottom of the screen. Tabs use Ionicons icons. The HudBar is rendered as the tab navigator's custom header, handling the top safe area.

Individual tab screens use a plain `View` (not `SafeAreaView`) at the top — the HudBar in the tabs layout handles the top safe area.

### Tabs

| Tab | Route | Icon | Visible |
|---|---|---|---|
| Quests | `(tabs)/index` | folder-outline | Yes |
| Inventory | `(tabs)/store` | bag-outline | Yes |
| Character | `(tabs)/character` | person-outline | Yes |
| Log | `(tabs)/log` | (none) | No (`href: null`) |

The Log tab is hidden from the tab bar (`href: null`) but is a valid route. It is accessed programmatically or via a button within the Quests screen.

---

## HUD Bar (`src/components/hud/HudBar.tsx`)

The HUD bar is a persistent header rendered by the tab layout. It displays:

- Player name and hero class (left side)
- Player level with XP bar below name (left/center)
- Gold balance with coin icon (right)
- Energy bar (right or center)
- Hydration bar with drink water button (right or center)

The HUD bar is always visible while on any tab screen. It handles the top safe area inset so tab screen content does not need to.

---

## Quests Screen (`app/(tabs)/index.tsx`)

The Quests screen uses a **dual-pane layout**:

- **Left pane (main list)**: Scrollable list of root-level quests (no `parentId`). Shows quest name, difficulty/urgency badges, skills, and sub-quest count. Tap a quest to select it.
- **Right pane (side panel)**: Shows the selected quest's details and its sub-quests. Provides complete/skip/edit/delete actions for the quest and sub-quests.

The FilterBar is rendered above the main list with search, urgency, difficulty, due date, skill, and show-completed controls.

An "Add Quest" button opens the Quest Form modal.

On mobile (narrow viewport), the layout collapses — the side panel is shown as a drawer or replaces the main list on selection. (Behavior may be viewport-dependent.)

---

## Inventory / Shop Screen (`app/(tabs)/store.tsx`)

Two tabs within the screen:

- **Shop tab**: Displays all shop items with buy buttons.
- **Inventory tab**: Displays owned items with use buttons.

An add/edit button opens the Shop Item Form modal.

---

## Character Screen (`app/(tabs)/character.tsx`)

Single-scroll screen containing:
- Player name (editable)
- Hero class (taps to open Class Picker modal)
- XP/level display
- Energy bar + settings
- Hydration bar + settings
- Button to navigate to Skills page
- Color scheme toggle

---

## Log Screen (`app/(tabs)/log.tsx`)

Chronological list of all quest completion log entries. Each entry shows:
- Quest name and icon
- XP awarded
- Skills tagged
- Class equipped at time of completion
- Completion timestamp

---

## Skills Screen (`app/skills.tsx`)

A full-screen page (pushed as a new stack screen, not a modal). Shows:
- All skill groups with their member skills
- All standalone skills
- Each skill's level, icon, and color
- Controls to add/rename/delete skills and groups
- Icon picker and color picker per skill/group

Navigated to from the Character screen. Has a back button to return.

---

## Quest Form Modal (`app/modals/quest-form.tsx`)

**Route params**:
- `questId`: Edit an existing quest (loads current values)
- `parentId`: Create a new sub-quest with the given parent

If neither param is present, creates a new root quest.

The modal renders the `QuestForm` component, which covers:
- Name, details, difficulty, urgency
- Skills multi-select
- Repeatable toggle + repeat schedule picker
- Due date + time inputs
- Due date auto-advance schedule picker
- Gold/energy/hydration reward and cost fields
- Auto-complete on sub-quests toggle
- Class quest assignment picker
- Icon selector (inline, next to name field)
- Parent quest display (read-only if sub-quest)

---

## Shop Item Form Modal (`app/modals/shop-item-form.tsx`)

**Route params**:
- `itemId`: Edit an existing shop item

If no param, creates a new item.

The modal renders the `ShopItemForm` component, which covers all ShopItem fields plus a delete button for existing items.

---

## Event-Driven Modals

These modals are rendered in the root layout and shown/hidden via the UI store. They are not route-based.

### Quest Complete Modal (`src/components/shared/QuestCompleteModal.tsx`)

Triggered when `uiStore.questCompleteEvent` is non-null. Shows:
- Quest name and icon
- Animated count-up of XP awarded
- Animated display of gold reward
- Energy and hydration changes
- Skills that received XP
- Dismiss button

On dismiss:
- Clears `questCompleteEvent` from UI store
- If `pendingLevelUpEntries` is non-empty, triggers the Level Up modal

### Level Up Modal (`src/components/shared/LevelUpModal.tsx`)

Triggered when `uiStore.levelUpEvent` is non-null. Shows level-up entries one at a time:
- Animated level count-up
- Icon and color for the leveled-up entity
- Confetti animation
- "Unlock!" quick-action button for class unlock events (equips the class immediately)

On all entries exhausted, clears `levelUpEvent` from UI store.

### Class Picker Modal

Triggered when `uiStore.classPickerOpen` is true. Mounted at root level so it can be opened from anywhere (Character screen, Level Up modal quick-action, etc.).

---

## UI Store (Navigation-Relevant State)

The UI store holds transient state used to coordinate navigation and modal triggers. It is not persisted.

| State Field | Description |
|---|---|
| `questCompleteEvent` | Payload for the Quest Complete modal; set by quest completion flow |
| `levelUpEvent` | Array of LevelUpEntry; set after Quest Complete modal is dismissed |
| `questDueDateId` | Quest ID needing a manual due date prompt after completion |
| `classPickerOpen` | Whether the Class Picker modal is visible |
| `searchQuery` | Current quest search string |
| `urgencyFilter` | Active urgency tier filter |
| `difficultyFilter` | Active difficulty tier filter |
| `dueDateFilter` | Active due date filter |
| `skillFilter` | Active skill name filter |
| `showCompleted` | Whether completed quests are shown in the list |
| `sortOrder` | Current sort order for quest list |
