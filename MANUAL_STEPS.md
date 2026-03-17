# Firebase Manual Setup Steps

These steps must be completed in the Firebase Console and cannot be automated.

---

## 1. Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **Add project**
3. Name the project (e.g., `LifeRPG`)
4. (Optional) Enable Google Analytics
5. Click **Create project**

---

## 2. Register Your Apps

### Web App
1. In your project, click **Add app** → Web (`</>`)
2. Give it a nickname (e.g., `LifeRPG Web`)
3. (Optional) Check **Firebase Hosting** if you plan to use it
4. Copy the `firebaseConfig` values shown
5. Replace all `REPLACE_WITH_*` placeholders in:
   - `src/lib/firebase.ts` → `firebaseConfig` object
   - `public/firebase-messaging-sw.js` → `firebase.initializeApp({...})`
   - `app.json` → `expo.extra.firebaseWeb`

### Android App
1. Click **Add app** → Android
2. Enter package name: `com.liferpg.app`
3. Download `google-services.json`
4. Replace `/Users/bendosch/LifeRPG/google-services.json` with the downloaded file

### iOS App
1. Click **Add app** → iOS
2. Enter bundle ID: `com.liferpg.app`
3. Download `GoogleService-Info.plist`
4. Replace `/Users/bendosch/LifeRPG/ios/GoogleService-Info.plist` with the downloaded file

---

## 3. Enable Firebase Authentication

1. In the Firebase Console, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable:
   - **Email/Password** (for basic auth)
   - Any other providers you want (Google, Apple, etc.)

---

## 4. Enable Cloud Firestore

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (the security rules in `firestore.rules` enforce auth)
4. Select a region close to your users
5. Click **Enable**
6. Deploy security rules:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
   Or paste the contents of `firestore.rules` into the Rules tab in the Console.

---

## 5. Enable Cloud Messaging (Push Notifications)

### Web (VAPID key)
1. Go to **Project Settings → Cloud Messaging**
2. Under **Web configuration**, click **Generate key pair**
3. Copy the VAPID key
4. Store it securely (you'll need it when calling `getToken(messaging, { vapidKey: '...' })`)

### Android / iOS
- FCM is enabled automatically when you register the Android/iOS apps above.
- iOS additionally requires uploading an APNs auth key or certificate:
  1. Go to **Project Settings → Cloud Messaging → iOS app configuration**
  2. Upload your APNs Auth Key (`.p8`) from the Apple Developer portal

---

## 6. (Optional) Firebase Hosting

If you want to host the Expo web build:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# set public directory to: dist   (Expo web output)
npx expo export --platform web
firebase deploy --only hosting
```

---

## 7. Security — Keep Credentials Safe

- **Never commit** real `google-services.json` or `GoogleService-Info.plist` to a public repository.
- Add them to `.gitignore`:
  ```
  google-services.json
  ios/GoogleService-Info.plist
  ```
- Use environment variables or EAS Secrets for CI/CD builds.

---

## Summary of Files to Update After Console Setup

| File | What to replace |
|---|---|
| `src/lib/firebase.ts` | All `REPLACE_WITH_*` in `firebaseConfig` |
| `public/firebase-messaging-sw.js` | All `REPLACE_WITH_*` in `firebase.initializeApp(...)` |
| `app.json` | All `REPLACE_WITH_*` in `expo.extra.firebaseWeb` |
| `google-services.json` | Entire file → download from Console |
| `ios/GoogleService-Info.plist` | Entire file → download from Console |

---

## Phase 4 — Cloud Functions Manual Steps

### 1. Enable Cloud Tasks API

1. Go to https://console.cloud.google.com/apis/library/cloudtasks.googleapis.com
2. Select your LifeRPG project from the project dropdown
3. Click **Enable**

### 2. Create the `liferpg-notifications` Cloud Tasks Queue

Run the following command with the `gcloud` CLI (must be authenticated to your project):

```bash
gcloud tasks queues create liferpg-notifications --location=us-central1
```

Verify it was created:
```bash
gcloud tasks queues describe liferpg-notifications --location=us-central1
```

> If you need a different region, update `LOCATION` in `functions/src/tasks.ts` to match.

### 3. Set Up Credentials

Cloud Functions running on Google Cloud automatically use the **default service account** — no extra setup needed when deployed. For local development or the emulator, set up Application Default Credentials:

```bash
gcloud auth application-default login
```

This writes credentials to `~/.config/gcloud/application_default_credentials.json`, which the Firebase Admin SDK and Cloud Tasks client pick up automatically.

### 4. Deploy Cloud Functions

Authenticate the Firebase CLI and deploy:

```bash
npm install -g firebase-tools   # if not already installed
firebase login
cd /Users/bendosch/LifeRPG
firebase deploy --only functions
```

Or use the shortcut script defined in `functions/package.json`:
```bash
cd /Users/bendosch/LifeRPG/functions
npm run deploy
```

### 5. Verify the Health Check Endpoint

After deployment, Firebase will print the function URL. It will look like:

```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/healthCheck
```

Verify it responds correctly:
```bash
curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/healthCheck
# Expected: {"status":"ok","timestamp":"2026-..."}
```

You can also open the URL directly in a browser.
