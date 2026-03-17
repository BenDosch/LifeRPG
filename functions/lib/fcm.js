"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFcmToTokens = sendFcmToTokens;
const messaging_1 = require("firebase-admin/messaging");
async function sendFcmToTokens(tokens, message) {
    if (tokens.length === 0)
        return { successCount: 0, failureCount: 0, invalidTokens: [] };
    const messaging = (0, messaging_1.getMessaging)();
    const batchResponse = await messaging.sendEachForMulticast({
        tokens,
        notification: {
            title: message.title,
            body: message.body,
        },
        data: message.data,
        android: {
            priority: 'high',
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                },
            },
        },
        webpush: {
            notification: {
                icon: '/icon.png',
            },
        },
    });
    const invalidTokens = [];
    batchResponse.responses.forEach((resp, idx) => {
        var _a;
        if (!resp.success) {
            const errCode = (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code;
            if (errCode === 'messaging/registration-token-not-registered' ||
                errCode === 'messaging/invalid-registration-token') {
                invalidTokens.push(tokens[idx]);
            }
        }
    });
    return {
        successCount: batchResponse.successCount,
        failureCount: batchResponse.failureCount,
        invalidTokens,
    };
}
//# sourceMappingURL=fcm.js.map