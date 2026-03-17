import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { sendFcmToTokens } from '../fcm';
import { enqueueTask, deleteTask, getFunctionBaseUrl, TASKS_INTERNAL_SECRET, TASKS_SECRET_HEADER } from '../tasks';

// ---------------------------------------------------------------------------
// Firestore trigger — fires when a character document is written
// ---------------------------------------------------------------------------
export const onCharacterWritten = onDocumentWritten(
  'users/{userId}/character/data',
  async (event) => {
    const userId = event.params.userId;
    const newData = event.data?.after?.data();
    if (!newData) return;

    const db = getFirestore();
    await Promise.all([
      handleEnergyNotification(userId, newData, db),
      handleHydrationNotification(userId, newData, db),
    ]);
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getFcmTokens(userId: string, db: FirebaseFirestore.Firestore): Promise<string[]> {
  const snap = await db.collection('users').doc(userId).collection('fcmTokens').get();
  return snap.docs.map((d) => (d.data() as any).token as string).filter(Boolean);
}

async function handleEnergyNotification(
  userId: string,
  data: FirebaseFirestore.DocumentData,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const taskId = `liferpg-energy-${userId}`;
  await deleteTask(taskId);

  const {
    energy,
    energyLastUpdated,
    energyDecayEnabled,
    energyMinutesPerDay,
    energyNotification,
  } = data;

  if (!energyDecayEnabled || !energyNotification?.enabled) return;
  if (typeof energy !== 'number' || energy <= energyNotification.threshold) return;
  if (typeof energyMinutesPerDay !== 'number' || energyMinutesPerDay <= 0) return;

  const decayRate = 100 / energyMinutesPerDay; // % per minute
  const minutesUntilThreshold = (energy - energyNotification.threshold) / decayRate;
  const lastUpdatedMs =
    typeof energyLastUpdated === 'string'
      ? new Date(energyLastUpdated).getTime()
      : (energyLastUpdated?.toMillis?.() ?? Date.now());
  const fireAt = new Date(lastUpdatedMs + minutesUntilThreshold * 60 * 1000);

  if (fireAt <= new Date()) return; // already in the past

  const tokens = await getFcmTokens(userId, db);
  if (tokens.length === 0) return;

  await enqueueTask({
    url: `${getFunctionBaseUrl()}/sendEnergyAlert`,
    body: { userId, tokens, threshold: energyNotification.threshold },
    scheduleTime: fireAt,
    taskId,
  });
}

async function handleHydrationNotification(
  userId: string,
  data: FirebaseFirestore.DocumentData,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const taskId = `liferpg-hydration-${userId}`;
  await deleteTask(taskId);

  const {
    hydration,
    hydrationLastUpdated,
    dailyWaterServings,
    hydrationNotification,
  } = data;

  if (!hydrationNotification?.enabled) return;
  if (typeof hydration !== 'number' || hydration <= hydrationNotification.threshold) return;
  if (typeof dailyWaterServings !== 'number' || dailyWaterServings <= 0) return;

  // Hydration drains from dailyWaterServings*100/dailyWaterServings = 100 to 0 over 24 hours.
  // Actually hydration is stored as a percentage 0–120; it decays from current value to 0 over 24h.
  // decayRate = 100 / (24 * 60) per minute (full scale in 24h)
  const decayRate = 100 / (24 * 60); // % per minute
  const minutesUntilThreshold = (hydration - hydrationNotification.threshold) / decayRate;
  const lastUpdatedMs =
    typeof hydrationLastUpdated === 'string'
      ? new Date(hydrationLastUpdated).getTime()
      : (hydrationLastUpdated?.toMillis?.() ?? Date.now());
  const fireAt = new Date(lastUpdatedMs + minutesUntilThreshold * 60 * 1000);

  if (fireAt <= new Date()) return;

  const tokens = await getFcmTokens(userId, db);
  if (tokens.length === 0) return;

  await enqueueTask({
    url: `${getFunctionBaseUrl()}/sendHydrationAlert`,
    body: { userId, tokens, threshold: hydrationNotification.threshold },
    scheduleTime: fireAt,
    taskId,
  });
}

// ---------------------------------------------------------------------------
// HTTP functions called by Cloud Tasks to dispatch the actual FCM messages
// ---------------------------------------------------------------------------

/** Validates that the request came from our Cloud Tasks queue via the shared secret. */
function isAuthorizedTasksRequest(req: any): boolean {
  if (!TASKS_INTERNAL_SECRET) {
    // Secret not configured — allow in dev/emulator but warn
    console.warn('[liferpg] CLOUD_TASKS_SECRET is not set; skipping auth check');
    return true;
  }
  return req.headers[TASKS_SECRET_HEADER] === TASKS_INTERNAL_SECRET;
}

export const sendEnergyAlert = onRequest(async (req, res) => {
  if (!isAuthorizedTasksRequest(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const { tokens, threshold } = req.body as { userId: string; tokens: string[]; threshold: number };
    if (!Array.isArray(tokens) || tokens.length === 0) {
      res.status(400).json({ error: 'Missing tokens' });
      return;
    }
    await sendFcmToTokens(tokens, {
      title: 'Low Energy Warning',
      body: `Your energy has dropped below ${threshold}%. Time to rest!`,
      data: { type: 'energy_alert' },
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error('[sendEnergyAlert]', e);
    res.status(500).json({ error: e.message });
  }
});

export const sendHydrationAlert = onRequest(async (req, res) => {
  if (!isAuthorizedTasksRequest(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const { tokens, threshold } = req.body as { userId: string; tokens: string[]; threshold: number };
    if (!Array.isArray(tokens) || tokens.length === 0) {
      res.status(400).json({ error: 'Missing tokens' });
      return;
    }
    await sendFcmToTokens(tokens, {
      title: 'Low Hydration Warning',
      body: `Your hydration has dropped below ${threshold}. Drink some water!`,
      data: { type: 'hydration_alert' },
    });
    res.json({ success: true });
  } catch (e: any) {
    console.error('[sendHydrationAlert]', e);
    res.status(500).json({ error: e.message });
  }
});
