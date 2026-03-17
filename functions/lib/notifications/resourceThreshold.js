"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHydrationAlert = exports.sendEnergyAlert = exports.onCharacterWritten = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-admin/firestore");
const fcm_1 = require("../fcm");
const tasks_1 = require("../tasks");
// ---------------------------------------------------------------------------
// Firestore trigger — fires when a character document is written
// ---------------------------------------------------------------------------
exports.onCharacterWritten = (0, firestore_1.onDocumentWritten)('users/{userId}/character/data', async (event) => {
    var _a, _b;
    const userId = event.params.userId;
    const newData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    if (!newData)
        return;
    const db = (0, firestore_2.getFirestore)();
    await Promise.all([
        handleEnergyNotification(userId, newData, db),
        handleHydrationNotification(userId, newData, db),
    ]);
});
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getFcmTokens(userId, db) {
    const snap = await db.collection('users').doc(userId).collection('fcmTokens').get();
    return snap.docs.map((d) => d.data().token).filter(Boolean);
}
async function handleEnergyNotification(userId, data, db) {
    var _a, _b;
    const taskId = `liferpg-energy-${userId}`;
    await (0, tasks_1.deleteTask)(taskId);
    const { energy, energyLastUpdated, energyDecayEnabled, energyMinutesPerDay, energyNotification, } = data;
    if (!energyDecayEnabled || !(energyNotification === null || energyNotification === void 0 ? void 0 : energyNotification.enabled))
        return;
    if (typeof energy !== 'number' || energy <= energyNotification.threshold)
        return;
    if (typeof energyMinutesPerDay !== 'number' || energyMinutesPerDay <= 0)
        return;
    const decayRate = 100 / energyMinutesPerDay; // % per minute
    const minutesUntilThreshold = (energy - energyNotification.threshold) / decayRate;
    const lastUpdatedMs = typeof energyLastUpdated === 'string'
        ? new Date(energyLastUpdated).getTime()
        : ((_b = (_a = energyLastUpdated === null || energyLastUpdated === void 0 ? void 0 : energyLastUpdated.toMillis) === null || _a === void 0 ? void 0 : _a.call(energyLastUpdated)) !== null && _b !== void 0 ? _b : Date.now());
    const fireAt = new Date(lastUpdatedMs + minutesUntilThreshold * 60 * 1000);
    if (fireAt <= new Date())
        return; // already in the past
    const tokens = await getFcmTokens(userId, db);
    if (tokens.length === 0)
        return;
    await (0, tasks_1.enqueueTask)({
        url: `${(0, tasks_1.getFunctionBaseUrl)()}/sendEnergyAlert`,
        body: { userId, tokens, threshold: energyNotification.threshold },
        scheduleTime: fireAt,
        taskId,
    });
}
async function handleHydrationNotification(userId, data, db) {
    var _a, _b;
    const taskId = `liferpg-hydration-${userId}`;
    await (0, tasks_1.deleteTask)(taskId);
    const { hydration, hydrationLastUpdated, dailyWaterServings, hydrationNotification, } = data;
    if (!(hydrationNotification === null || hydrationNotification === void 0 ? void 0 : hydrationNotification.enabled))
        return;
    if (typeof hydration !== 'number' || hydration <= hydrationNotification.threshold)
        return;
    if (typeof dailyWaterServings !== 'number' || dailyWaterServings <= 0)
        return;
    // Hydration drains from dailyWaterServings*100/dailyWaterServings = 100 to 0 over 24 hours.
    // Actually hydration is stored as a percentage 0–120; it decays from current value to 0 over 24h.
    // decayRate = 100 / (24 * 60) per minute (full scale in 24h)
    const decayRate = 100 / (24 * 60); // % per minute
    const minutesUntilThreshold = (hydration - hydrationNotification.threshold) / decayRate;
    const lastUpdatedMs = typeof hydrationLastUpdated === 'string'
        ? new Date(hydrationLastUpdated).getTime()
        : ((_b = (_a = hydrationLastUpdated === null || hydrationLastUpdated === void 0 ? void 0 : hydrationLastUpdated.toMillis) === null || _a === void 0 ? void 0 : _a.call(hydrationLastUpdated)) !== null && _b !== void 0 ? _b : Date.now());
    const fireAt = new Date(lastUpdatedMs + minutesUntilThreshold * 60 * 1000);
    if (fireAt <= new Date())
        return;
    const tokens = await getFcmTokens(userId, db);
    if (tokens.length === 0)
        return;
    await (0, tasks_1.enqueueTask)({
        url: `${(0, tasks_1.getFunctionBaseUrl)()}/sendHydrationAlert`,
        body: { userId, tokens, threshold: hydrationNotification.threshold },
        scheduleTime: fireAt,
        taskId,
    });
}
// ---------------------------------------------------------------------------
// HTTP functions called by Cloud Tasks to dispatch the actual FCM messages
// ---------------------------------------------------------------------------
/** Validates that the request came from our Cloud Tasks queue via the shared secret. */
function isAuthorizedTasksRequest(req) {
    if (!tasks_1.TASKS_INTERNAL_SECRET) {
        // Secret not configured — allow in dev/emulator but warn
        console.warn('[liferpg] CLOUD_TASKS_SECRET is not set; skipping auth check');
        return true;
    }
    return req.headers[tasks_1.TASKS_SECRET_HEADER] === tasks_1.TASKS_INTERNAL_SECRET;
}
exports.sendEnergyAlert = (0, https_1.onRequest)(async (req, res) => {
    if (!isAuthorizedTasksRequest(req)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const { tokens, threshold } = req.body;
        if (!Array.isArray(tokens) || tokens.length === 0) {
            res.status(400).json({ error: 'Missing tokens' });
            return;
        }
        await (0, fcm_1.sendFcmToTokens)(tokens, {
            title: 'Low Energy Warning',
            body: `Your energy has dropped below ${threshold}%. Time to rest!`,
            data: { type: 'energy_alert' },
        });
        res.json({ success: true });
    }
    catch (e) {
        console.error('[sendEnergyAlert]', e);
        res.status(500).json({ error: e.message });
    }
});
exports.sendHydrationAlert = (0, https_1.onRequest)(async (req, res) => {
    if (!isAuthorizedTasksRequest(req)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const { tokens, threshold } = req.body;
        if (!Array.isArray(tokens) || tokens.length === 0) {
            res.status(400).json({ error: 'Missing tokens' });
            return;
        }
        await (0, fcm_1.sendFcmToTokens)(tokens, {
            title: 'Low Hydration Warning',
            body: `Your hydration has dropped below ${threshold}. Drink some water!`,
            data: { type: 'hydration_alert' },
        });
        res.json({ success: true });
    }
    catch (e) {
        console.error('[sendHydrationAlert]', e);
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=resourceThreshold.js.map