// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  getFirestore,
} from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
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
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = null;
    db = null;
}

/**
 * A more reliable way to check for a network connection with a timeout.
 * @returns {Promise<boolean>}
 */
export async function isReallyOnline(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return false;
  }
  try {
    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return navigator.onLine;
  }
}

export { app, auth, db };
