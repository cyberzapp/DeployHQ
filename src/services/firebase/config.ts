import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

export const isFirebaseConfigured = Boolean(
  (apiKey && apiKey !== 'your-firebase-api-key' && projectId) || useEmulator
);

const firebaseConfig = {
  apiKey: apiKey || 'demo-deployhq-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-deployhq.firebaseapp.com',
  projectId: projectId || 'demo-deployhq',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-deployhq.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '100000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:100000000000:web:deployhq0001',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;
let storage: FirebaseStorage;
let remoteConfig: RemoteConfig | null = null;

app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
auth = getAuth(app);
db = getFirestore(app);
functions = getFunctions(app);
storage = getStorage(app);

// Initialize Firebase App Check if reCAPTCHA v3 key is configured
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Ignore duplicate AppCheck init in HMR
  }
}

// Initialize Remote Config in browser environments
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 300000;
    remoteConfig.defaultConfig = {
      enable_live_log_tail: true,
      enable_razorpay_checkout: true,
      max_free_projects: 2,
    };
  } catch {
    remoteConfig = null;
  }
}

// Connect to Firebase Emulator Suite when enabled
if (useEmulator && typeof window !== 'undefined') {
  const w = window as unknown as { __EMULATORS_CONNECTED__?: boolean };
  if (!w.__EMULATORS_CONNECTED__) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    w.__EMULATORS_CONNECTED__ = true;
  }
}

export { app, auth, db, functions, storage, remoteConfig };

