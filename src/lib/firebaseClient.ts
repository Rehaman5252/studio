
// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  getFirestore,
  doc,
  getDoc,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Initialize Firestore with long-polling and persistence for better resilience
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalForceLongPolling: true,
        useFetchStreams: false,
      });
    } catch (e) {
      console.warn("Could not initialize Firestore with persistence, falling back.", e);
      db = getFirestore(app);
    }
    auth = getAuth(app);
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

/**
 * A more reliable way to check for a network connection with a timeout.
 * This function now also attempts a quick Firestore read as a definitive test.
 * @returns {Promise<boolean>}
 */
export async function isReallyOnline(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine || !db) {
    return false;
  }
  try {
    // Re-enable network before checking. This is crucial for recovering from an offline state.
    await enableNetwork(db);
    // Attempt a quick, low-cost read from a non-existent document.
    // This confirms not just network, but also Firebase service reachability.
    const healthCheckDoc = doc(db, '_internal', 'health_check');
    await getDoc(healthCheckDoc);
    return true;
  } catch (error: any) {
    // Firestore throws 'unavailable' or 'offline' errors when it can't connect.
    if (error.code === 'unavailable' || error.code === 'offline' || error.message.includes('offline')) {
        console.warn("Firestore health check failed, client is offline:", error.code);
        // Explicitly disable network to prevent further failed attempts until re-enabled.
        await disableNetwork(db);
        return false;
    }
    // For other errors, we might still be "online" but have a different problem.
    console.error("An unexpected error occurred during online check:", error);
    return true; // Assume online for other errors
  }
}

export { app, auth, db };
