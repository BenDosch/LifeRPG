import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { sendFcmToTokens } from '../fcm';
import { enqueueTask, deleteTask, getFunctionBaseUrl, TASKS_INTERNAL_SECRET, TASKS_SECRET_HEADER } from '../tasks';
import { fromZonedTime } from 'date-fns-tz';

// ---------------------------------------------------------------------------
// Firestore trigger — fires when a quest document is written
// ---------------------------------------------------------------------------
export const onQuestWritten = onDocumentWritten(
  'users/{userId}/quests/{questId}',
  async (event) => {
    const { userId, questId } = event.params;
    const taskId = `liferpg-quest-${questId}`;

    await deleteTask(taskId);

    const questData = event.data?.after?.data();
    if (!questData) return; // document deleted
    if (questData.completedAt) return; // already completed — no notification needed
    if (!questData.dueDate || !questData.notification) return;

    const db = getFirestore();

    // Fetch the user's timezone from their character document
    const charSnap = await db
      .collection('users')
      .doc(userId)
      .collection('character')
      .doc('data')
      .get();
    const timezone: string = charSnap.data()?.timezone ?? 'UTC';

    const fireAt = calcFireAt(questData, timezone);
    if (!fireAt || fireAt <= new Date()) return;

    // Fetch FCM tokens
    const tokensSnap = await db.collection('users').doc(userId).collection('fcmTokens').get();
    const tokens: string[] = tokensSnap.docs
      .map((d) => (d.data() as any).token as string)
      .filter(Boolean);
    if (tokens.length === 0) return;

    await enqueueTask({
      url: `${getFunctionBaseUrl()}/sendQuestAlert`,
      body: { userId, tokens, questName: questData.name },
      scheduleTime: fireAt,
      taskId,
    });
  }
);

// ---------------------------------------------------------------------------
// Helper: calculate when the notification should fire
// ---------------------------------------------------------------------------
function calcFireAt(
  questData: FirebaseFirestore.DocumentData,
  timezone: string
): Date | null {
  const { dueDate, dueTime, notification } = questData;

  if (!notification) return null;

  try {
    if (notification.type === 'time_of_day') {
      // Fire at notification.hour:notification.minute on dueDate in the user's timezone
      const { hour, minute } = notification;
      // Build a local date-time string like "2025-12-31T09:00:00"
      const localDateTimeStr = `${dueDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      // Interpret it in the user's timezone and convert to UTC
      const utcDate = fromZonedTime(localDateTimeStr, timezone);
      return utcDate;
    }

    if (notification.type === 'before_due') {
      // Need dueTime to be set; fire minutesBefore minutes before it
      if (!dueTime) return null;
      const { minutesBefore } = notification;
      const localDateTimeStr = `${dueDate}T${dueTime}:00`;
      const dueUtc = fromZonedTime(localDateTimeStr, timezone);
      return new Date(dueUtc.getTime() - minutesBefore * 60 * 1000);
    }
  } catch (e) {
    console.error('[questDue] calcFireAt error:', e);
  }

  return null;
}

// ---------------------------------------------------------------------------
// HTTP function called by Cloud Tasks to dispatch the FCM message
// ---------------------------------------------------------------------------

/** Validates that the request came from our Cloud Tasks queue via the shared secret. */
function isAuthorizedTasksRequest(req: any): boolean {
  if (!TASKS_INTERNAL_SECRET) {
    console.warn('[liferpg] CLOUD_TASKS_SECRET is not set; skipping auth check');
    return true;
  }
  return req.headers[TASKS_SECRET_HEADER] === TASKS_INTERNAL_SECRET;
}

export const sendQuestAlert = onRequest(async (req, res) => {
  if (!isAuthorizedTasksRequest(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const { tokens, questName } = req.body as {
      userId: string;
      tokens: string[];
      questName: string;
    };
    if (!Array.isArray(tokens) || tokens.length === 0) {
      res.status(400).json({ error: 'Missing tokens' });
      return;
    }
    await sendFcmToTokens(tokens, {
      title: 'Quest Due Soon',
      body: questName ? `"${questName}" is due soon!` : 'A quest is due soon!',
      data: { type: 'quest_due' },
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error('[sendQuestAlert]', e);
    res.status(500).json({ error: e.message });
  }
});
