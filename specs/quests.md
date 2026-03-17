# Quests

Quests are the primary unit of work in LifeRPG. Each quest represents a real-world task. Completing a quest awards XP, gold, and optional resource changes. Quests can be organized hierarchically, scheduled to repeat, and tagged with skills.

---

## Quest Fields

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique identifier |
| `name` | string | Display name |
| `details` | string (optional) | Long-form description |
| `difficulty` | 1–100 | Determines XP weight; maps to a Tier |
| `urgency` | 1–100 | Multiplier on XP; maps to a Tier |
| `skills` | string[] | Skills this quest contributes XP toward |
| `parentId` | string \| null | If set, this is a sub-quest of the parent |
| `repeatable` | boolean | Whether the quest can be completed multiple times |
| `repeatSchedule` | RepeatSchedule \| null | How often it repeats (if repeatable) |
| `lastCompletedAt` | ISO string \| null | Timestamp of last completion |
| `dueDate` | YYYY-MM-DD string \| null | Optional due date |
| `dueTime` | HH:MM string \| null | Optional due time (paired with dueDate) |
| `dueDateSchedule` | RepeatSchedule \| null | Auto-advance schedule for due date on completion |
| `goldReward` | number | Gold awarded on completion |
| `energyReward` | number | Energy % gained on completion |
| `hydrationReward` | number | Hydration % gained on completion |
| `energyCost` | number | Energy % deducted on completion |
| `hydrationCost` | number | Hydration % deducted on completion |
| `autoCompleteOnSubQuests` | boolean | Auto-complete this quest when all sub-quests are done |
| `classQuest` | string \| null | If set, XP goes to this class instead of the equipped class |
| `icon` | string \| null | Ionicons icon name |
| `iconColor` | string \| null | Hex color for the icon |

---

## Difficulty & Urgency Tiers

Both `difficulty` and `urgency` are 1–100 integers that map to one of four tiers:

| Range | Tier | Difficulty Label | Urgency Label | Color |
|---|---|---|---|---|
| 1–25 | easy | Easy | Low | `#ADFF2F` (yellow-green) |
| 26–50 | medium | Medium | Medium | `#FFD700` (gold) |
| 51–75 | hard | Hard | High | `#FF6347` (tomato) |
| 76–100 | very_hard | Very Hard | Critical | `#e879f9` (fuchsia) |

Tiers are used for display badges and filter controls. The raw number is used in XP calculation.

---

## XP Formula

```
xpAwarded = Math.max(1, Math.round(difficulty × urgency / 100))
```

Maximum XP per quest is 100 (both difficulty and urgency at 100). Minimum is 1.

---

## Sub-Quests (Hierarchy)

Quests can have a `parentId`, making them sub-quests of another quest. There is no enforced depth limit.

- Sub-quests are displayed in the side panel when the parent is selected in the main quest list.
- A parent quest can have `autoCompleteOnSubQuests: true`, which causes it to automatically complete when all its sub-quests are marked done.
- Auto-completion cascades upward: if a parent auto-completes and its own parent has `autoCompleteOnSubQuests`, that grandparent will also complete, and so on.
- Deleting a parent quest deletes all sub-quests recursively.

**Sub-quest locking rule for unlimited repeatable quests**: If a repeatable sub-quest has `repeatSchedule.type === 'unlimited'`, it locks after completion until the parent quest completes. This prevents repeatedly farming a sub-quest without finishing the parent.

---

## Repeat Schedules

A `RepeatSchedule` controls when a repeatable quest becomes available again after completion.

| Type | Behavior |
|---|---|
| `unlimited` | Available immediately after completion (subject to sub-quest locking) |
| `hours` | Available again after N hours have elapsed since `lastCompletedAt` |
| `days` | Available again after N calendar days have passed |
| `weeks` | Available again after N calendar weeks have passed |
| `months` | Available again after N calendar months have passed |
| `weekdays` | Available on specific days of the week (0=Sun, 6=Sat), once per day |

Calendar-based schedules compare calendar dates (midnight to midnight), not elapsed time. A `days: 1` quest completed at 11 PM becomes available again at midnight, not 24 hours later.

For `weekdays`, the quest is available if today is one of the configured days and `lastCompletedAt` is not today.

**Availability text**: The UI shows a human-readable "Available in Xh Ym" or "Available on Friday" message for unavailable repeatable quests.

---

## Due Dates

Due dates are optional and stored as a `YYYY-MM-DD` string. An optional `dueTime` (`HH:MM`) refines it to a specific time.

**Auto-advance**: If the quest has a `dueDateSchedule`, the due date automatically advances by that schedule's interval on completion. This is the same RepeatSchedule type used for repeatability.

**Manual advance**: If the quest is repeatable but has no `dueDateSchedule`, completing it sets a `questDueDateId` in the UI store, prompting the user to pick the next due date manually.

**Skipping**: A repeatable quest can be skipped (without awarding XP/rewards) via `skipQuest()`. This advances the due date schedule identically to completion.

---

## Completion Flow

When a quest is completed:

1. XP is calculated (`difficulty × urgency / 100`, min 1).
2. XP is awarded to the player profile and to the currently equipped class (or `classQuest` override).
3. XP is awarded to each skill listed in the quest's `skills` array.
4. Gold reward is added to the player's gold balance.
5. Energy and hydration rewards are applied; energy and hydration costs are deducted.
6. A log entry is created, snapshotting: quest name, difficulty, urgency, skills, XP awarded, player level at time of completion, and equipped class.
7. Level-ups are detected: player level, each tagged skill level, each class level, and any newly unlocked classes.
8. All level-up events are batched and queued in the UI store.
9. The Quest Complete modal is triggered, showing rewards and a summary.
10. On dismissal of the Quest Complete modal, the Level Up modal fires (if applicable).
11. If a due date prompt is needed, `questDueDateId` is set in the UI store.
12. If `autoCompleteOnSubQuests` is triggered on the parent, parent completion runs recursively.

---

## Filtering & Sorting

The Quests screen supports the following filters (applied in combination):

| Filter | Options |
|---|---|
| Search | Free-text match on quest name |
| Urgency | easy / medium / hard / very_hard |
| Difficulty | easy / medium / hard / very_hard |
| Due date | Overdue / Today / Tomorrow / This week |
| Skill | Any single skill name |
| Show completed | Toggle to include/exclude completed quests |

Sort order options:
- Due date (ascending)
- Urgency (descending)
- Difficulty (descending)

Filters are held in the UI store and are not persisted across app restarts.

---

## Quest Store Actions

| Action | Description |
|---|---|
| `addQuest(input)` | Create a new quest; returns the created Quest |
| `updateQuest(id, partial)` | Modify any quest fields |
| `deleteQuest(id)` | Delete quest and all descendants |
| `completeQuest(id)` | Complete quest; returns `{xpAwarded, goldAwarded, skills, needsNextDueDate}` |
| `skipQuest(id)` | Skip a repeatable quest; advances schedule without awarding rewards |
| `uncompleteQuest(id)` | Revert a quest back to incomplete (does not reverse rewards) |
| `resetQuest(id)` | Reset quest and all sub-quests to incomplete state |
