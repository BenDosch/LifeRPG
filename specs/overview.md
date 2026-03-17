# LifeRPG — App Overview

LifeRPG is a cross-platform gamification productivity app built with React Native (Expo). It turns real-life tasks into RPG quests, rewarding the player with XP, gold, and resource gains. Completing quests advances the player's level, skill levels, and hero class, while resource management (energy and hydration) adds a layer of real-world health tracking.

The app runs on iOS, Android, and web. All data is stored in Firestore under a per-user document tree. Players must have a Firebase account; auth is handled by Firebase Auth (email/password and Google). The app requires a Firebase account and will not function without one.

---

## Tech Stack

- **Framework**: React Native via Expo SDK ~52, Expo Router ~4
- **State**: Zustand ^5 — write-through cache over Firestore; not persisted locally
- **Auth**: Firebase Auth (email/password + Google)
- **Database**: Firestore — all user data; offline persistence enabled by default
- **Backend**: Firebase Cloud Functions v2 + Google Cloud Tasks (notification scheduling)
- **Styling**: NativeWind v4 + Tailwind v3
- **Language**: TypeScript, strict mode
- **Navigation**: Expo Router (file-based, stack + tabs)
- **Animations**: React Native Reanimated v3 (mobile only); plain animated Views on web

---

## Core Game Loop

1. **Create quests** — tasks with a name, difficulty (1–100), urgency (1–100), optional skills, and optional rewards/costs.
2. **Complete quests** — awards XP and gold; applies resource rewards or costs; triggers skill XP gains.
3. **Level up** — player level, skill levels, and class levels each advance independently from accumulated XP.
4. **Unlock classes** — predefined and custom hero classes gate-keep progression behind skill/level requirements.
5. **Manage resources** — energy and hydration decay over real time; shop items restore them; quests can cost or grant them. All state changes are persisted to Firestore. The app requires a Firebase account.

---

## Key Concepts

| Concept | Summary | Detail |
|---|---|---|
| Quest | A task with difficulty, urgency, optional skills, rewards, and scheduling | [quests.md](./quests.md) |
| XP & Levels | XP earned from quests; cumulative thresholds per level | [progression.md](./progression.md) |
| Skills | Named capabilities that accumulate XP from tagged quests | [progression.md](./progression.md) |
| Classes | Hero archetypes with XP pools and unlock requirements | [progression.md](./progression.md) |
| Energy | 0–100% stat that decays over real time; quest costs & item gains | [resources.md](./resources.md) |
| Hydration | 0–120% stat that decays over 24h; water servings tracked | [resources.md](./resources.md) |
| Gold | Currency earned from quests; spent in the shop | [resources.md](./resources.md) |
| Shop & Inventory | Items purchased with gold; used to restore energy/hydration | [inventory.md](./inventory.md) |
| Character | Player profile, class picker, settings | [character.md](./character.md) |
| Navigation | Screens, modals, HUD bar | [navigation.md](./navigation.md) |
| Data & Stores | Zustand store shapes, types, persistence | [data.md](./data.md) |
| Notifications | Resource threshold alerts, quest due date reminders via FCM | [notifications.md](./notifications.md) |
| Backend Migration Plan | Firebase Auth + Firestore + Cloud Functions migration | [plan.md](./plan.md) |

---

## Directory Structure (Key Files)

```
app/
  _layout.tsx               Root stack: fonts, auth gate, hydration gate, global modals, decay watchers
  auth.tsx                  Sign-in / sign-up screen (shown when unauthenticated)
  (tabs)/
    _layout.tsx             Tab bar + HudBar header
    index.tsx               Quests screen (dual-pane)
    store.tsx               Inventory/Shop screen
    character.tsx           Character screen (includes Notifications settings + Sign Out)
    log.tsx                 Activity log (hidden tab, accessed via Quests)
  modals/
    quest-form.tsx          Quest create/edit modal route
    shop-item-form.tsx      Shop item create/edit modal route
  skills.tsx                Skills full-screen page

src/
  store/
    questStore.ts           Quests, log, skills state + Firestore sync
    characterStore.ts       Player profile, XP, gold, energy, hydration, classes + Firestore sync
    shopStore.ts            Shop items and inventory + Firestore sync
    authStore.ts            Firebase auth state (user, loading) and auth actions
    uiStore.ts              Transient UI state (filters, modal events)
  lib/
    firebase.ts             Platform-aware Firebase app initialization (native SDK vs web SDK)
    firestore.ts            Typed Firestore document and collection reference helpers
    fcmTokens.ts            FCM token registration and refresh listener
  types/index.ts            All shared TypeScript types and constants
  utils/                    Pure functions: xp, energy, hydration, repeat, dueDate, skillLevels, classLevels
  components/               UI components grouped by domain
  data/heroClasses.ts       16 predefined hero class definitions
  theme/                    ThemeContext + color palette

functions/
  src/
    index.ts                Cloud Functions entry point
    fcm.ts                  FCM multicast send utility (Firebase Admin SDK)
    tasks.ts                Cloud Tasks enqueue/delete utility
    notifications/
      resourceThreshold.ts  onWrite function: schedules energy/hydration FCM alerts
      questDue.ts           onWrite function: schedules quest due date FCM alerts
      tokenCleanup.ts       Scheduled daily function: prunes stale FCM tokens

firebase.json               Firebase project config (Firestore rules, Functions, Hosting)
firestore.rules             Firestore security rules (users can only access their own data)
public/
  firebase-messaging-sw.js  Web FCM service worker (handles background push messages)
```

---

## Persistence

All data is stored in Firestore under `users/{userId}`. Zustand stores use write-through to Firestore and are hydrated from it on launch. AsyncStorage is no longer used.

- `users/{uid}/character` — player profile, classes, energy/hydration, notification settings
- `users/{uid}/quests/*` — quests subcollection
- `users/{uid}/log/*` — quest completion log subcollection
- `users/{uid}/skills` — skill config document
- `users/{uid}/shopItems/*` — shop catalog subcollection
- `users/{uid}/inventory/*` — player inventory subcollection
- `users/{uid}/fcmTokens/*` — FCM device tokens for push notifications

The UI store is intentionally not persisted; all filter and modal state resets on app restart.

Firestore offline persistence is enabled, so the app remains functional without a network connection.

---

## Platform Notes

- Web output mode is `"single"` (not `"static"`) to avoid SSR warnings.
- Platform-specific component variants use `.web.tsx` suffixes (sliders, date/time pickers, select pickers).
- Reanimated is disabled on web; animated elements use plain React Native `View` with percentage-based widths.
- Every Zustand selector that returns an object or array must use `useShallow` to prevent infinite render loops on web (React 18 `useSyncExternalStore` behavior).
- FCM on web requires a registered service worker (`public/firebase-messaging-sw.js`) and a VAPID key configured in the Firebase project. The service worker must be served from the app root.
- Firebase SDK initialization is platform-aware: `@react-native-firebase/*` on native (auto-initialized from `google-services.json` / `GoogleService-Info.plist`); `firebase` JS SDK on web (initialized from the `firebaseWeb` config in `app.json`).
