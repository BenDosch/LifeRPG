"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupStaleTokens = exports.sendQuestAlert = exports.onQuestWritten = exports.sendHydrationAlert = exports.sendEnergyAlert = exports.onCharacterWritten = exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
// Health check function
exports.healthCheck = (0, https_1.onRequest)({ cors: true }, (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Phase 5: Notification functions
var resourceThreshold_1 = require("./notifications/resourceThreshold");
Object.defineProperty(exports, "onCharacterWritten", { enumerable: true, get: function () { return resourceThreshold_1.onCharacterWritten; } });
Object.defineProperty(exports, "sendEnergyAlert", { enumerable: true, get: function () { return resourceThreshold_1.sendEnergyAlert; } });
Object.defineProperty(exports, "sendHydrationAlert", { enumerable: true, get: function () { return resourceThreshold_1.sendHydrationAlert; } });
var questDue_1 = require("./notifications/questDue");
Object.defineProperty(exports, "onQuestWritten", { enumerable: true, get: function () { return questDue_1.onQuestWritten; } });
Object.defineProperty(exports, "sendQuestAlert", { enumerable: true, get: function () { return questDue_1.sendQuestAlert; } });
var tokenCleanup_1 = require("./notifications/tokenCleanup");
Object.defineProperty(exports, "cleanupStaleTokens", { enumerable: true, get: function () { return tokenCleanup_1.cleanupStaleTokens; } });
//# sourceMappingURL=index.js.map