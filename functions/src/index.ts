import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

// Health check function
export const healthCheck = onRequest({ cors: true }, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Phase 5: Notification functions
export { onCharacterWritten, sendEnergyAlert, sendHydrationAlert } from './notifications/resourceThreshold';
export { onQuestWritten, sendQuestAlert } from './notifications/questDue';
export { cleanupStaleTokens } from './notifications/tokenCleanup';
