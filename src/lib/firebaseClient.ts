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
let auth: Auth | null;
let db: Firestore | null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Enable modern persistent caching on the client only
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (e) {
    console.error("Firestore persistence initialization failed, falling back to memory cache.", e);
    // Fallback to in-memory cache if persistence fails (e.g., in private browsing mode)
    db = getFirestore(app);
  }

} else {
    // On the server, we can initialize the app but auth and db will be null
    // This can be useful for server-side admin tasks in the future, but for now it's inert
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = null;
    db = null;
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
    // Attempt a quick, low-cost read from a known, non-existent document.
    // This confirms not just network, but also Firebase service reachability.
    const healthCheckDoc = doc(db, '_internal', 'health_check');
    await getDoc(healthCheckDoc);
    await enableNetwork(db); // Ensure network is enabled if it was disabled.
    return true;
  } catch (error: any) {
    // Firestore throws 'unavailable' or 'offline' errors when it can't connect.
    console.warn("Firestore health check failed, client may be offline:", error.code);
    return false;
  }
}

export { app, auth, db };
