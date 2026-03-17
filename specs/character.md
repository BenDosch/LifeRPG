# Character

The Character screen is the player's profile and settings hub. It displays identity, progression stats, and resource bars, and provides access to class management, skill management, and configuration options.

---

## Player Profile

### Fields

| Field | Description |
|---|---|
| `name` | The player's chosen character name. Displayed in the HUD bar. |
| `heroClass` | The name of the currently equipped hero class. Displayed in the HUD bar below the name. |
| `points` | Lifetime XP total. Never decreases. |
| `threshold` | XP value at which the next level is reached. Increments by 100 each level. |
| `gold` | Current gold balance. |

### Display on Character Screen

The Character screen shows:
- Player name (editable inline)
- Current hero class name and icon (tappable to open Class Picker)
- Current player level (derived from `threshold`)
- XP progress bar showing progress within the current level
- Gold balance with coin icon

---

## Resource Settings

### Energy

The character screen exposes energy settings:
- **Current energy** displayed as a percentage with a bar.
- **Decay enabled** toggle: when on, energy drains over real time at the configured rate.
- **Minutes per day** setting: controls how fast energy drains. Lower values = faster drain.
- **Full Rest button**: immediately sets energy to 100%.

See [resources.md](./resources.md) for full energy mechanics.

### Hydration

The character screen exposes hydration settings:
- **Current hydration** displayed as a percentage with a bar.
- **Daily water servings** setting: how many drinks equal 100% hydration.
- **Water unit** toggle: imperial (fl oz) or metric (ml) for display labels.

See [resources.md](./resources.md) for full hydration mechanics.

---

## Class Picker

Accessible by tapping the hero class display on the Character screen. Opens the Class Picker modal.

### Class Picker Modal

The Class Picker shows all available classes: the 16 predefined classes and any custom classes the player has created.

For each class, the modal displays:
- Name, icon, and color
- Description
- All requirements with pass/fail indicators (green check / red X)
- Current level in that class (if any XP has been earned)
- XP progress bar for the class

**Switching classes**: The player can equip any class they have unlocked. Tapping "Equip" sets `heroClass` to that class name. The class picker closes.

**Unlocked vs locked**: Classes the player has not yet met requirements for are shown but cannot be equipped. Requirements are displayed with color-coded indicators so the player can see what is missing.

**Custom class creation**: A "Create Class" button opens the Class Form modal. Existing custom classes have an edit button inline.

### Class Form Modal

Allows creating or editing a custom class:
- Name and description
- Icon picker (Ionicons)
- Color picker (hex)
- Requirements editor: add/remove/edit individual requirements (skill level, player level, class level, quests completed)

Predefined classes cannot be edited or deleted.

---

## Skills Access

The Character screen provides a button to navigate to the Skills full-screen page. This is the primary entry point to skill management.

See [navigation.md](./navigation.md) for the Skills page structure.

---

## Color Scheme

The player can toggle between dark mode and light mode from the Character screen. The setting is stored as `colorScheme` on the character profile (`'dark'` | `'light'`). It persists across app restarts.

The color scheme drives the theme context used by all components throughout the app.

---

## Character Store

### Persisted State

All character state persists to AsyncStorage under the key `liferpg-profile`. The full persisted shape covers:

- Player identity: `name`, `heroClass`
- XP: `points`, `threshold`
- Currency: `gold`
- Energy: `energy`, `energyLastUpdated`, `energyDecayEnabled`, `energyMinutesPerDay`
- Hydration: `hydration`, `hydrationLastUpdated`, `waterUnit`, `dailyWaterServings`
- Classes: `customClasses` (array), `unlockedClasses` (array of class names)
- UI: `colorScheme`

### Key Actions

| Action | Description |
|---|---|
| `setName(name)` | Update the player's name |
| `setHeroClass(name)` | Equip a class by name |
| `setColorScheme(scheme)` | Toggle dark/light mode |
| `awardXP(amount)` | Add XP and detect level-up; returns `{didLevelUp, newLevel}` |
| `addGold(amount)` | Add (positive) or subtract (negative) gold |
| `fullRest()` | Set energy to 100 |
| `gainEnergy(amount)` | Add energy percentage (clamped to 100) |
| `spendEnergy(amount)` | Deduct energy percentage (clamped to 0) |
| `applyEnergyDecay(now)` | Apply time-based decay given current timestamp |
| `setEnergyDecayEnabled(bool)` | Toggle decay on/off |
| `setEnergyMinutesPerDay(min)` | Set decay rate |
| `drinkWater()` | Add one serving of hydration |
| `gainHydration(amount)` | Add hydration percentage (clamped to 120) |
| `spendHydration(amount)` | Deduct hydration percentage (clamped to 0) |
| `applyHydrationDecay(now)` | Apply time-based hydration decay |
| `setWaterUnit(unit)` | Switch between 'imperial' and 'metric' |
| `setDailyWaterServings(n)` | Set how many drinks equal 100% hydration |
| `unlockClass(name)` | Add class to unlocked list |
| `addCustomClass(input)` | Create a new custom class |
| `updateCustomClass(id, partial)` | Edit a custom class |
| `deleteCustomClass(id)` | Remove a custom class |
