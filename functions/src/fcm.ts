import { getMessaging } from 'firebase-admin/messaging';

export interface FcmMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendFcmToTokens(
  tokens: string[],
  message: FcmMessage
): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0, invalidTokens: [] };

  const messaging = getMessaging();
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

  const invalidTokens: string[] = [];
  batchResponse.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const errCode = resp.error?.code;
      if (
        errCode === 'messaging/registration-token-not-registered' ||
        errCode === 'messaging/invalid-registration-token'
      ) {
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
