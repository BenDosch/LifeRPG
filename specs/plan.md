# Backend Migration Plan

## Goal

Replace all local AsyncStorage persistence with a Firebase backend. All data lives in Firestore, auth is handled by Firebase Auth, notifications are delivered via Firebase Cloud Messaging (FCM) scheduled by Cloud Functions, and resource decay logic remains on the client while the server uses the stored state to schedule notifications accurately.

---

## Tech Decisions

| Concern | Choice | Reason |
|---|---|---|
| Auth | Firebase Auth (email/password + Google) | Simple, handles all platforms, no custom server needed |
| Database | Firestore | Real-time listeners pair naturally with Zustand; hierarchical document model fits the data; offline persistence built-in |
| Backend logic | Firebase Cloud Functions (v2) | Triggered by Firestore writes for notification scheduling; no always-on server needed |
| Notification scheduling | Google Cloud Tasks + FCM | Cloud Tasks allow precise future-time delivery; FCM handles all three platforms |
| Offline | Firestore offline persistence | Enabled by default; app remains functional without a network connection |
| Hosting | Firebase Hosting (optional) | For web build deployment; can be deferred |

---

## Firestore Data Model

All user data lives under `users/{userId}`. There is no shared global data.

```
users/{userId}
  ├── character           (document)
  │     name, heroClass, points, threshold, gold
  │     energy, energyLastUpdated, energyDecayEnabled, energyMinutesPerDay
  │     hydration, hydrationLastUpdated, waterUnit, dailyWaterServings
  │     colorScheme, timezone
  │     customClasses[], unlockedClasses[]
  │     energyNotification { enabled, threshold }
  │     hydrationNotification { enabled, threshold }
  │
  ├── quests/{questId}    (subcollection)
  │     all Quest fields (see quests.md)
  │     notification: QuestNotification | null
  │
  ├── log/{logId}         (subcollection)
  │     all LogEntry fields (see data.md)
  │
  ├── skills              (document)
  │     standaloneSkills[], skillGroups{}, skillIcons{}, skillColors{}
  │     groupIcons{}, groupColors{}
  │
  ├── shopItems/{itemId}  (subcollection)
  │     all ShopItem fields (see inventory.md)
  │
  ├── inventory/{itemId}  (subcollection)
  │     all InventoryItem fields (see inventory.md)
  │
  └── fcmTokens/{tokenId} (subcollection)
        token, platform, createdAt, lastSeenAt
```

Skill XP and class XP continue to be derived from the log subcollection at read time — the derivation logic does not change, only the data source.

---

## Phase 1 — Firebase Project Setup

**Goal**: Firebase project configured, SDKs installed, app can initialize Firebase on all three platforms.

### Tasks

1. Create a Firebase project in the Firebase console.
2. Enable Firestore (production mode with security rules requiring auth).
3. Enable Firebase Auth; turn on Email/Password and Google providers.
4. Enable Firebase Cloud Messaging.
5. Install packages:
   - `@react-native-firebase/app`
   - `@react-native-firebase/auth`
   - `@react-native-firebase/firestore`
   - `@react-native-firebase/messaging`
   - `firebase` (web SDK, for web-platform code paths)
6. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to the project.
7. Configure `app.json` with the Firebase config plugin and web Firebase config object.
8. Add `firebase-messaging-sw.js` service worker to the web public directory with the Firebase web app config.
9. Initialize the Firebase app in `src/lib/firebase.ts` with platform detection (native SDK vs web SDK).
10. Write initial Firestore security rules: all documents under `users/{userId}` are readable/writable only by the authenticated user with that `userId`.

### Definition of Done

Firebase initializes without errors on web, Android emulator, and iOS simulator. Firestore rules reject unauthenticated reads.

---

## Phase 2 — Authentication

**Goal**: Players have accounts. The app gates all content behind a sign-in screen. Existing "no-account" state is replaced by auth state.

### New Screens

- **Auth screen** (`app/auth.tsx`): Landing screen shown to unauthenticated users. Contains sign-in and sign-up flows (email/password and Google). Not part of the tab navigator — rendered by the root layout when `user === null`.
- No separate "sign out" screen; sign out is a button in the Character screen settings section.

### Auth Store (`src/store/authStore.ts`)

New Zustand store (not persisted — Firebase SDK handles persistence):

```typescript
{
  user: FirebaseUser | null,
  loading: boolean,          // true while auth state is resolving on launch
}
```

Actions:
- `signInWithEmail(email, password)`
- `signUpWithEmail(email, password)`
- `signInWithGoogle()`
- `signOut()`

### Root Layout Changes

- Mount a `useEffect` that subscribes to `onAuthStateChanged`.
- While `loading` is true, hold the splash screen.
- Once resolved: if `user === null`, render only the auth screen; if `user !== null`, render the tab navigator as normal.

### Definition of Done

User can create an account, sign in, sign out, and have their session persist across app restarts. Unauthenticated users cannot reach any data screen.

---

## Phase 3 — Firestore Store Migration

**Goal**: Replace AsyncStorage persistence in all three stores with Firestore reads and writes. The Zustand stores remain the source of truth for in-memory state; Firestore is the persistence layer.

### Migration Strategy (per store)

Each store adopts a **write-through** pattern:
- All existing actions are kept as-is.
- After mutating local state, each action also writes the change to Firestore.
- On app start (after auth resolves), a one-time read from Firestore hydrates the local store, replacing the AsyncStorage `onRehydrateStorage` hook.
- A Firestore `onSnapshot` listener is optionally mounted on each document/subcollection for multi-device sync (see Phase 5).

### Character Store

- Replace `persist` middleware with a manual hydration call: `loadCharacterFromFirestore(userId)`.
- Each action (`awardXP`, `drinkWater`, `gainEnergy`, etc.) appends a `setDoc(characterRef, { ...changes }, { merge: true })` call after updating local state.
- Remove the `liferpg-profile` AsyncStorage key.

### Quest Store

- `quests` array → `users/{uid}/quests` subcollection. Each quest is its own document keyed by `quest.id`.
- `log` array → `users/{uid}/log` subcollection. Each log entry is a document.
- `skills` config → `users/{uid}/skills` document (single document for all skill config).
- On hydration: fetch all three in parallel (`getDocs` on quests + log subcollections, `getDoc` on skills document).
- Each store action writes the affected document(s) to Firestore after updating local state.
- `deleteQuest` deletes the document and all sub-quest documents recursively (batch delete).

### Shop Store

- `items` array → `users/{uid}/shopItems` subcollection.
- `inventory` array → `users/{uid}/inventory` subcollection.
- Same write-through pattern.
- Remove the `liferpg-shop` AsyncStorage key.

### Hydration Loading State

Currently the app waits for AsyncStorage hydration before rendering. Replace this with a Firestore hydration gate:
- Root layout waits for `authStore.loading === false` (auth resolved).
- Then waits for all store hydration calls to complete.
- Splash screen is held until both are done.
- On first sign-up (no existing documents), stores initialize with default values and write them to Firestore.

### Remove AsyncStorage

- Remove `zustand/middleware/persist` from all three stores.
- Uninstall `@react-native-async-storage/async-storage` if no other dependency requires it.
- Remove all `liferpg-*` storage keys.

### Definition of Done

All data reads from and writes to Firestore. No AsyncStorage calls remain. App loads data correctly after a fresh install (sign-in restores all data from Firestore).

---

## Phase 4 — Cloud Functions Setup

**Goal**: Firebase Cloud Functions project initialized and deployable. Functions will be added in Phase 5.

### Tasks

1. Initialize a `functions/` directory in the repo using the Firebase CLI (`firebase init functions`). Use TypeScript.
2. Configure the Firebase project to use Cloud Tasks for notification scheduling (enable the Cloud Tasks API in Google Cloud Console; create a task queue named `liferpg-notifications`).
3. Set up a service account key or use the default Application Default Credentials for Cloud Tasks access from Cloud Functions.
4. Write a shared utility in `functions/src/fcm.ts` that sends an FCM message to an array of tokens given a title, body, and optional data payload.
5. Write a shared utility in `functions/src/tasks.ts` that enqueues and deletes Cloud Tasks.
6. Deploy an empty health-check function to verify the setup.

### Definition of Done

Functions deploy successfully. Cloud Tasks queue is created. The FCM utility can send a test message to a known token.

---

## Phase 5 — Notifications

**Goal**: Resource threshold alerts and quest due date notifications are delivered via FCM, scheduled by Cloud Functions.

### FCM Token Registration (Client)

- On app launch (after auth), call `getToken()` from `@react-native-firebase/messaging` (native) or `getToken(messaging, { vapidKey })` (web).
- Upsert the token into `users/{uid}/fcmTokens/{tokenHash}` with `lastSeenAt = now`.
- Listen for token refresh via `onTokenRefresh` and upsert the new token.

### Resource Threshold Functions

Write a Firestore `onDocumentWritten` Cloud Function on `users/{userId}/character`:

1. On each write, compare previous and new values of:
   - `energy`, `energyLastUpdated`, `energyDecayEnabled`, `energyMinutesPerDay`, `energyNotification`
   - `hydration`, `hydrationLastUpdated`, `hydrationNotification`
2. For each resource where the relevant fields changed:
   - Delete any existing Cloud Task for `liferpg-energy-{userId}` or `liferpg-hydration-{userId}`.
   - If `enabled` and `currentValue > threshold`:
     - Calculate `fireAt` using decay math (see notifications.md).
     - Enqueue a Cloud Task at `fireAt` that calls a Cloud Function endpoint which sends the FCM alert to all user tokens.

### Quest Notification Function

Write a Firestore `onDocumentWritten` Cloud Function on `users/{userId}/quests/{questId}`:

1. On each write:
   - Delete any existing Cloud Task for `liferpg-quest-{questId}`.
   - If the quest is not completed, has a `dueDate`, and has a non-null `notification`:
     - Calculate `fireAt` (see notifications.md). Use `character.timezone` fetched from Firestore.
     - If `fireAt` is in the future, enqueue a Cloud Task that sends the FCM quest reminder to all user tokens.

### Stale Token Cleanup Function

Write a scheduled Cloud Function (runs daily) that deletes `fcmTokens` documents where `lastSeenAt < 60 days ago`.

### Settings UI

Add a "Notifications" section to the Character screen:
- Energy alert toggle + threshold number input.
- Hydration alert toggle + threshold number input.
- Permission prompt / denied warning banner.
- Timezone auto-detected from device and written to the character document on sign-in.

### Definition of Done

On native and web: a resource threshold notification arrives when energy/hydration decays to the set level. A quest due date notification arrives at the configured time. Both work with the app closed.

---

## Phase 6 — Multi-Device Sync (Optional / Post-MVP)

**Goal**: Changes made on one device appear on others without a full app restart.

### Approach

Mount Firestore `onSnapshot` real-time listeners in each store after hydration:
- `onSnapshot(characterRef)` → merge incoming character changes into the store.
- `onSnapshot(questsCollection)` → diff incoming documents against local quests array; add/update/remove.
- `onSnapshot(logCollection)` → append new log entries.
- `onSnapshot(shopItemsCollection)` and `onSnapshot(inventoryCollection)` → same diff approach.

### Conflict Strategy

The client that was last to write wins (Firestore last-write-wins per field with `merge: true`). There is no explicit conflict resolution — the app is single-user, so simultaneous writes from two devices are rare and acceptable to resolve by recency.

### Definition of Done

Completing a quest on a phone is visible on the web tab within a few seconds without a refresh.

---

## Migration Checklist Summary

| Phase | Deliverable | Blocks |
|---|---|---|
| 1 — Firebase Setup | SDK installed, Firebase initializes on all platforms | Everything else |
| 2 — Auth | Sign-in/sign-up screens, auth store, route gating | Phase 3 |
| 3 — Firestore Stores | All data in Firestore, AsyncStorage removed | Phase 5 |
| 4 — Cloud Functions Setup | Functions project, Cloud Tasks queue, FCM utility | Phase 5 |
| 5 — Notifications | Resource + quest notifications via FCM | — |
| 6 — Multi-Device Sync | Real-time listeners | Optional |

---

## Files to Create / Modify

### New Files

| File | Purpose |
|---|---|
| `src/lib/firebase.ts` | Firebase app initialization (platform-aware) |
| `src/lib/firestore.ts` | Typed Firestore document references |
| `src/store/authStore.ts` | Auth state and actions |
| `app/auth.tsx` | Sign-in / sign-up screen |
| `public/firebase-messaging-sw.js` | Web FCM service worker |
| `functions/src/index.ts` | Cloud Functions entry point |
| `functions/src/fcm.ts` | FCM send utility |
| `functions/src/tasks.ts` | Cloud Tasks enqueue/delete utility |
| `functions/src/notifications/resourceThreshold.ts` | Character `onWrite` function |
| `functions/src/notifications/questDue.ts` | Quest `onWrite` function |
| `functions/src/notifications/tokenCleanup.ts` | Scheduled stale token cleanup |
| `firebase.json` | Firebase project config |
| `firestore.rules` | Firestore security rules |

### Modified Files

| File | Change |
|---|---|
| `app/_layout.tsx` | Add auth gate, replace AsyncStorage hydration wait with Firestore hydration wait |
| `src/store/characterStore.ts` | Remove `persist`, add Firestore write-through + hydration load |
| `src/store/questStore.ts` | Remove `persist`, add Firestore write-through + hydration load |
| `src/store/shopStore.ts` | Remove `persist`, add Firestore write-through + hydration load |
| `app/(tabs)/character.tsx` | Add notifications settings section, sign-out button |
| `app/modals/quest-form.tsx` | Add notification picker UI |
| `src/types/index.ts` | Add `QuestNotification` type, update `Quest` type |
| `app.json` | Add Firebase config plugin, web Firebase config |
| `package.json` | Add Firebase dependencies |

---

## Spec Updates Required

Each existing spec file documents the current local-only architecture. The sections below describe exactly what needs to change in each file once the migration is complete.

---

### `specs/overview.md`

**Section: "Tech Stack" table**
Add three rows: Firebase Auth, Firestore, and Firebase Cloud Functions + Cloud Tasks. Update the existing "State" row to clarify that Zustand is now a write-through cache over Firestore rather than the authoritative store.

**Section: "Core Game Loop"**
No structural changes to the loop itself. Add a note after step 5 that all state changes are persisted to Firestore and the app requires a Firebase account.

**Section: "Key Concepts" table**
Already updated to include Notifications and Backend Migration Plan rows. No further changes needed.

**Section: "Directory Structure"**
Add the new top-level entries: `functions/`, `firebase.json`, `firestore.rules`, `public/firebase-messaging-sw.js`. Within `src/`, add `src/lib/` (firebase.ts, firestore.ts) and `src/store/authStore.ts`. Add `app/auth.tsx`.

**Section: "Persistence"**
Already updated to describe the Firestore model. Verify it matches the final Firestore document structure exactly after Phase 3 is complete.

**Section: "Platform Notes"**
Add a note that FCM on web requires a registered service worker (`firebase-messaging-sw.js`) and a VAPID key. Remove the note about `"single"` output mode if it becomes irrelevant after switching to Firebase Hosting.

---

### `specs/data.md`

This file needs the most significant rewrites of any spec.

**Section: "Persistence Overview" table**
Replace entirely. The new table should list the Firestore document/subcollection path for each data domain, whether it is a document or subcollection, and note that the UI store remains unpersisted. Remove all references to AsyncStorage keys (`liferpg-projects`, `liferpg-profile`, `liferpg-shop`).

**Section: "Quest Store"**
- Under "State": add a note that quests are stored as individual Firestore documents in the `quests` subcollection, not a flat in-memory array. The local Zustand state is a hydrated copy.
- Under "State": same note for the `log` subcollection and `skills` document.
- Add a new "Firestore Sync" subsection explaining: initial hydration via `getDocs`, write-through on every action, and (if Phase 6 is implemented) `onSnapshot` for live updates.
- Remove any references to `persist` middleware or AsyncStorage.

**Section: "Character Store"**
- Under "State": document the three new fields: `energyNotification`, `hydrationNotification`, and `timezone`. Add `notificationPermission` as a per-device field stored in `fcmTokens`, not on the character document.
- Add a new "Firestore Sync" subsection: single document at `users/{uid}/character`; write-through via `setDoc(..., { merge: true })` after each action.
- Remove references to `persist` and `liferpg-profile`.

**Section: "Shop Store"**
- Under "State": note that `items` and `inventory` are each subcollections, not arrays persisted as a blob.
- Add a "Firestore Sync" subsection identical in structure to the one added to Quest Store and Character Store.
- Remove references to `persist` and `liferpg-shop`.

**Section: "UI Store"**
No changes needed to the state description. Add a brief note clarifying that it is still intentionally not persisted, and this remains true in the Firebase architecture.

**Section: "Key Types"**
- Add the `QuestNotification` type (union of `time_of_day` and `before_due` variants with their fields).
- Add the `AuthUser` type (wraps the Firebase user: `uid`, `email`, `displayName`).
- Add the `FcmToken` type (`token`, `platform`, `createdAt`, `lastSeenAt`).
- Update the `Quest` type entry to document the new `notification: QuestNotification | null` field.

**Add new section: "Authentication"**
Document the `authStore`: its state shape (`user: AuthUser | null`, `loading: boolean`), its actions (`signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`), and that it is not persisted in Zustand — the Firebase SDK handles auth session persistence natively.

**Add new section: "Zustand + Firestore Pattern"**
Replace the existing "Zustand + React 18 Web Requirement" section's companion note. Keep the `useShallow` rule (still required), but add the write-through pattern: every action that mutates state must also call the corresponding Firestore write. Describe the hydration sequence: auth resolves → parallel `getDocs`/`getDoc` calls → `setState` in each store → splash screen hidden.

---

### `specs/character.md`

**Section: "Player Profile" — Fields table**
No changes to existing fields. The table documents the in-memory shape, which is unchanged.

**Section: "Character Store — Persisted State"**
Rename this subsection to "Character Store — Firestore Document Shape". Replace the AsyncStorage key reference (`liferpg-profile`) with the Firestore path (`users/{uid}/character`). Add the three new fields to the field list: `energyNotification`, `hydrationNotification`, `timezone`.

**Section: "Key Actions" table**
Add rows for the new notification-related setters:
- `setEnergyNotification({ enabled, threshold })` — updates energy alert config; triggers Cloud Function reschedule via Firestore write
- `setHydrationNotification({ enabled, threshold })` — same for hydration
- `setTimezone(tz)` — stores the IANA timezone string

**Add new section: "Notifications Settings"**
Document the "Notifications" section of the Character screen: the energy and hydration alert toggles and threshold inputs, the permission warning banner, and the fact that timezone is auto-detected on sign-in and written to the character document. Cross-reference `notifications.md` for scheduling behavior.

**Add new section: "Account"**
Document the sign-out button in the Character screen and what it does: clears auth state via `authStore.signOut()`, clears local Zustand stores, and returns the user to the auth screen.

---

### `specs/quests.md`

**Section: "Quest Fields" table**
Add one row: `notification | QuestNotification \| null | Scheduled reminder for this quest's due date`.

**Section: "Due Dates"**
Add a paragraph after the existing content describing the notification field's relationship to due dates: `notification` of type `before_due` requires both `dueDate` and `dueTime` to be set; `notification` of type `time_of_day` requires only `dueDate`. If either required field is removed, the notification config must be cleared.

**Add new section: "Quest Notifications"**
Describe the two `QuestNotification` variants in full (identical to what is in `notifications.md` but from the quest data perspective rather than the infrastructure perspective). Note that scheduling is handled server-side and the client only stores the config. Cross-reference `notifications.md` for the scheduling lifecycle.

**Section: "Quest Store Actions" table**
No changes needed — notification scheduling is triggered automatically by the Cloud Function when the Firestore document is written, not by a dedicated store action.

---

### `specs/resources.md`

**Section: "Energy" — intro / Decay section**
No changes to the decay mechanics. Add a paragraph at the end of the Energy section noting that when `energyNotification.enabled` is true, the server will deliver a push notification when energy reaches `energyNotification.threshold`. Cross-reference `notifications.md` for scheduling details.

**Section: "Hydration" — intro / Decay section**
Same addition as Energy: a paragraph noting the `hydrationNotification` setting and cross-referencing `notifications.md`.

**Section: "Decay Timing"**
The two existing timing mechanisms (app startup catch-up and 60-second tick) remain unchanged on the client. Add a note that the server independently tracks the stored `energy`/`hydration` values and timestamps in Firestore to schedule threshold notifications; the client decay hooks do not need to interact with notification scheduling.

---

### `specs/inventory.md`

**Section: "Data Persistence"**
Replace the AsyncStorage description entirely. New content: the shop store persists to two Firestore subcollections under `users/{uid}` — `shopItems` (the catalog) and `inventory` (the player's owned items). Each item is a separate document keyed by its `id`. Remove the reference to the `liferpg-shop` AsyncStorage key.

No other sections in this file require changes.

---

### `specs/progression.md`

No structural changes are required. Skill XP and class XP derivation from the log remains identical — only the log's storage location changes (Firestore subcollection instead of in-memory array persisted to AsyncStorage).

**Section: "Class System — Overview" (minor)**
The `unlockedClasses` array is stored on the character Firestore document rather than in AsyncStorage. Add a one-sentence note to the "Unlocking Classes" subsection clarifying this, referencing `data.md` for the document shape.

---

### `specs/navigation.md`

**Section: "Root Layout"**
Add to the responsibility list: subscribing to Firebase auth state via `onAuthStateChanged`; rendering the auth screen when `user === null`; registering the FCM token after auth resolves.

**Section: "Root Stack Routes" table**
Add a row: `auth | Screen | Sign-in / sign-up screen; rendered only when unauthenticated`.

**Add new section: "Auth Screen (`app/auth.tsx`)"**
Document the auth screen: it is shown when the user is not signed in, is not part of the tab navigator, and contains email/password sign-in, email/password sign-up, and Google sign-in controls. On successful authentication, the root layout transitions to the tab navigator automatically via the auth state listener.

**Section: "Character Screen"**
Add two items to the screen's content list: a "Notifications" section (energy/hydration alert settings) and a "Sign Out" button at the bottom of the screen.

**Section: "Quest Form Modal"**
Add the "Reminder" field to the list of form fields covered by `QuestForm`: appears below due date/time when `dueDate` is set; offers "None", "At a specific time", and "Before due time" options.

---

### `specs/notifications.md`

This file was fully rewritten as part of this planning phase and accurately reflects the FCM + Cloud Functions architecture. No further updates are needed until implementation reveals discrepancies.
