"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupStaleTokens = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 400; // Firestore batch limit is 500
exports.cleanupStaleTokens = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
    const db = (0, firestore_1.getFirestore)();
    const cutoff = Date.now() - SIXTY_DAYS_MS;
    // Collection group query across all users' fcmTokens sub-collections
    const staleQuery = db
        .collectionGroup('fcmTokens')
        .where('lastSeenAt', '<', cutoff);
    const snap = await staleQuery.get();
    if (snap.empty)
        return;
    // Batch delete in chunks of BATCH_SIZE
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        const batch = db.batch();
        for (const doc of chunk) {
            batch.delete(doc.ref);
        }
        await batch.commit();
    }
    console.log(`[cleanupStaleTokens] Deleted ${docs.length} stale FCM token(s).`);
});
//# sourceMappingURL=tokenCleanup.js.map