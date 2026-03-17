/**
 * Firebase Cloud Messaging — Web Service Worker
 *
 * This file must live at /public/firebase-messaging-sw.js so it is served
 * from the root of the site (required by the FCM SDK).
 *
 * Replace every REPLACE_WITH_* value below with your real Firebase project
 * config values before deploying.
 */

// Import Firebase SDKs (compat builds are required inside service workers)
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'REPLACE_WITH_YOUR_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID',
  measurementId: 'REPLACE_WITH_YOUR_MEASUREMENT_ID',
});

const messaging = firebase.messaging();

/**
 * Handle background messages (app not in foreground).
 * The notification payload is shown automatically if it contains a
 * `notification` field; use `data` for custom data-only messages.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title ?? 'LifeRPG';
  const notificationOptions = {
    body: payload.notification?.body ?? '',
    icon: '/assets/icon.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
