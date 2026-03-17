# Notifications

LifeRPG delivers local and push notifications to remind the player about low resources and upcoming quest due dates. All notification scheduling is handled server-side via Firebase Cloud Functions + Firebase Cloud Messaging (FCM), which provides consistent behavior across iOS, Android, and web.

---

## Why FCM (Firebase Cloud Messaging)

FCM is the delivery mechanism for all notifications. The server schedules and sends all messages; the client never calls a local scheduling API. This means:

- **Web support**: FCM delivers to web browsers via a service worker, no limitations on scheduled notifications.
- **Background delivery**: Notifications arrive even when the app is closed or the browser tab is not open.
- **Single implementation**: One code path for all three platforms instead of platform-specific scheduling logic.
- **Accurate timing**: The server knows the current resource state from Firestore and schedules exactly.

**Library**: `@react-native-firebase/messaging` (native) + `firebase/messaging` (web). Both use the same FCM project.

---

## FCM Token Management

Each device/browser session registers a unique FCM token. Tokens are stored in Firestore under the user's profile and used by the server to address notifications.

```
users/{userId}/fcmTokens/{tokenId}
  token: string
  platform: 'ios' | 'android' | 'web'
  createdAt: Timestamp
  lastSeenAt: Timestamp
```

- On app launch, the client requests an FCM token and upserts it in Firestore.
- Stale tokens (not seen in >60 days) are pruned automatically by a scheduled Cloud Function.
- A user can be signed in on multiple devices simultaneously; all tokens receive notifications.

### Permission

- **iOS**: FCM requires explicit permission via `requestPermission()`. The app prompts on first launch after sign-in.
- **Android 13+**: Same runtime permission required.
- **Web**: The browser permission prompt is shown the first time the player enables any notification setting. Uses the Web Push protocol under the hood; requires a VAPID key configured in the Firebase project and a registered service worker (`firebase-messaging-sw.js`) at the root.

The user's permission state is stored in Firestore so settings are consistent across devices.

---

## Resource Threshold Notifications

When energy or hydration decays to or below a configured threshold, the player receives a push notification.

### Settings (per resource)

| Field | Type | Description |
|---|---|---|
| `enabled` | boolean | Whether this threshold alert is active |
| `threshold` | number | Value at or below which the notification fires (0–100 for energy; 0–120 for hydration) |

Settings live in the character document in Firestore alongside the existing energy/hydration configuration.

### Scheduling Logic (Server-Side)

A Firestore `onWrite` Cloud Function triggers whenever the character document changes (energy value, decay rate, threshold setting, or enabled toggle). The function:

1. Reads the current resource value, decay rate, and threshold from the updated document.
2. Cancels any existing scheduled notification for that resource (deletes the pending Cloud Tasks entry).
3. If `enabled` is true and `currentValue > threshold`, calculates the fire time:

```
// Energy
minutesToThreshold = (currentEnergy - threshold) / (100 / energyMinutesPerDay)
fireAt = now + minutesToThreshold × 60 000 ms

// Hydration
minutesToThreshold = (currentHydration - threshold) / (100 / (24 × 60))
fireAt = now + minutesToThreshold × 60 000 ms
```

4. Enqueues a Cloud Task at `fireAt` that sends an FCM message to all of the user's registered tokens.

If `fireAt` is in the past (resource already below threshold), no task is enqueued and the notification fires immediately instead.

### Notification Content

| Resource | Title | Body |
|---|---|---|
| Energy | "Low Energy" | "Your energy has dropped to {threshold}%. Time to rest." |
| Hydration | "Low Hydration" | "Your hydration has dropped to {threshold}%. Drink some water." |

---

## Quest Due Date Notifications

Each quest with a due date can have at most one scheduled notification. The player configures this per quest in the quest form.

### Quest Notification Field

A `notification` field is added to the Quest document in Firestore:

| Field | Type | Description |
|---|---|---|
| `notification` | `QuestNotification \| null` | Notification config for this quest, or null for none |

### QuestNotification Type

```typescript
type QuestNotification =
  | { type: 'time_of_day'; hour: number; minute: number }  // fires at this hour:minute on the due date
  | { type: 'before_due'; minutesBefore: number }          // fires N minutes before dueDate + dueTime
```

**`time_of_day`**: The notification fires at the specified `hour` and `minute` (24-hour) on the quest's `dueDate`, interpreted in the player's timezone. For example, `{ hour: 9, minute: 0 }` fires at 9:00 AM on the due date. Available whenever a `dueDate` is set.

**`before_due`**: The notification fires `minutesBefore` minutes before the combined `dueDate` + `dueTime`. Only available when the quest has both a `dueDate` and a `dueTime`. Common presets: 15, 30, 60, 120, 1440, 2880 minutes. Custom values are also supported.

### Quest Form UI

When a `dueDate` is set on a quest, a "Reminder" row appears below the due date/time fields:
- **None** (default)
- **At a specific time** → shows hour and minute steppers; saves `{ type: 'time_of_day', hour, minute }`
- **Before due time** → shows preset chips + custom input; only enabled when `dueTime` is also set; saves `{ type: 'before_due', minutesBefore }`

If the user removes the `dueDate`, the notification field is cleared and any pending notification is cancelled.

### Scheduling Logic (Server-Side)

A Firestore `onWrite` Cloud Function triggers whenever a quest document changes. The function:

1. Cancels any existing scheduled Cloud Task for this quest (keyed by quest ID).
2. If the quest is not completed, has a `dueDate`, and has a non-null `notification`:

```
// time_of_day
fireAt = fromZonedTime(dueDate at notification.hour:notification.minute, character.timezone)

// before_due
fireAt = fromZonedTime(dueDate + 'T' + dueTime, character.timezone) - notification.minutesBefore × 60 000 ms
```

(`fromZonedTime` is from `date-fns-tz` — converts a local wall-clock time in the player's timezone to a UTC instant.)

3. If `fireAt` is in the future, enqueues a Cloud Task that sends an FCM message to all user tokens at that time.

User timezone is stored on the Firestore profile and used when constructing `fireAt` for `time_of_day` notifications.

### Notification Content

| Title | Body |
|---|---|
| Quest name | "Due today at {dueTime}" if due today; otherwise "Due {formatted dueDate}" |

### Lifecycle

| Event | Server action |
|---|---|
| Quest created with notification | Cloud Function schedules task |
| Quest updated (any field) | Cloud Function cancels old task, reschedules if still valid |
| Quest completed | Cloud Function cancels task |
| Quest skipped | Cloud Function cancels, reschedules for new due date if applicable |
| Quest deleted | Cloud Function cancels task |
| Due date removed | Cloud Function cancels task |

---

## Notification Settings in Firestore

Notification settings are stored on the character document. No separate document is needed.

New fields on the character document:

| Field | Type | Description |
|---|---|---|
| `notificationPermission` | `'undetermined' \| 'granted' \| 'denied'` | Permission state for this device (stored per-device in `fcmTokens`) |
| `energyNotification` | `{ enabled: boolean; threshold: number }` | Energy threshold alert config |
| `hydrationNotification` | `{ enabled: boolean; threshold: number }` | Hydration threshold alert config |
| `timezone` | string | IANA timezone string (e.g. `'America/New_York'`) for scheduling `time_of_day` notifications |

Quest notification config (`notification` field) lives on each Quest document.

---

## Settings UI

Notification settings are accessible from the **Character screen** under a "Notifications" section.

| Setting | Control | Notes |
|---|---|---|
| Energy alert | Toggle + number input (0–100) | Disabled and greyed out if permission denied |
| Hydration alert | Toggle + number input (0–120) | Disabled and greyed out if permission denied |
| Permission warning | Inline banner | Shown only when permission is `'denied'`; links to system settings |

---

## Infrastructure Summary

| Component | Technology |
|---|---|
| Push delivery | Firebase Cloud Messaging (FCM) |
| Notification scheduling | Google Cloud Tasks (enqueued by Cloud Functions) |
| Trigger on data change | Firestore `onWrite` Cloud Functions |
| Token storage | Firestore `users/{uid}/fcmTokens` subcollection |
| Web service worker | `firebase-messaging-sw.js` at app root |
| VAPID key | Configured in Firebase project, referenced in web client init |
