/**
 * Platform-aware FCM token registration and refresh listener.
 *
 * - Retrieves the device/browser FCM token
 * - Hashes it to produce a stable document ID
 * - Upserts the token record to users/{uid}/fcmTokens/{tokenHash}
 * - Returns a cleanup function for onTokenRefresh
 */

import { Platform } from 'react-native';
import { getFirebaseMessaging } from './firebase';
import { getFcmTokenRef, firestoreSetDoc } from './firestore';
import { FcmToken } from '../types';

// Replace with your actual VAPID key from the Firebase Console
const VAPID_KEY = 'REPLACE_WITH_YOUR_VAPID_KEY';

// Simple, collision-resistant hash derived from the token string.
// Uses btoa (base64) and takes the first 40 chars after stripping unsafe chars.
function hashToken(token: string): string {
  try {
    return btoa(token).replace(/[+/=]/g, '').slice(0, 40);
  } catch {
    // btoa can fail on non-latin strings; fall back to a truncated version
    return token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  }
}

async function upsertToken(userId: string, token: string): Promise<void> {
  const hash = hashToken(token);
  const ref = await getFcmTokenRef(userId, hash);
  const platform: FcmToken['platform'] =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const now = Date.now();
  const record: FcmToken = { token, platform, createdAt: now, lastSeenAt: now };
  await firestoreSetDoc(ref, record, { merge: true });
}

export async function registerFcmToken(userId: string): Promise<void> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return; // FCM not supported in this browser

    let token: string | null = null;

    if (Platform.OS === 'web') {
      const { getToken } = await import('firebase/messaging');
      token = await getToken(messaging as any, { vapidKey: VAPID_KEY });
    } else {
      token = await (messaging as any).getToken();
    }

    if (token) {
      await upsertToken(userId, token);
    }
  } catch (e) {
    console.warn('[fcmTokens] registerFcmToken failed:', e);
  }
}

export async function setupTokenRefreshListener(userId: string): Promise<() => void> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    if (Platform.OS === 'web') {
      // Web FCM does not have an onTokenRefresh equivalent in the modular SDK.
      // Re-register on page focus as a reasonable proxy.
      const handler = () => { registerFcmToken(userId); };
      window.addEventListener('focus', handler);
      return () => window.removeEventListener('focus', handler);
    } else {
      const unsubscribe = (messaging as any).onTokenRefresh(async () => {
        await registerFcmToken(userId);
      });
      return unsubscribe;
    }
  } catch (e) {
    console.warn('[fcmTokens] setupTokenRefreshListener failed:', e);
    return () => {};
  }
}

export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'not_determined'> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return 'denied';

    if (Platform.OS === 'web') {
      const result = await Notification.requestPermission();
      if (result === 'granted') return 'granted';
      if (result === 'denied') return 'denied';
      return 'not_determined';
    } else {
      const authStatus = await (messaging as any).requestPermission();
      // @react-native-firebase/messaging AuthorizationStatus values:
      // 1 = AUTHORIZED, 2 = PROVISIONAL (treat as granted), else denied
      if (authStatus === 1 || authStatus === 2) return 'granted';
      if (authStatus === -1) return 'not_determined';
      return 'denied';
    }
  } catch (e) {
    console.warn('[fcmTokens] requestNotificationPermission failed:', e);
    return 'denied';
  }
}
