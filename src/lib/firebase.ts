/**
 * Firebase initialization — platform-aware.
 *
 * On Web  → uses the firebase JS SDK (initialized here with firebaseConfig).
 * On Native → uses @react-native-firebase/* packages, which auto-initialize
 *             from google-services.json (Android) / GoogleService-Info.plist (iOS).
 *
 * Replace every REPLACE_WITH_* placeholder with real values from your
 * Firebase Console project settings before running on any environment.
 */

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Web SDK config — replace placeholders with your Firebase project's values.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'REPLACE_WITH_YOUR_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID',
  measurementId: 'REPLACE_WITH_YOUR_MEASUREMENT_ID',
};

// ---------------------------------------------------------------------------
// Type aliases used for the unified export surface
// ---------------------------------------------------------------------------
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { Messaging } from 'firebase/messaging';

// @react-native-firebase types (only resolved at runtime on native)
type RNFirebaseAuth = import('@react-native-firebase/auth').FirebaseAuthTypes.Module;
type RNFirebaseFirestore = import('@react-native-firebase/firestore').FirebaseFirestoreTypes.Module;
type RNFirebaseMessaging = import('@react-native-firebase/messaging').FirebaseMessagingTypes.Module;

export type UnifiedAuth = Auth | RNFirebaseAuth;
export type UnifiedFirestore = Firestore | RNFirebaseFirestore;
export type UnifiedMessaging = Messaging | RNFirebaseMessaging;

// ---------------------------------------------------------------------------
// Lazy singletons — initialized on first call
// ---------------------------------------------------------------------------
let _auth: UnifiedAuth | null = null;
let _firestore: UnifiedFirestore | null = null;
let _messaging: UnifiedMessaging | null = null;
// Sentinel to distinguish "not yet resolved" from "resolved to null" for messaging
let _messagingResolved = false;

// ---------------------------------------------------------------------------
// Web initialization — cached promise guards against concurrent double-init
// ---------------------------------------------------------------------------
let _webInitPromise: Promise<void> | null = null;

function initWeb(): Promise<void> {
  if (_webInitPromise) return _webInitPromise;
  _webInitPromise = (async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    if (getApps().length === 0) {
      initializeApp(firebaseConfig);
    }
  })();
  return _webInitPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getFirebaseAuth(): Promise<UnifiedAuth> {
  if (_auth) return _auth;

  if (Platform.OS === 'web') {
    await initWeb();
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth();
  } else {
    const RNAuth = (await import('@react-native-firebase/auth')).default;
    _auth = RNAuth();
  }

  return _auth;
}

export async function getFirebaseFirestore(): Promise<UnifiedFirestore> {
  if (_firestore) return _firestore;

  if (Platform.OS === 'web') {
    await initWeb();
    const { getFirestore } = await import('firebase/firestore');
    _firestore = getFirestore();
  } else {
    const RNFirestore = (await import('@react-native-firebase/firestore')).default;
    _firestore = RNFirestore();
  }

  return _firestore;
}

export async function getFirebaseMessaging(): Promise<UnifiedMessaging | null> {
  // Return cached value once resolved (including null for unsupported browsers)
  if (_messagingResolved) return _messaging;

  if (Platform.OS === 'web') {
    // Messaging requires a service worker; only available in supported browsers
    try {
      await initWeb();
      const { getMessaging, isSupported } = await import('firebase/messaging');
      const supported = await isSupported();
      if (supported) {
        _messaging = getMessaging();
      }
    } catch {
      // Leave _messaging as null — unsupported or blocked
    }
  } else {
    const RNMessaging = (await import('@react-native-firebase/messaging')).default;
    _messaging = RNMessaging();
  }

  _messagingResolved = true;
  return _messaging;
}

// ---------------------------------------------------------------------------
// Convenience re-export of the raw web config (useful for the SW, analytics…)
// ---------------------------------------------------------------------------
export { firebaseConfig };
