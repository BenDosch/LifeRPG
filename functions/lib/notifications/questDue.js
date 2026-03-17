"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQuestAlert = exports.onQuestWritten = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-admin/firestore");
const fcm_1 = require("../fcm");
const tasks_1 = require("../tasks");
const date_fns_tz_1 = require("date-fns-tz");
// ---------------------------------------------------------------------------
// Firestore trigger — fires when a quest document is written
// ---------------------------------------------------------------------------
exports.onQuestWritten = (0, firestore_1.onDocumentWritten)('users/{userId}/quests/{questId}', async (event) => {
    var _a, _b, _c, _d;
    const { userId, questId } = event.params;
    const taskId = `liferpg-quest-${questId}`;
    await (0, tasks_1.deleteTask)(taskId);
    const questData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.after) === null || _b === void 0 ? void 0 : _b.data();
    if (!questData)
        return; // document deleted
    if (questData.completedAt)
        return; // already completed — no notification needed
    if (!questData.dueDate || !questData.notification)
        return;
    const db = (0, firestore_2.getFirestore)();
    // Fetch the user's timezone from their character document
    const charSnap = await db
        .collection('users')
        .doc(userId)
        .collection('character')
        .doc('data')
        .get();
    const timezone = (_d = (_c = charSnap.data()) === null || _c === void 0 ? void 0 : _c.timezone) !== null && _d !== void 0 ? _d : 'UTC';
    const fireAt = calcFireAt(questData, timezone);
    if (!fireAt || fireAt <= new Date())
        return;
    // Fetch FCM tokens
    const tokensSnap = await db.collection('users').doc(userId).collection('fcmTokens').get();
    const tokens = tokensSnap.docs
        .map((d) => d.data().token)
        .filter(Boolean);
    if (tokens.length === 0)
        return;
    await (0, tasks_1.enqueueTask)({
        url: `${(0, tasks_1.getFunctionBaseUrl)()}/sendQuestAlert`,
        body: { userId, tokens, questName: questData.name },
        scheduleTime: fireAt,
        taskId,
    });
});
// ---------------------------------------------------------------------------
// Helper: calculate when the notification should fire
// ---------------------------------------------------------------------------
function calcFireAt(questData, timezone) {
    const { dueDate, dueTime, notification } = questData;
    if (!notification)
        return null;
    try {
        if (notification.type === 'time_of_day') {
            // Fire at notification.hour:notification.minute on dueDate in the user's timezone
            const { hour, minute } = notification;
            // Build a local date-time string like "2025-12-31T09:00:00"
            const localDateTimeStr = `${dueDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
            // Interpret it in the user's timezone and convert to UTC
            const utcDate = (0, date_fns_tz_1.fromZonedTime)(localDateTimeStr, timezone);
            return utcDate;
        }
        if (notification.type === 'before_due') {
            // Need dueTime to be set; fire minutesBefore minutes before it
            if (!dueTime)
                return null;
            const { minutesBefore } = notification;
            const localDateTimeStr = `${dueDate}T${dueTime}:00`;
            const dueUtc = (0, date_fns_tz_1.fromZonedTime)(localDateTimeStr, timezone);
            return new Date(dueUtc.getTime() - minutesBefore * 60 * 1000);
        }
    }
    catch (e) {
        console.error('[questDue] calcFireAt error:', e);
    }
    return null;
}
// ---------------------------------------------------------------------------
// HTTP function called by Cloud Tasks to dispatch the FCM message
// ---------------------------------------------------------------------------
/** Validates that the request came from our Cloud Tasks queue via the shared secret. */
function isAuthorizedTasksRequest(req) {
    if (!tasks_1.TASKS_INTERNAL_SECRET) {
        console.warn('[liferpg] CLOUD_TASKS_SECRET is not set; skipping auth check');
        return true;
    }
    return req.headers[tasks_1.TASKS_SECRET_HEADER] === tasks_1.TASKS_INTERNAL_SECRET;
}
exports.sendQuestAlert = (0, https_1.onRequest)(async (req, res) => {
    if (!isAuthorizedTasksRequest(req)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const { tokens, questName } = req.body;
        if (!Array.isArray(tokens) || tokens.length === 0) {
            res.status(400).json({ error: 'Missing tokens' });
            return;
        }
        await (0, fcm_1.sendFcmToTokens)(tokens, {
            title: 'Quest Due Soon',
            body: questName ? `"${questName}" is due soon!` : 'A quest is due soon!',
            data: { type: 'quest_due' },
        });
        res.json({ success: true });
    }
    catch (e) {
        console.error('[sendQuestAlert]', e);
        res.status(500).json({ error: e.message });
    }
});
//# sourceMappingURL=questDue.js.map