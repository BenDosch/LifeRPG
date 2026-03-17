# Progression

LifeRPG has three parallel progression systems: player levels, skill levels, and class levels. All three advance independently from XP earned through quest completion. Level-ups in any system are detected immediately on quest completion and displayed via the Level Up modal.

---

## Player XP & Levels

### XP Accumulation

`points` is a lifetime cumulative XP total stored on the character profile. It never decreases.

### Level Thresholds

Each level requires progressively more XP. The threshold for reaching level N is the cumulative sum of all XP requirements up to that level:

```
XP to reach level 1:   100
XP to reach level 2:   100 + 200 = 300
XP to reach level 3:   100 + 200 + 300 = 600
XP to reach level N:   sum of (i × 100) for i = 1 to N
```

The `threshold` field stored on the character is the XP required to reach the *next* level (not the current one). It starts at 100 and increases by 100 for each level gained.

**Current level** is derived as: `Math.floor(threshold / 100) - 1`

**XP bar display**: The progress within the current level is `points - (threshold - 100)` out of `100` XP slots. Each level always spans exactly 100 XP of visible progress regardless of the absolute level number.

Wait — more precisely: the XP bar shows progress toward the next threshold. The "distance" to the next level is always the current threshold value (e.g., if threshold=300, you need 300 total XP to level up, so progress = points - 200 out of 100). Actually the level thresholds aren't linear per-level — see `src/utils/xp.ts` for the canonical implementation.

### Level-Up Detection

After `awardXP()` runs, if `points >= threshold`, the player levels up: `threshold` is incremented by 100 × (new level + 1), and the level-up event is recorded. Multiple levels can be gained in a single quest completion if XP is large enough; the detection loop runs until `points < threshold`.

---

## Skills System

### What Skills Are

Skills are named capabilities (strings) that accumulate XP from quests tagged with them. They have their own independent level progression, separate from player XP.

### Default Skills

20 skills are seeded on first launch, organized into three conceptual groups:

**Mental**: Critical Thinking, Discipline, Focus, Logic, Mathematics, Memory, Philosophy, Reading, Research, Study, Writing

**Physical**: Agility, Balance, Core Strength, Endurance, Flexibility, Meditation, Nutrition, Strength Training

**Social**: Finance, Negotiation, Networking, Persuasion

### Skill XP Calculation

Skill XP is not stored as a running total. Instead, it is derived on-demand by scanning the quest completion log and summing `xpAwarded` for every log entry that included the skill name in its `skills` snapshot.

```
skillXP(name) = sum of entry.xpAwarded for all log entries where entry.skills includes name
skillLevel(name) = Math.floor(skillXP(name) / 100)
```

Each skill level requires exactly 100 XP. There is no cap on skill levels.

### Skill Organization

Skills can be organized in two ways, controlled independently:

- **Standalone skills**: listed individually on the Skills screen.
- **Skill groups**: named collections (e.g., "Mental", "Physical", "Social") that visually group skills together.

A skill can exist in a group, as a standalone, or both. The organization is purely cosmetic for the Skills screen — it does not affect XP accumulation.

### Skill Customization

Each skill can have a custom Ionicons icon name and a hex color. Groups also support icons and colors. These are stored in the quest store as `skillIcons`, `skillColors`, `groupIcons`, `groupColors` maps.

### Skill Store Actions

| Action | Description |
|---|---|
| `addStandaloneSkill(name)` | Add a skill to the standalone list |
| `deleteSkill(name)` | Remove a skill from all lists and groups |
| `renameSkill(oldName, newName)` | Rename a skill everywhere |
| `addSkillGroup(name)` | Create a named group |
| `deleteSkillGroup(name)` | Remove a group (skills within are not deleted) |
| `renameSkillGroup(old, new)` | Rename a group |
| `addSkillToGroup(group, skill)` | Add a skill to a group |
| `removeSkillFromGroup(group, skill)` | Remove a skill from a group |
| `setSkillIcon / setSkillColor` | Set visual config for a skill |
| `setGroupIcon / setGroupColor` | Set visual config for a group |

---

## Class System

### Overview

Classes are hero archetypes that have their own XP pool and level. Each class has unlock requirements. The player equips one class at a time; all quest completions while that class is equipped contribute XP to its pool.

### Class XP & Levels

Class XP is derived from the quest log the same way skill XP is — by scanning log entries where `entry.equippedClass === className` and summing `xpAwarded`.

```
classXP(name) = sum of entry.xpAwarded for entries where equippedClass === name
classLevel(name) = Math.floor(classXP(name) / 100)
```

Each class level requires exactly 100 XP. There is no cap.

### Equipped Class Override

A quest can set `classQuest` to a specific class name. When completed, XP goes to that class's pool regardless of which class the player currently has equipped. The log entry records the `classQuest` value as `equippedClass`.

### Predefined Classes

There are 16 predefined classes organized into 5 paths. All definitions live in `src/data/heroClasses.ts`.

**Adventurer** (starting class)
- No requirements. Available to all players from the start.

**Scholar Path**
| Class | Tier | Key Requirements |
|---|---|---|
| Scholar Neophyte | 1 | Reading lvl 1, Writing lvl 1, Discipline lvl 1 |
| Scholar Apprentice | 2 | Scholar Neophyte lvl 10, Reading lvl 5, Research lvl 3, Critical Thinking lvl 3 |
| Scholar Journeyman | 3 | Scholar Apprentice lvl 10, Reading lvl 10, Writing lvl 8, Research lvl 8, Critical Thinking lvl 8, Discipline lvl 5 |
| Scholar Master | 4 | Scholar Journeyman lvl 10, Reading lvl 20, Writing lvl 15, Research lvl 15, Critical Thinking lvl 15, Discipline lvl 10 |

**Merchant Path**
| Class | Tier | Key Requirements |
|---|---|---|
| Merchant Neophyte | 1 | Negotiation lvl 1, Finance lvl 1, Discipline lvl 1 |
| Merchant Apprentice | 2 | Merchant Neophyte lvl 10, Negotiation lvl 5, Finance lvl 3, Persuasion lvl 3 |
| Merchant Journeyman | 3 | Merchant Apprentice lvl 10, Negotiation lvl 10, Finance lvl 8, Persuasion lvl 8, Networking lvl 8, Discipline lvl 5 |
| Merchant Master | 4 | Merchant Journeyman lvl 10, Negotiation lvl 20, Finance lvl 15, Persuasion lvl 15, Networking lvl 15, Discipline lvl 10 |

**Warrior Path**
| Class | Tier | Key Requirements |
|---|---|---|
| Warrior Neophyte | 1 | Strength Training lvl 1, Endurance lvl 1, Discipline lvl 1 |
| Warrior Apprentice | 2 | Warrior Neophyte lvl 10, Strength Training lvl 5, Endurance lvl 3, Agility lvl 3 |
| Warrior Journeyman | 3 | Warrior Apprentice lvl 10, Strength Training lvl 10, Endurance lvl 8, Agility lvl 8, Nutrition lvl 8, Discipline lvl 5 |
| Warrior Master | 4 | Warrior Journeyman lvl 10, Strength Training lvl 20, Endurance lvl 15, Agility lvl 15, Nutrition lvl 15, Discipline lvl 10 |

**Yogi Path**
| Class | Tier | Key Requirements |
|---|---|---|
| Yogi Neophyte | 1 | Meditation lvl 1, Flexibility lvl 1, Discipline lvl 1 |
| Yogi Apprentice | 2 | Yogi Neophyte lvl 10, Meditation lvl 5, Flexibility lvl 3, Balance lvl 3 |
| Yogi Journeyman | 3 | Yogi Apprentice lvl 10, Meditation lvl 10, Flexibility lvl 8, Balance lvl 8, Core Strength lvl 8, Discipline lvl 5 |
| Yogi Master | 4 | Yogi Journeyman lvl 10, Meditation lvl 20, Flexibility lvl 15, Balance lvl 15, Core Strength lvl 15, Discipline lvl 10 |

### Class Requirements

Each requirement specifies one of:

| Type | Description |
|---|---|
| Skill level | A named skill must be at or above a minimum level |
| Player level | The player must be at or above a minimum level |
| Class level | Another class must be at or above a minimum level |
| Quests completed | Total quest completions must meet a threshold, with optional difficulty and/or urgency tier filters |

All requirements must be satisfied simultaneously to unlock a class.

### Unlocking Classes

When the player meets all requirements for a class, it is automatically detected on quest completion and added to `unlockedClasses`. This triggers a level-up event of type `class_unlock`, which displays in the Level Up modal with an "Unlock!" quick-action button that equips the class.

A class can be locked again (removed from `unlockedClasses`) via the character store — this is an admin action not exposed in normal gameplay UI.

### Custom Classes

Players can create unlimited custom classes via the Class Form modal. Custom classes support the full requirement system and the same visual customization (name, description, icon, color) as predefined classes. They are stored in `characterStore.customClasses`.

Custom classes can be edited and deleted. Predefined classes cannot be modified or deleted.

---

## Level-Up Events

Any of the following can trigger a level-up event:

| Type | Description |
|---|---|
| `player` | Player level increased |
| `skill` | A skill leveled up |
| `class` | A class leveled up |
| `class_unlock` | A class was newly unlocked |

All events from a single quest completion are batched and queued together. They are displayed one-by-one in the Level Up modal after the Quest Complete modal is dismissed.

Each level-up entry carries: `type`, `name` (skill or class name, if applicable), `previousLevel`, `newLevel`, `icon`, `color`.
